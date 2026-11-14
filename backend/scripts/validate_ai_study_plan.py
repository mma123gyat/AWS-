"""Validation harness for AI study-plan generation quality.

Calls `study_plan_service.generate_plan` directly with fictional condition
dicts — never `generate_plan_for_student` — so this script makes zero
DynamoDB calls and never touches real student data.

Two modes:
  --mode mock (default): replaces `bedrock_service._client` with a fake
    client. No AWS call is ever made. This only self-tests the harness
    (CSV output, cache, automatic checks, Bedrock/RULE branching) — a
    passing mock run does NOT mean the real AI proposals are good, because
    the "plan" content is synthetic, not a real Bedrock response.
  --mode real: calls the actual Bedrock Converse API (AWS charges apply).
    Requires typing "yes" at an interactive confirmation prompt that shows
    how many calls are new vs. reused from cache before any call is made.

Only `--mode real` rows are meaningful for human AI-quality evaluation;
`human_*` columns are pre-filled with "N/A(MOCK)" on mock rows so nobody
scores a fake response by mistake.

Usage (from backend/, with the venv active):
    python -m scripts.validate_ai_study_plan --mode mock
    python -m scripts.validate_ai_study_plan --mode real
"""

import argparse
import csv
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import boto3
from botocore.exceptions import BotoCoreError, ClientError, ReadTimeoutError
from dotenv import load_dotenv

from src.models.ai_parameters import plan_guidance
from src.models.study_plan_schema import MAX_TASKS_PER_PLAN
from src.services import bedrock_service, study_plan_service

load_dotenv()

OUTPUT_DIR = Path(__file__).resolve().parent / "validation_output"
CACHE_PATH = OUTPUT_DIR / "plan_cache.json"

# --mode real safety gate: the Bedrock client's resolved region/account must
# match School Bridge's project before any call. A shell's own AWS_REGION env
# var silently wins over .env (load_dotenv never overrides existing vars), so
# this must read the resolved value off the actual client, not os.environ.
EXPECTED_AWS_REGION = "ap-northeast-1"
EXPECTED_AWS_ACCOUNT_ID = "836533914233"  # Same account create_school_admin.py checks against.

# Distinct from any real deployed model id, so mock cache entries can never
# collide with real ones and CSV rows never look like a real model answered.
MOCK_MODEL_ID = "mock-client-self-test-v1"

# Two of the ten conditions are routed to a Bedrock-failure path so the
# harness demonstrably exercises the RULE fallback. Chosen from the
# non-paired (grade-breadth) conditions so the "vary one variable" pairs
# (P01-P03, P04-P06) stay on the BEDROCK path in mock mode.
MOCK_FALLBACK_CONDITIONS = {
    "P09": "timeout",
    "P10": "invalid_schema",
}

# Weak, non-authoritative signals only — never used to decide pass/fail.
# A human must still read the plan; these just flag what to look at first.
FORBIDDEN_PHRASES = ["遅れ", "足りない", "診断", "出席", "成績", "進級", "ダメ"]

