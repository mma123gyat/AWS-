from typing import Any

MAX_TASKS_PER_PLAN = 4

_REQUIRED_PLAN_FIELDS = ("subject", "title", "total_minutes", "reason", "tasks")
_REQUIRED_TASK_FIELDS = ("order", "title", "minutes", "description")


class StudyPlanValidationError(ValueError):
    pass


def _require_type(value: Any, expected_type: type, field_name: str) -> None:
    if not isinstance(value, expected_type) or (expected_type is int and isinstance(value, bool)):
        raise StudyPlanValidationError(f"{field_name} must be of type {expected_type.__name__}")


def _validate_task(task: Any) -> dict:
    if not isinstance(task, dict):
        raise StudyPlanValidationError("each task must be an object")
    for field in _REQUIRED_TASK_FIELDS:
        if field not in task:
            raise StudyPlanValidationError(f"task is missing required field: {field}")

    _require_type(task["order"], int, "task.order")
    _require_type(task["title"], str, "task.title")
    _require_type(task["minutes"], int, "task.minutes")
    _require_type(task["description"], str, "task.description")

    if task["order"] <= 0:
        raise StudyPlanValidationError("task.order must be a positive integer")

    if task["minutes"] <= 0:
        raise StudyPlanValidationError("task.minutes must be positive")

    return {
        "order": task["order"],
        "title": task["title"],
        "minutes": task["minutes"],
        "description": task["description"],
    }


def validate_study_plan_output(data: Any) -> dict:
    """Validates a Bedrock tool-call payload against the study-plan shape.

    Raises StudyPlanValidationError on any violation; callers (bedrock_service)
    treat that as a generation failure and fall back to the rule-based plan.
    """
    if not isinstance(data, dict):
        raise StudyPlanValidationError("plan must be an object")
    for field in _REQUIRED_PLAN_FIELDS:
        if field not in data:
            raise StudyPlanValidationError(f"plan is missing required field: {field}")

    _require_type(data["subject"], str, "subject")
    _require_type(data["title"], str, "title")
    _require_type(data["total_minutes"], int, "total_minutes")
    _require_type(data["reason"], str, "reason")
    _require_type(data["tasks"], list, "tasks")

    if not data["tasks"]:
        raise StudyPlanValidationError("tasks must not be empty")
    if len(data["tasks"]) > MAX_TASKS_PER_PLAN:
        raise StudyPlanValidationError("too many tasks for a single session")

    tasks = [_validate_task(task) for task in data["tasks"]]
    if sum(task["minutes"] for task in tasks) > data["total_minutes"]:
        raise StudyPlanValidationError("sum of task minutes exceeds total_minutes")
    if len({task["order"] for task in tasks}) != len(tasks):
        raise StudyPlanValidationError("task.order must be unique within a plan")

    return {
        "subject": data["subject"],
        "title": data["title"],
        "total_minutes": data["total_minutes"],
        "reason": data["reason"],
        "tasks": tasks,
    }
