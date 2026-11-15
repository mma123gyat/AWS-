import pytest
from botocore.config import Config
from botocore.exceptions import ConnectTimeoutError, ReadTimeoutError

from src.services import bedrock_service
from src.services.bedrock_service import BedrockGenerationError, generate_study_plan

BASE_PARAMS = {
    "grade": "中学2年",
    "subject": "数学",
    "school_topic": "一次関数",
    "student_topic": "比例・反比例",
    "understanding": 3,
    "available_minutes": 15,
}

VALID_TOOL_INPUT = {
    "subject": "数学",
    "title": "比例・反比例の復習",
    "total_minutes": 15,
    "reason": "学校では一次関数まで進んでいるため、その前提となる内容を確認します。",
    "tasks": [
        {"order": 1, "title": "比例の基本を確認", "minutes": 5, "description": "比例の式とグラフの関係を確認します。"},
        {"order": 2, "title": "確認問題", "minutes": 10, "description": "基本問題を解いて理解度を確認します。"},
    ],
}


def _converse_response(tool_input: dict | None) -> dict:
    content = [{"toolUse": {"name": "submit_study_plan", "input": tool_input}}] if tool_input else []
    return {"output": {"message": {"content": content}}}


class _FakeClient:
    def __init__(self, response: dict):
        self._response = response

    def converse(self, **kwargs):
        return self._response


@pytest.fixture(autouse=True)
def _set_model_id(monkeypatch):
    monkeypatch.setenv("BEDROCK_MODEL_ID", "anthropic.claude-sonnet-5")


@pytest.mark.parametrize("region", [None, "us-west-2"])
def test_client_passes_timeout_and_retry_config_to_sdk(monkeypatch, region):
    if region is None:
        monkeypatch.delenv("AWS_REGION", raising=False)
    else:
        monkeypatch.setenv("AWS_REGION", region)
    monkeypatch.setenv("AWS_MAX_ATTEMPTS", "10")
    monkeypatch.setenv("AWS_RETRY_MODE", "adaptive")
    captured = {}
    fake_client = object()

    def _create_client(service_name, **kwargs):
        captured.update(service_name=service_name, **kwargs)
        return fake_client

    monkeypatch.setattr(bedrock_service.boto3, "client", _create_client)
    bedrock_service._client.cache_clear()
    try:
        assert bedrock_service._client() is fake_client
    finally:
        bedrock_service._client.cache_clear()

    assert captured["service_name"] == "bedrock-runtime"
    assert captured["region_name"] == (region or "ap-northeast-1")
    config = captured["config"]
    assert isinstance(config, Config)
    assert config.connect_timeout == 2
    assert config.read_timeout == 10
    assert config.retries == {"mode": "standard", "total_max_attempts": 1}


@pytest.mark.parametrize("timeout_type", [ConnectTimeoutError, ReadTimeoutError])
def test_wraps_sdk_timeout_as_bedrock_generation_error(monkeypatch, timeout_type):
    timeout = timeout_type(endpoint_url="https://bedrock.invalid")

    class _TimeoutClient:
        def converse(self, **kwargs):
            raise timeout

    monkeypatch.setattr(bedrock_service, "_client", lambda: _TimeoutClient())

    with pytest.raises(BedrockGenerationError) as exc_info:
        generate_study_plan(BASE_PARAMS)

    assert exc_info.value.__cause__ is timeout


def test_rejects_non_positive_available_minutes():
    with pytest.raises(ValueError):
        generate_study_plan({**BASE_PARAMS, "available_minutes": 0})


def test_returns_validated_plan_on_valid_tool_response(monkeypatch):
    monkeypatch.setattr(bedrock_service, "_client", lambda: _FakeClient(_converse_response(VALID_TOOL_INPUT)))
    plan = generate_study_plan(BASE_PARAMS)
    assert plan["subject"] == "数学"
    assert plan["total_minutes"] == 15


def test_raises_when_response_has_no_tool_use(monkeypatch):
    monkeypatch.setattr(bedrock_service, "_client", lambda: _FakeClient(_converse_response(None)))
    with pytest.raises(BedrockGenerationError):
        generate_study_plan(BASE_PARAMS)


def test_raises_when_tool_input_fails_schema_validation(monkeypatch):
    broken_input = {**VALID_TOOL_INPUT, "tasks": []}
    monkeypatch.setattr(bedrock_service, "_client", lambda: _FakeClient(_converse_response(broken_input)))
    with pytest.raises(BedrockGenerationError):
        generate_study_plan(BASE_PARAMS)


