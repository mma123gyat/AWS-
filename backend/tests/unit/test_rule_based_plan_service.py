import pytest

from src.services.rule_based_plan_service import generate_rule_based_plan

BASE_PARAMS = {
    "grade": "中学2年",
    "subject": "数学",
    "school_topic": "一次関数",
    "student_topic": "比例・反比例",
    "understanding": 3,
}


@pytest.mark.parametrize("minutes", [5, 15, 30])
def test_plan_never_exceeds_available_minutes(minutes):
    plan = generate_rule_based_plan({**BASE_PARAMS, "available_minutes": minutes})
    assert plan["total_minutes"] <= minutes
    assert sum(task["minutes"] for task in plan["tasks"]) == plan["total_minutes"]


def test_five_minutes_is_a_single_small_task():
    plan = generate_rule_based_plan({**BASE_PARAMS, "available_minutes": 5})
    assert len(plan["tasks"]) == 1


def test_fifteen_minutes_has_one_or_two_tasks():
    plan = generate_rule_based_plan({**BASE_PARAMS, "available_minutes": 15})
    assert 1 <= len(plan["tasks"]) <= 2


def test_thirty_minutes_does_not_pile_on_tasks():
    plan = generate_rule_based_plan({**BASE_PARAMS, "available_minutes": 30})
    assert len(plan["tasks"]) <= 4
