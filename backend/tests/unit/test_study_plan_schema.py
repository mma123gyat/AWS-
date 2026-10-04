import pytest

from src.models.study_plan_schema import StudyPlanValidationError, validate_study_plan_output

VALID_PAYLOAD = {
    "subject": "数学",
    "title": "比例・反比例の復習",
    "total_minutes": 15,
    "reason": "学校では一次関数まで進んでいるため、その前提となる内容を確認します。",
    "tasks": [
        {"order": 1, "title": "比例の基本を確認", "minutes": 5, "description": "比例の式とグラフの関係を確認します。"},
        {"order": 2, "title": "確認問題", "minutes": 10, "description": "基本問題を解いて理解度を確認します。"},
    ],
}


def test_accepts_valid_payload():
    plan = validate_study_plan_output(VALID_PAYLOAD)
    assert plan["total_minutes"] == 15
    assert len(plan["tasks"]) == 2


def test_rejects_empty_tasks():
    payload = {**VALID_PAYLOAD, "tasks": []}
    with pytest.raises(StudyPlanValidationError):
        validate_study_plan_output(payload)


def test_rejects_too_many_tasks():
    task_template = VALID_PAYLOAD["tasks"][0]
    payload = {**VALID_PAYLOAD, "tasks": [{**task_template, "order": i} for i in range(1, 6)]}
    with pytest.raises(StudyPlanValidationError):
        validate_study_plan_output(payload)


def test_rejects_task_minutes_sum_exceeding_total():
    payload = {**VALID_PAYLOAD, "total_minutes": 10}
    with pytest.raises(StudyPlanValidationError):
        validate_study_plan_output(payload)


def test_rejects_non_positive_task_minutes():
    task_template = VALID_PAYLOAD["tasks"][0]
    payload = {**VALID_PAYLOAD, "tasks": [{**task_template, "minutes": 0}]}
    with pytest.raises(StudyPlanValidationError):
        validate_study_plan_output(payload)


def test_rejects_zero_task_order():
    task_template = VALID_PAYLOAD["tasks"][0]
    payload = {**VALID_PAYLOAD, "tasks": [{**task_template, "order": 0}]}
    with pytest.raises(StudyPlanValidationError):
        validate_study_plan_output(payload)


def test_rejects_negative_task_order():
    task_template = VALID_PAYLOAD["tasks"][0]
    payload = {**VALID_PAYLOAD, "tasks": [{**task_template, "order": -1}]}
    with pytest.raises(StudyPlanValidationError):
        validate_study_plan_output(payload)


def test_rejects_duplicate_task_order():
    task_template = VALID_PAYLOAD["tasks"][0]
    payload = {
        **VALID_PAYLOAD,
        "tasks": [{**task_template, "order": 1}, {**task_template, "order": 1}],
    }
    with pytest.raises(StudyPlanValidationError):
        validate_study_plan_output(payload)


def test_rejects_missing_required_field():
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "reason"}
    with pytest.raises(StudyPlanValidationError):
        validate_study_plan_output(payload)


def test_rejects_wrong_type():
    payload = {**VALID_PAYLOAD, "total_minutes": "15"}
    with pytest.raises(StudyPlanValidationError):
        validate_study_plan_output(payload)
