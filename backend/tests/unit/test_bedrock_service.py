import pytest

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


def test_raises_when_plan_exceeds_available_minutes(monkeypatch):
    over_budget = {**VALID_TOOL_INPUT, "total_minutes": 15, "tasks": VALID_TOOL_INPUT["tasks"]}
    monkeypatch.setattr(bedrock_service, "_client", lambda: _FakeClient(_converse_response(over_budget)))
    with pytest.raises(BedrockGenerationError):
        generate_study_plan({**BASE_PARAMS, "available_minutes": 10})
