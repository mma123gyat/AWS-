import os
from functools import lru_cache
from typing import Any

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from src.models.study_plan_schema import StudyPlanValidationError, validate_study_plan_output

PROMPT_VERSION = "v1"

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

_SYSTEM_PROMPT = (
    "あなたは、学校に行きづらさを抱える中高生の自律学習を支援するAIです。\n"
    "以下のルールを必ず守ってください。\n"
    "- 指定された学習可能時間を超える提案をしない\n"
    "- 一度に大量の学習を提案しない\n"
    "- 学校の進度との差を煽らない。「遅れています」のような不安を強める表現は使わない\n"
    "- 学校の現在地ではなく、本人の現在地を出発点にする\n"
    "- 5分なら非常に小さな課題、15分なら1〜2タスク程度、30分でも多くしすぎない\n"
    "- 医療診断、精神状態の診断、登校すべきかどうかの判断、出席認定、成績決定、進級判断は行わない\n"
    "出力は必ず submit_study_plan ツールを使い、指定されたJSON構造のみで返してください。"
    "文章は日本語で、やさしく前向きな表現にしてください。"
)


class BedrockGenerationError(Exception):
    """Raised for any Bedrock call or output-validation failure.

    Callers (study_plan_service) must catch this and fall back to the
    rule-based generator rather than let it surface to the user — Bedrock
    being unavailable must never take down the study-plan feature.
    """


@lru_cache(maxsize=1)
def _client():
    # Budget roughly 12s for one Bedrock attempt within the 30s Lambda:
    # 2s to connect and 10s to read, leaving room for input DB reads,
    # rule-based fallback, transactional saving, and failure cleanup.
    # These are socket timeouts, not a hard deadline for the whole handler.
    # total_max_attempts includes the first call; 1 disables SDK retries
    # and backoff even if AWS_MAX_ATTEMPTS requests more attempts.
    return boto3.client(
        "bedrock-runtime",
        region_name=os.environ.get("AWS_REGION", "ap-northeast-1"),
        config=Config(
            connect_timeout=2,
            read_timeout=10,
            retries={"mode": "standard", "total_max_attempts": 1},
        ),
    )


def _build_user_message(params: dict[str, Any]) -> str:
    return (
        f"学年: {params['grade']}\n"
        f"教科: {params['subject']}\n"
        f"学校の現在地(学校で教えている単元): {params['school_topic']}\n"
        f"本人の現在地(本人が今取り組んでいる単元): {params['student_topic']}\n"
        f"本人の理解度(1〜5): {params['understanding']}\n"
        f"今日使える時間(分): {params['available_minutes']}\n"
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
            inferenceConfig={"maxTokens": 1024},
        )
    except (BotoCoreError, ClientError) as exc:
        raise BedrockGenerationError(f"Bedrock呼び出しに失敗しました: {exc}") from exc

    tool_input = _extract_tool_input(response)
    if tool_input is None:
        raise BedrockGenerationError("Bedrockからの応答に学習プランが含まれていませんでした。")

    try:
        plan = validate_study_plan_output(tool_input)
    except StudyPlanValidationError as exc:
        raise BedrockGenerationError(f"Bedrockの出力が不正な形式でした: {exc}") from exc

    if plan["total_minutes"] > available_minutes:
        raise BedrockGenerationError("Bedrockの提案が学習可能時間を超えていました。")

    return plan