CONDITIONS: list[dict[str, Any]] = [
    {
        "condition_id": "P01",
        "note": "基準条件（学校進度と本人進度が一致）",
        "grade": "中学1年",
        "subject": "数学",
        "school_topic": "正負の数",
        "student_topic": "正負の数",
        "understanding": 3,
        "available_minutes": 15,
        "ai_parameters": {"difficulty": 3, "volume": 3, "supportLevel": 3},
    },
    {
        "condition_id": "P02",
        "note": "理解度のみ変更（P01比・低）",
        "grade": "中学1年",
        "subject": "数学",
        "school_topic": "正負の数",
        "student_topic": "正負の数",
        "understanding": 1,
        "available_minutes": 15,
        "ai_parameters": {"difficulty": 3, "volume": 3, "supportLevel": 3},
    },
    {
        "condition_id": "P03",
        "note": "理解度のみ変更（P01比・高）",
        "grade": "中学1年",
        "subject": "数学",
        "school_topic": "正負の数",
        "student_topic": "正負の数",
        "understanding": 5,
        "available_minutes": 15,
        "ai_parameters": {"difficulty": 3, "volume": 3, "supportLevel": 3},
    },
    {
        "condition_id": "P04",
        "note": "学習時間ペアの起点（5分）",
        "grade": "中学2年",
        "subject": "数学",
        "school_topic": "一次関数",
        "student_topic": "一次関数",
        "understanding": 3,
        "available_minutes": 5,
        "ai_parameters": {"difficulty": 3, "volume": 3, "supportLevel": 3},
    },
    {
        "condition_id": "P05",
        "note": "学習時間のみ変更（P04比・15分）",
        "grade": "中学2年",
        "subject": "数学",
        "school_topic": "一次関数",
        "student_topic": "一次関数",
        "understanding": 3,
        "available_minutes": 15,
        "ai_parameters": {"difficulty": 3, "volume": 3, "supportLevel": 3},
    },
    {
        "condition_id": "P06",
        "note": "学習時間のみ変更（P04/P05比・30分）",
        "grade": "中学2年",
        "subject": "数学",
        "school_topic": "一次関数",
        "student_topic": "一次関数",
        "understanding": 3,
        "available_minutes": 30,
        "ai_parameters": {"difficulty": 3, "volume": 3, "supportLevel": 3},
    },
    {
        "condition_id": "P07",
        "note": "学校進度と本人進度が異なる",
        "grade": "中学3年",
        "subject": "英語",
        "school_topic": "関係代名詞",
        "student_topic": "現在完了形",
        "understanding": 2,
        "available_minutes": 15,
        "ai_parameters": {"difficulty": 3, "volume": 3, "supportLevel": 3},
    },
    {
        "condition_id": "P08",
        "note": "学校進度と本人進度が異なる（別教科）",
        "grade": "中学2年",
        "subject": "国語",
        "school_topic": "古文(枕草子)",
        "student_topic": "古文(竹取物語)",
        "understanding": 4,
        "available_minutes": 30,
        "ai_parameters": {"difficulty": 4, "volume": 3, "supportLevel": 5},
    },
    {
        "condition_id": "P09",
        "note": "学年の裾野（小学生）",
        "grade": "小学6年",
        "subject": "算数",
        "school_topic": "分数のわり算",
        "student_topic": "分数のわり算",
        "understanding": 3,
        "available_minutes": 5,
        "ai_parameters": {"difficulty": 3, "volume": 3, "supportLevel": 3},
    },
    {
        "condition_id": "P10",
        "note": "学年の裾野（高校生）",
        "grade": "高校1年",
        "subject": "数学",
        "school_topic": "二次関数",
        "student_topic": "二次関数",
        "understanding": 2,
        "available_minutes": 30,
        "ai_parameters": {"difficulty": 4, "volume": 2, "supportLevel": 3},
    },
]

HUMAN_COLUMNS = [
    "human_unit_alignment_score",
    "human_understanding_fit_score",
    "human_content_accuracy_score",
    "human_student_consideration_score",
    "human_overall_pass",
    "human_notes",
]

CSV_FIELDS = [
    "condition_id", "note", "grade", "subject", "school_topic", "student_topic", "understanding",
    "available_minutes", "ai_param_difficulty", "ai_param_volume", "ai_param_supportLevel",
    "run_mode", "invocation_type", "generator", "model_id", "prompt_version",
    "generated_at", "evaluated_at",
    "plan_title", "plan_reason", "plan_total_minutes", "plan_task_count", "tasks_json",
    "auto_time_within_available", "auto_time_within_guidance", "auto_task_count_within_guidance",
    "auto_task_count_within_max", "auto_minutes_sum_consistent", "auto_check_summary",
    "ref_forbidden_phrase_hit", "ref_forbidden_phrase_matches", "ref_student_topic_mentioned",
    *HUMAN_COLUMNS,
]