def test_system_prompt_requires_unambiguous_calculation_rules():
    prompt = bedrock_service._SYSTEM_PROMPT
    assert "絶対値" in prompt
    assert "符号" in prompt
    assert "等しい場合は0になる" in prompt
    assert "反転" in prompt


def test_prompt_version_bumped_from_previous_release():
    assert bedrock_service.PROMPT_VERSION == "v4-understanding-adaptive"
    assert bedrock_service.PROMPT_VERSION != "v3-math-rule-clarity"


def test_system_prompt_caps_understanding_adjustment_to_grade_unit_and_time():
    prompt = bedrock_service._SYSTEM_PROMPT
    assert "学年" in prompt
    assert "学習可能時間" in prompt


def test_system_prompt_requires_reason_and_tasks_to_match():
    prompt = bedrock_service._SYSTEM_PROMPT
    assert "応用的" in prompt
    assert "tasks" in prompt


def test_system_prompt_decouples_problem_difficulty_from_explanation_depth():
    """Problem difficulty follows the teacher's ai_parameters; explanation
    thoroughness (examples/hints/step-by-step) follows the student's own
    understanding. Both axes must be satisfiable at once, even when they
    point in different directions (e.g. low understanding + high teacher
    difficulty should keep the hard problems but add more scaffolding)."""
    prompt = bedrock_service._SYSTEM_PROMPT
    assert "独立した軸" in prompt
    assert "difficulty" in prompt
    assert "ヒント" in prompt


@pytest.mark.parametrize("understanding,expected_phrase", [
    (1, "具体例"),
    (1, "ヒント"),
    (2, "段階的"),
    (3, "応用的"),
    (4, "理由"),
    (5, "誤答の訂正"),
])
def test_user_message_reflects_understanding_level_guidance(understanding, expected_phrase):
    text = bedrock_service._build_user_message({**BASE_PARAMS, "understanding": understanding})
    assert f"本人の理解度(1〜5): {understanding}" in text
    assert expected_phrase in text


def test_understanding_guidance_differs_between_low_and_high():
    low_text = bedrock_service._build_user_message({**BASE_PARAMS, "understanding": 1})
    high_text = bedrock_service._build_user_message({**BASE_PARAMS, "understanding": 5})
    assert low_text != high_text
    assert "誤答の訂正" not in low_text
    assert "誤答の訂正" in high_text


@pytest.mark.parametrize(
    "teacher_difficulty,understanding,teacher_label_phrase,understanding_phrase",
    [
        (1, 5, "基礎の確認を中心にする", "誤答の訂正"),
        (5, 1, "無理のない範囲で応用問題に挑戦する", "具体例"),
    ],
)
def test_user_message_exposes_both_signals_when_teacher_setting_conflicts_with_understanding(
    teacher_difficulty, understanding, teacher_label_phrase, understanding_phrase
):
    """When teacher difficulty and student understanding disagree, both
    signals must still reach the prompt — the system prompt (not this
    function) tells the model how to reconcile them."""
    params = {
        **BASE_PARAMS,
        "understanding": understanding,
        "ai_parameters": {"difficulty": teacher_difficulty, "volume": 3, "supportLevel": 3},
    }
    text = bedrock_service._build_user_message(params)
    assert teacher_label_phrase in text
    assert understanding_phrase in text


def test_user_message_keeps_teacher_difficulty_while_adding_scaffolding_for_low_understanding():
    """The specific conflict called out by the product owner: understanding=1
    (student struggles) with teacher difficulty=5 (advanced). The problem
    difficulty label must still reflect the teacher's setting (not watered
    down), while the understanding guidance must add examples/hints/step-by-
    step explanation rather than simplifying the problems themselves."""
    params = {
        **BASE_PARAMS,
        "understanding": 1,
        "ai_parameters": {"difficulty": 5, "volume": 3, "supportLevel": 3},
    }
    text = bedrock_service._build_user_message(params)
    assert "無理のない範囲で応用問題に挑戦する" in text  # teacher's difficulty=5 label, unweakened
    assert "具体例" in text
    assert "ヒント" in text
    assert "段階的" in text

    prompt = bedrock_service._SYSTEM_PROMPT
    assert "問題の難易度は教員の設定を保ちつつ" in prompt


def test_raises_when_plan_exceeds_available_minutes(monkeypatch):
    over_budget = {**VALID_TOOL_INPUT, "total_minutes": 15, "tasks": VALID_TOOL_INPUT["tasks"]}
    monkeypatch.setattr(bedrock_service, "_client", lambda: _FakeClient(_converse_response(over_budget)))
    with pytest.raises(BedrockGenerationError):
        generate_study_plan({**BASE_PARAMS, "available_minutes": 10})
