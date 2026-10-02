import pytest

from src.services import study_plan_service
from src.services.bedrock_service import BedrockGenerationError

BASE_PARAMS = {
    "grade": "中学2年",
    "subject": "数学",
    "school_topic": "一次関数",
    "student_topic": "比例・反比例",
    "understanding": 3,
    "available_minutes": 15,
}

VALID_BEDROCK_PLAN = {
    "subject": "数学",
    "title": "比例・反比例の復習",
    "total_minutes": 15,
    "reason": "理由",
    "tasks": [{"order": 1, "title": "確認", "minutes": 15, "description": "説明"}],
}


def test_uses_bedrock_result_when_available(monkeypatch):
    monkeypatch.setattr(study_plan_service, "generate_study_plan", lambda params: VALID_BEDROCK_PLAN)
    plan = study_plan_service.generate_plan(BASE_PARAMS, request_id="test-1")
    assert plan["generator"] == "BEDROCK"
    assert plan["total_minutes"] == 15


def test_falls_back_to_rule_based_on_bedrock_error(monkeypatch):
    def _raise(params):
        raise BedrockGenerationError("boom")

    monkeypatch.setattr(study_plan_service, "generate_study_plan", _raise)
    plan = study_plan_service.generate_plan(BASE_PARAMS, request_id="test-2")
    assert plan["generator"] == "RULE"
    assert plan["total_minutes"] <= BASE_PARAMS["available_minutes"]
