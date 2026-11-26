import os
import sys
from functools import lru_cache
from typing import Any

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from src.models.study_plan_schema import StudyPlanValidationError, validate_study_plan_output
from src.models.ai_parameters import plan_guidance

PROMPT_VERSION = "v5-task-completeness"

_TOOL_NAME = "submit_study_plan"
_TOOL_INPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "subject": {"type": "string"},
        "title": {"type": "string"},
        "total_minutes": {"type": "integer"},
        "reason": {"type": "string"},
        "tasks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "order": {"type": "integer"},
                    "title": {"type": "string"},
                    "minutes": {"type": "integer"},
                    "description": {"type": "string"},
                },
                "required": ["order", "title", "minutes", "description"],
            },
        },
    },
    "required": ["subject", "title", "total_minutes", "reason", "tasks"],
}

UNDERSTANDING_GUIDANCE = {
    1: "基礎の復習を中心に、具体例やヒントを使い、手順を1つずつ区切って段階的に説明する",
    2: "基礎の復習と具体例を中心に、ヒントを交えながら手順を段階的に説明する",
    3: "基礎の確認と、少し応用的な問題を組み合わせる",
    4: "基礎を踏まえつつ、複数の計算を組み合わせた問題や理由を説明させる問題を取り入れる",
    5: "複数の計算を組み合わせた問題、誤答の訂正、理由の説明を求める問題など、理解を深める問題を優先する",
}

_SYSTEM_PROMPT = (
    "あなたは、学校に行きづらさを抱える中高生の自律学習を支援するAIです。\n"
    "以下のルールを必ず守ってください。\n"
    "- 指定された学習可能時間を超える提案をしない\n"
    "- 一度に大量の学習を提案しない\n"
    "- 学校の進度との差を煽らない。「遅れています」のような不安を強める表現は使わない\n"
    "- 学校の現在地ではなく、本人の現在地を出発点にする\n"
    "- 5分なら非常に小さな課題、15分なら1〜2タスク程度、30分でも多くしすぎない\n"
    "- 医療診断、精神状態の診断、登校すべきかどうかの判断、出席認定、成績決定、進級判断は行わない\n"
    "- 計算規則を説明するときは、基準が不明確な言い回し（例:「大きい方から引く」）を避け、"
    "誰が読んでも同じ手順を再現できる具体的な説明にする。正負の数の加法・減法では、"
    "異符号の加法は「絶対値の差を求め、絶対値が大きい方の符号を採用する"
    "（絶対値が等しい場合は0になる）」こと、減法は「引く数の符号を反転し、加法に直して考える」ことを明示する\n"
    "- 本人の理解度に応じて難易度や説明の仕方を調整してよいが、学年・単元の範囲や指定された学習可能時間を超える難易度にはしない\n"
    "- 問題の難易度（何を問うか）は教員が設定したdifficulty・volumeを基準にする。説明の丁寧さ・具体例・"
    "ヒントの出し方（どう説明するか）は本人の理解度に応じて調整してよい。この2つは独立した軸として扱い、"
    "矛盾する場合も両方を同時に満たすこと。特に本人の理解度が低く教員のdifficulty設定が高い場合は、"
    "問題の難易度は教員の設定を保ちつつ、具体例・ヒント・段階的な説明を手厚くする\n"
    "- 生成理由(reason)に「応用的」「発展的」などの特徴を記載する場合は、実際のtasksの内容にもその特徴が表れるようにする\n"
    # v5: maxTokens=1024は変更しないため、問題数を具体的に書き切れる範囲に抑え、
    # 手順説明の重複を減らすことで出力トークン予算とのバランスを取る。
    "- タスクの説明(description)で「○問」のように問題数を示す場合は、「次のような問題」のような例示だけで済ませず、"
    "独立した具体的な式・問題文をその数だけすべて明記する。問題数は学習可能時間と教員の学習量設定の範囲に収め、"
    "最初から無理なく全問書き切れる数に設定する（数を増やすこと自体を目的にしない。書き切れない場合は問題数を減らす）\n"
    "- 本人が「今日やること」を読むだけで今すぐ取り組めるように、問題は具体的な数値・式をそのまま提示する。"
    "本人が自分で問題を探したり作ったりする必要がある書き方にしない\n"
    "- 誤りを訂正させる問題では、誤った式と誤った答えをAI自身が示し、本人には「どこが間違っているか」と"
    "「正しい答え」を考えさせる。誤った例を本人に作らせない\n"
    "- 解き方の手順説明は1回書けば十分で、同じ説明を問題ごとに繰り返さない。各問題の文章は簡潔にし、"
    "出力全体が長くなりすぎないようにする\n"
    "出力は必ず submit_study_plan ツールを使い、指定されたJSON構造のみで返してください。"
    "文章は日本語で、やさしく前向きな表現にしてください。"
)


