from typing import Any

from src.repositories.dynamodb_client import table, table_name as _resolve_table_name

_TABLE_ENV = "STUDY_TASKS_TABLE_NAME"
_TABLE_DEFAULT = "StudyTasks"


def _table():
    return table(_TABLE_ENV, _TABLE_DEFAULT)


def table_name() -> str:
    return _resolve_table_name(_TABLE_ENV, _TABLE_DEFAULT)


def make_task_id(plan_id: str, task_order: int) -> str:
    return f"{plan_id}#{task_order}"


def parse_task_id(task_id: str) -> tuple[str, int]:
    plan_id, _, order = task_id.rpartition("#")
    return plan_id, int(order)


def list_tasks_by_plan(plan_id: str) -> list[dict[str, Any]]:
    response = _table().query(
        KeyConditionExpression="plan_id = :plan_id",
        ExpressionAttributeValues={":plan_id": plan_id},
        ConsistentRead=True,
    )
    return response.get("Items", [])


def get_task(plan_id: str, task_order: int) -> dict[str, Any] | None:
    response = _table().get_item(Key={"plan_id": plan_id, "task_order": task_order})
    return response.get("Item")


def build_task_item(
    plan_id: str,
    student_id: str,
    subject_id: str,
    unit_name: str,
    task_order: int,
    title: str,
    description: str,
    planned_minutes: int,
    status: str,
) -> dict[str, Any]:
    """Builds a StudyTasks item without writing it. The caller persists it
    (together with the owning plan's completion) inside a single transaction
    via study_plans_repository.complete_plan_with_tasks.
    """
    return {
        "task_id": make_task_id(plan_id, task_order),
        "plan_id": plan_id,
        "student_id": student_id,
        "subject_id": subject_id,
        "unit_name": unit_name,
        "task_order": task_order,
        "title": title,
        "description": description,
        "planned_minutes": planned_minutes,
        "status": status,
    }


def update_task_status(plan_id: str, task_order: int, status: str) -> None:
    _table().update_item(
        Key={"plan_id": plan_id, "task_order": task_order},
        UpdateExpression="SET #status = :status",
        ExpressionAttributeNames={"#status": "status"},
        ExpressionAttributeValues={":status": status},
    )