RUBRIC_TEXT = """# AI学習プラン品質評価ルーブリック（人間評価用）

対象: `run_mode=REAL` の行のみ。`run_mode=MOCK` の行は実際のBedrock応答ではないため評価しない。

## 共通尺度（1〜5点）
- 5: 申し分ない。欠点なし。
- 4: 良好。軽微な改善点はあるが合格水準。
- 3: 使えるが、修正が望ましい点がある。
- 2: 不十分。生徒に提示する前に修正が必要。
- 1: 不適切。生徒に提示してはならない内容。

## 評価項目
1. **単元との一致 (human_unit_alignment_score)**
   本人の現在地(student_topic)を出発点にしているか。学校の進度(school_topic)との差を煽る表現がないか。
2. **理解度への適合 (human_understanding_fit_score)**
   本人の理解度(1〜5)に対して、難易度・説明の量が適切か。
3. **内容の正確さ (human_content_accuracy_score)**
   教科内容として誤りがないか（計算・文法・用語等）。
4. **生徒への配慮 (human_student_consideration_score)**
   前向きで配慮のある表現か。診断・出欠・成績・進級に関する言及がないか。

参考指標（`ref_forbidden_phrase_hit`, `ref_student_topic_mentioned`）は見落としやすい箇所を示すヒントに過ぎず、
これだけで合否を判断しないこと。実際の文面（`plan_title`, `plan_reason`, `tasks_json`）を必ず読むこと。

## 合格条件 (human_overall_pass)
次のすべてを満たす場合に `PASS`、それ以外は `FAIL` を記入する。
- 4項目すべてが3点以上
- 「生徒への配慮」が4点以上
- いずれの項目も1点を含まない
"""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_params(condition: dict[str, Any]) -> dict[str, Any]:
    return {
        "grade": condition["grade"],
        "subject": condition["subject"],
        "school_topic": condition["school_topic"],
        "student_topic": condition["student_topic"],
        "understanding": condition["understanding"],
        "available_minutes": condition["available_minutes"],
        "ai_parameters": dict(condition["ai_parameters"]),
    }


def condition_hash(condition: dict[str, Any], run_mode: str, model_id: str, prompt_version: str) -> str:
    """Changing the model id or prompt version always invalidates the cache,
    so a stale result from a different model/prompt is never reused."""
    payload = {
        "condition_id": condition["condition_id"],
        "grade": condition["grade"],
        "subject": condition["subject"],
        "school_topic": condition["school_topic"],
        "student_topic": condition["student_topic"],
        "understanding": condition["understanding"],
        "available_minutes": condition["available_minutes"],
        "ai_parameters": condition["ai_parameters"],
        "run_mode": run_mode,
        "model_id": model_id,
        "prompt_version": prompt_version,
    }
    encoded = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def load_cache() -> dict[str, Any]:
    if not CACHE_PATH.exists():
        return {}
    return json.loads(CACHE_PATH.read_text(encoding="utf-8"))