class BedrockGenerationError(Exception):
    """Raised for any Bedrock call or output-validation failure.

    Callers (study_plan_service) must catch this and fall back to the
    rule-based generator rather than let it surface to the user — Bedrock
    being unavailable must never take down the study-plan feature.
    """


_DEFAULT_READ_TIMEOUT_SECONDS = 10
_MIN_READ_TIMEOUT_SECONDS = 1
_MAX_READ_TIMEOUT_SECONDS = 300


def _resolve_read_timeout_seconds() -> int:
    """BEDROCK_READ_TIMEOUT_SECONDS overrides the 10s default read timeout.

    This exists for local diagnosis of Bedrock Read timeouts (e.g. via
    scripts/validate_ai_study_plan.py) — it is not wired into CDK
    (infrastructure/lib/api-stack.ts's commonEnv has no such key), so
    production Lambdas never see it unless someone sets it there by hand,
    outside CDK. Doing that DOES change production behavior: the Lambda's
    hard timeout is 30s, and connect_timeout(2s) + read_timeout + DB
    reads/writes + rule-based fallback all have to fit inside it, so a
    large value risks the whole handler timing out instead of falling
    back to the rule-based generator cleanly. Only set this for
    verification runs, never on the deployed Lambda.

    Invalid values (non-integer, <= 0, or > 300s) fall back to the
    default and log a warning to stderr rather than raising, so a bad
    value can never crash a Lambda cold start.
    """
    raw = os.environ.get("BEDROCK_READ_TIMEOUT_SECONDS")
    if raw is None:
        return _DEFAULT_READ_TIMEOUT_SECONDS

    try:
        value = int(raw)
    except ValueError:
        print(
            f"BEDROCK_READ_TIMEOUT_SECONDS={raw!r} は整数として解釈できません。"
            f"デフォルト値 {_DEFAULT_READ_TIMEOUT_SECONDS}秒 を使用します。",
            file=sys.stderr,
        )
        return _DEFAULT_READ_TIMEOUT_SECONDS

    if value < _MIN_READ_TIMEOUT_SECONDS or value > _MAX_READ_TIMEOUT_SECONDS:
        print(
            f"BEDROCK_READ_TIMEOUT_SECONDS={value} は許容範囲"
            f"({_MIN_READ_TIMEOUT_SECONDS}〜{_MAX_READ_TIMEOUT_SECONDS}秒)外です。"
            f"デフォルト値 {_DEFAULT_READ_TIMEOUT_SECONDS}秒 を使用します。",
            file=sys.stderr,
        )
        return _DEFAULT_READ_TIMEOUT_SECONDS

    return value


@lru_cache(maxsize=1)
def _client():
    # Budget roughly 12s for one Bedrock attempt within the 30s Lambda:
    # 2s to connect and 10s to read (by default), leaving room for input
    # DB reads, rule-based fallback, transactional saving, and failure
    # cleanup. These are socket timeouts, not a hard deadline for the
    # whole handler. total_max_attempts includes the first call; 1
    # disables SDK retries and backoff even if AWS_MAX_ATTEMPTS requests
    # more attempts.
    #
    # Cache note: this function is lru_cache(maxsize=1)'d, same as
    # AWS_REGION below. Once called in a process, changing
    # BEDROCK_READ_TIMEOUT_SECONDS afterwards has no effect until
    # _client.cache_clear() is called — matters for tests/REPL use, not
    # for a fresh Lambda cold start or a one-shot script.
    return boto3.client(
        "bedrock-runtime",
        region_name=os.environ.get("AWS_REGION", "ap-northeast-1"),
        config=Config(
            connect_timeout=2,
            read_timeout=_resolve_read_timeout_seconds(),
            retries={"mode": "standard", "total_max_attempts": 1},
        ),
    )