def save_cache(cache: dict[str, Any]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")


class _FakeConverseClient:
    def __init__(self, response: dict[str, Any]):
        self._response = response

    def converse(self, **kwargs: Any) -> dict[str, Any]:
        return self._response


class _FakeTimeoutClient:
    def __init__(self, exc: Exception):
        self._exc = exc

    def converse(self, **kwargs: Any) -> dict[str, Any]:
        raise self._exc


def _build_mock_valid_tool_input(params: dict[str, Any]) -> dict[str, Any]:
    """A schema-valid, guidance-compliant synthetic plan. Content is
    deliberately labeled [MOCK] so it is never mistaken for a real
    Bedrock answer when a human reads the CSV."""
    guidance = plan_guidance(params)
    minutes = guidance["target_minutes"]
    count = guidance["task_count"]
    topic = params["student_topic"]
    tasks = [
        {
            "order": index + 1,
            "title": f"[MOCK]{topic}の確認{index + 1}",
            "minutes": minutes // count + (minutes % count if index == count - 1 else 0),
            "description": "モック応答です。検証ハーネスの自己診断用であり、実際のBedrock応答ではありません。",
        }
        for index in range(count)
    ]
    return {
        "subject": params["subject"],
        "title": f"[MOCK]{topic}の学習プラン",
        "total_minutes": sum(task["minutes"] for task in tasks),
        "reason": "モック応答です。検証ハーネスの自己診断用であり、実際のBedrock応答ではありません。",
        "tasks": tasks,
    }


def _mock_client_factory(condition: dict[str, Any]):
    """Returns a zero-arg factory matching the `bedrock_service._client`
    signature, routed to either a valid synthetic response or a failure
    that `bedrock_service.generate_study_plan` actually catches (the same
    BotoCoreError/ClientError and schema-validation paths it uses against
    real Bedrock), so the RULE-fallback test is exercised realistically."""
    outcome = MOCK_FALLBACK_CONDITIONS.get(condition["condition_id"], "valid")
    params = build_params(condition)

    if outcome == "timeout":
        exc = ReadTimeoutError(endpoint_url="https://bedrock-runtime.ap-northeast-1.amazonaws.com/mock")
        return lambda: _FakeTimeoutClient(exc)

    if outcome == "invalid_schema":
        broken_input = {
            "subject": params["subject"],
            "title": "[MOCK] broken response",
            "total_minutes": 10,
            "reason": "モック応答（検証ハーネスの自己診断用、スキーマ不正を意図的に発生させています）",
            "tasks": [],
        }
        response = {"output": {"message": {"content": [{"toolUse": {"name": "submit_study_plan", "input": broken_input}}]}}}
        return lambda: _FakeConverseClient(response)

    tool_input = _build_mock_valid_tool_input(params)
    response = {"output": {"message": {"content": [{"toolUse": {"name": "submit_study_plan", "input": tool_input}}]}}}
    return lambda: _FakeConverseClient(response)


def run_condition(condition: dict[str, Any], run_mode: str, cache: dict[str, Any], force: bool) -> dict[str, Any]:
    model_id_for_hash = MOCK_MODEL_ID if run_mode == "MOCK" else os.environ.get("BEDROCK_MODEL_ID", "unknown")
    prompt_version = bedrock_service.PROMPT_VERSION
    key = condition_hash(condition, run_mode, model_id_for_hash, prompt_version)

    if not force and key in cache:
        cached = cache[key]
        return {**cached, "invocation_type": "CACHED_REUSE", "evaluated_at": now_iso()}

    params = build_params(condition)
    request_id = f"validate-{condition['condition_id']}-{run_mode.lower()}"
    plan = study_plan_service.generate_plan(params, request_id)
    generated_at = now_iso()
    record = {
        "params": params,
        "plan": plan,
        "generator": plan["generator"],
        "model_id": plan["model_id"],
        "prompt_version": plan["prompt_version"],
        "generated_at": generated_at,
        "run_mode": run_mode,
    }
    cache[key] = record
    return {**record, "invocation_type": "NEW_GENERATION", "evaluated_at": generated_at}


def auto_checks(params: dict[str, Any], plan: dict[str, Any]) -> dict[str, Any]:
    """Objectively computable time/task-count constraints only. This is the
    sole automatic pass/fail signal — content quality is never auto-judged."""
    guidance = plan_guidance(params)
    total_minutes = plan["total_minutes"]
    tasks = plan["tasks"]
    task_minutes_sum = sum(task["minutes"] for task in tasks)

    checks = {
        "auto_time_within_available": total_minutes <= params["available_minutes"],
        "auto_time_within_guidance": total_minutes <= guidance["target_minutes"],
        "auto_task_count_within_guidance": len(tasks) <= guidance["task_count"],
        "auto_task_count_within_max": len(tasks) <= MAX_TASKS_PER_PLAN,
        "auto_minutes_sum_consistent": task_minutes_sum <= total_minutes,
    }
    checks["auto_check_summary"] = "PASS" if all(checks.values()) else "FAIL"
    return checks


def reference_signals(condition: dict[str, Any], plan: dict[str, Any]) -> dict[str, Any]:
    """Informational only — never used to decide pass/fail. Keyword scans
    have false positives/negatives; a human must read the actual text."""
    text = " ".join([
        plan["title"],
        plan["reason"],
        *(task["title"] for task in plan["tasks"]),
        *(task["description"] for task in plan["tasks"]),
    ])
    matches = [phrase for phrase in FORBIDDEN_PHRASES if phrase in text]
    return {
        "ref_forbidden_phrase_hit": bool(matches),
        "ref_forbidden_phrase_matches": ";".join(matches),
        "ref_student_topic_mentioned": condition["student_topic"] in text,
    }


def build_row(condition: dict[str, Any], params: dict[str, Any], result: dict[str, Any]) -> dict[str, Any]:
    plan = result["plan"]
    run_mode = result["run_mode"]
    row = {
        "condition_id": condition["condition_id"],
        "note": condition["note"],
        "grade": condition["grade"],
        "subject": condition["subject"],
        "school_topic": condition["school_topic"],
        "student_topic": condition["student_topic"],
        "understanding": condition["understanding"],
        "available_minutes": condition["available_minutes"],
        "ai_param_difficulty": condition["ai_parameters"]["difficulty"],
        "ai_param_volume": condition["ai_parameters"]["volume"],
        "ai_param_supportLevel": condition["ai_parameters"]["supportLevel"],
        "run_mode": run_mode,
        "invocation_type": result["invocation_type"],
        "generator": result["generator"],
        "model_id": result["model_id"],
        "prompt_version": result["prompt_version"],
        "generated_at": result["generated_at"],
        "evaluated_at": result["evaluated_at"],
        "plan_title": plan["title"],
        "plan_reason": plan["reason"],
        "plan_total_minutes": plan["total_minutes"],
        "plan_task_count": len(plan["tasks"]),
        "tasks_json": json.dumps(plan["tasks"], ensure_ascii=False),
        **auto_checks(params, plan),
        **reference_signals(condition, plan),
    }
    is_mock = run_mode == "MOCK"
    for column in HUMAN_COLUMNS:
        row[column] = "N/A(MOCK)" if is_mock else ""
    return row


def write_csv(rows: list[dict[str, Any]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def write_rubric(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(RUBRIC_TEXT, encoding="utf-8")


def build_summary(rows: list[dict[str, Any]]) -> str:
    bedrock_rows = [r for r in rows if r["generator"] == "BEDROCK"]
    rule_rows = [r for r in rows if r["generator"] == "RULE"]
    new_rows = [r for r in rows if r["invocation_type"] == "NEW_GENERATION"]
    cached_rows = [r for r in rows if r["invocation_type"] == "CACHED_REUSE"]
    auto_fail_rows = [r for r in rows if r["auto_check_summary"] == "FAIL"]

    lines = [
        f"総条件数: {len(rows)}",
        f"Bedrock生成件数: {len(bedrock_rows)}",
        f"RULEフォールバック件数: {len(rule_rows)}",
        f"新規生成: {len(new_rows)} / キャッシュ再利用: {len(cached_rows)}",
        "自動チェックFAIL: " + (
            f"{len(auto_fail_rows)}件 ({', '.join(r['condition_id'] for r in auto_fail_rows)})"
            if auto_fail_rows else "0件"
        ),
    ]
    if any(r["run_mode"] == "MOCK" for r in rows):
        lines.append(
            "注意: run_mode=MOCK の行は本物のBedrock応答ではありません。"
            "AI提案品質の評価には使用せず、human_* 列は N/A(MOCK) のままにしてください。"
        )
    return "\n".join(lines)


def verify_safety_preconditions() -> None:
    """Aborts before any Bedrock call if the region the Bedrock client will
    actually use, or the AWS account STS resolves to, is not School Bridge's
    project (ap-northeast-1 / 836533914233). Never prints credential secrets."""
    client = bedrock_service._client()
    actual_region = client.meta.region_name
    if actual_region != EXPECTED_AWS_REGION:
        raise SystemExit(
            "安全チェック失敗: Bedrockクライアントのリージョンが想定と異なります。"
            f"(実際: {actual_region}, 想定: {EXPECTED_AWS_REGION}) "
            "Bedrockへの呼び出しは行っていません。"
        )

    try:
        account = boto3.client("sts", region_name=EXPECTED_AWS_REGION).get_caller_identity()["Account"]
    except (BotoCoreError, ClientError) as exc:
        raise SystemExit(f"安全チェック失敗: AWS認証情報を取得できませんでした: {exc}") from exc

    if account != EXPECTED_AWS_ACCOUNT_ID:
        raise SystemExit(
            "安全チェック失敗: 接続先AWSアカウントが想定と異なります。"
            f"(実際: {account}, 想定: {EXPECTED_AWS_ACCOUNT_ID}) "
            "Bedrockへの呼び出しは行っていません。"
        )

    print(f"安全チェックOK: region={actual_region}, account={account}")


def confirm_real_run(new_count: int, cached_count: int, model_id: str, region: str) -> bool:
    print("これから実際のBedrock呼び出しを行います。AWS課金が発生します。")
    print(f"  新規呼び出し: {new_count}件（課金対象）")
    print(f"  キャッシュ再利用: {cached_count}件（呼び出しなし・課金なし）")
    print(f"  モデルID: {model_id}")
    print(f"  リージョン: {region}")
    answer = input("続行する場合は yes と入力してください: ")
    return answer.strip().lower() == "yes"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--mode", choices=["mock", "real"], default="mock")
    parser.add_argument("--force-regenerate", action="store_true")
    parser.add_argument("--output", type=Path, default=None)
    args = parser.parse_args()

    run_mode = args.mode.upper()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    output_path = args.output or (OUTPUT_DIR / f"results_{timestamp}.csv")

    cache = load_cache()
    original_client = bedrock_service._client
    original_model_id = os.environ.get("BEDROCK_MODEL_ID")

    rows: list[dict[str, Any]] = []
    try:
        if run_mode == "MOCK":
            print("=== MOCKモード: AWSへの通信は一切行いません（ハーネス自己診断、AI品質検証ではありません） ===")
            os.environ["BEDROCK_MODEL_ID"] = MOCK_MODEL_ID
        else:
            if "BEDROCK_MODEL_ID" not in os.environ:
                raise SystemExit("BEDROCK_MODEL_ID が設定されていません。.env を確認してください。")
            verify_safety_preconditions()
            model_id = os.environ["BEDROCK_MODEL_ID"]
            prompt_version = bedrock_service.PROMPT_VERSION
            new_ids, cached_ids = [], []
            for condition in CONDITIONS:
                key = condition_hash(condition, run_mode, model_id, prompt_version)
                target = cached_ids if (key in cache and not args.force_regenerate) else new_ids
                target.append(condition["condition_id"])
            region = os.environ.get("AWS_REGION", "ap-northeast-1")
            if not confirm_real_run(len(new_ids), len(cached_ids), model_id, region):
                print("中止しました。Bedrockへの呼び出しは行っていません。")
                return

        for condition in CONDITIONS:
            if run_mode == "MOCK":
                bedrock_service._client = _mock_client_factory(condition)
            params = build_params(condition)
            result = run_condition(condition, run_mode, cache, args.force_regenerate)
            rows.append(build_row(condition, params, result))
            save_cache(cache)
    finally:
        bedrock_service._client = original_client
        if run_mode == "MOCK":
            if original_model_id is None:
                os.environ.pop("BEDROCK_MODEL_ID", None)
            else:
                os.environ["BEDROCK_MODEL_ID"] = original_model_id

    write_csv(rows, output_path)
    rubric_path = OUTPUT_DIR / "evaluation_rubric.md"
    write_rubric(rubric_path)
    summary_path = OUTPUT_DIR / f"summary_{timestamp}.txt"
    summary_text = build_summary(rows)
    summary_path.write_text(summary_text, encoding="utf-8")

    print(summary_text)
    print(f"CSV: {output_path}")
    print(f"ルーブリック: {rubric_path}")
    print(f"サマリ: {summary_path}")


if __name__ == "__main__":
    main()