def _build_user_message(params: dict[str, Any]) -> str:
    guidance = plan_guidance(params)
    settings = guidance["settings"]
    return (
        f"学年: {params['grade']}\n"
        f"教科: {params['subject']}\n"
        f"学校の現在地(学校で教えている単元): {params['school_topic']}\n"
        f"本人の現在地(本人が今取り組んでいる単元): {params['student_topic']}\n"
        f"本人の理解度(1〜5): {params['understanding']}。{UNDERSTANDING_GUIDANCE[params['understanding']]}。\n"
        f"今日使える時間(分): {params['available_minutes']}\n"
        f"教員の難易度設定(1〜5): {settings['difficulty']}。{guidance['difficulty']}。\n"
        f"教員の学習量設定(1〜5): {settings['volume']}。{guidance['practice']}。\n"
        f"プラン全体は{guidance['target_minutes']}分以内、タスクは{guidance['task_count']}個以内にしてください。\n"
        f"教員のサポート設定(1〜5): {settings['supportLevel']}。{guidance['support']}。\n"
        "教員の設定によって本人の理解度や学習可能時間を書き換えないでください。\n"
        "本人の現在地を起点に、今日使える時間内で終わる学習プランを提案してください。"
    )


def _extract_tool_input(response: dict) -> dict | None:
    content_blocks = response.get("output", {}).get("message", {}).get("content", [])
    for block in content_blocks:
        if "toolUse" in block:
            return block["toolUse"].get("input")
    return None


def generate_study_plan(params: dict[str, Any]) -> dict:
    """Calls Bedrock Converse API with a forced tool call to get structured JSON,
    then validates it against StudyPlanOutput. `params` must contain: grade,
    subject, school_topic, student_topic, understanding, available_minutes.
    """
    available_minutes = params["available_minutes"]
    if available_minutes <= 0:
        raise ValueError("available_minutes must be positive; a rest day must not reach this function")

    model_id = os.environ["BEDROCK_MODEL_ID"]

    try:
        response = _client().converse(
            modelId=model_id,
            system=[{"text": _SYSTEM_PROMPT}],
            messages=[{"role": "user", "content": [{"text": _build_user_message(params)}]}],
            toolConfig={
                "tools": [
                    {
                        "toolSpec": {
                            "name": _TOOL_NAME,
                            "description": "今日の学習プランを提出する",
                            "inputSchema": {"json": _TOOL_INPUT_SCHEMA},
                        }
                    }
                ],
                "toolChoice": {"tool": {"name": _TOOL_NAME}},
            },
            inferenceConfig={"maxTokens": 2048},
        )
    except (BotoCoreError, ClientError) as exc:
        raise BedrockGenerationError(f"Bedrock呼び出しに失敗しました: {exc}") from exc

    tool_input = _extract_tool_input(response)

    if tool_input is None:
        raise BedrockGenerationError(
            "Bedrockからの応答に学習プランが含まれていませんでした。"
        )

    try:
        plan = validate_study_plan_output(tool_input)
    except StudyPlanValidationError as exc:
        raise BedrockGenerationError(
            f"Bedrockの出力が不正な形式でした: {exc}"
        ) from exc

    if plan["total_minutes"] > available_minutes:
        raise BedrockGenerationError(
            "Bedrockの提案が学習可能時間を超えていました。"
        )

    guidance = plan_guidance(params)
    if (
        plan["total_minutes"] > guidance["target_minutes"]
        or len(plan["tasks"]) > guidance["task_count"]
    ):
        raise BedrockGenerationError(
            "Bedrockの提案が教員の学習量設定を超えていました。"
        )

    return plan
