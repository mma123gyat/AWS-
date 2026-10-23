import uuid
from datetime import UTC, datetime
from typing import Any

from botocore.exceptions import ClientError

from src.repositories import study_plans_repository, study_tasks_repository
from src.repositories.dynamodb_client import table, table_name, to_attribute_map, transact_write_items
from src.utils.dates import today_jst
from src.utils.errors import ConflictError

_TABLE_ENV = "STUDY_RECORDS_TABLE_NAME"
_TABLE_DEFAULT = "StudyRecords"


def _table():
    return table(_TABLE_ENV, _TABLE_DEFAULT)


def _build_record(
    student_id: str,
    task_id: str,
    subject_id: str,
    unit_name: str,
    actual_minutes: int,
    understanding: int,
) -> dict[str, Any]:
    completed_at = datetime.now(UTC).isoformat()
    return {
        "record_id": str(uuid.uuid4()),
        "student_id": student_id,
        "sort_key": f"{completed_at}#{task_id}",
        "task_id": task_id,
        "subject_id": subject_id,
        "unit_name": unit_name,
        "actual_minutes": actual_minutes,
        "understanding": understanding,
        "completed_at": completed_at,
    }


def put_record(
    student_id: str,
    task_id: str,
    subject_id: str,
    unit_name: str,
    actual_minutes: int,
    understanding: int,
) -> dict[str, Any]:
    item = _build_record(student_id, task_id, subject_id, unit_name, actual_minutes, understanding)
    _table().put_item(Item=item)
    return item


def _replay_record(record: dict[str, Any], actual_minutes: int, understanding: int) -> dict[str, Any]:
    if record["actual_minutes"] != actual_minutes or record["understanding"] != understanding:
        raise ConflictError("このタスクはすでに記録済みです。画面を再読み込みしてください。")
    return record


def complete_task_with_record(
    student_id: str,
    task: dict[str, Any],
    actual_minutes: int,
    understanding: int,
) -> dict[str, Any]:
    """One completion per task. Persist the record and COMPLETED status together.

    Store the canonical result on the task so retries after a lost response
    can return the same record without adding to the parent's learning totals.
    The conditional task update also arbitrates concurrent/stale requests.
    """
    if task.get("completion_record"):
        return _replay_record(task["completion_record"], actual_minutes, understanding)

    today = today_jst()
    active_plan = study_plans_repository.get_plan(student_id, today)
    if (
        not active_plan or active_plan.get("plan_id") != task["plan_id"]
        or active_plan.get("status") not in (None, "COMPLETED")
        or not active_plan.get("available_minutes")
    ):
        raise ConflictError("学習プランが切り替わっています。画面を再読み込みしてください。")

    record = _build_record(
        student_id, task["task_id"], task["subject_id"], task["unit_name"],
        actual_minutes, understanding,
    )
    task_update = {
        "Update": {
            "TableName": study_tasks_repository.table_name(),
            "Key": to_attribute_map({"plan_id": task["plan_id"], "task_order": task["task_order"]}),
            "UpdateExpression": "SET #status = :completed, completion_record = :record",
            "ConditionExpression": (
                "attribute_exists(plan_id) AND student_id = :student_id"
                " AND attribute_not_exists(completion_record)"
            ),
            "ExpressionAttributeNames": {"#status": "status"},
            "ExpressionAttributeValues": to_attribute_map({
                ":completed": "COMPLETED", ":record": record, ":student_id": student_id,
            }),
        }
    }
    record_put = {
        "Put": {
            "TableName": table_name(_TABLE_ENV, _TABLE_DEFAULT),
            "Item": to_attribute_map(record),
            "ConditionExpression": "attribute_not_exists(student_id) AND attribute_not_exists(sort_key)",
        }
    }
    active_plan_check = {"ConditionCheck": {
        "TableName": study_plans_repository.table_name(),
        "Key": to_attribute_map({"student_id": student_id, "plan_date": today}),
        "ConditionExpression": "plan_id = :plan_id AND (#status = :completed OR attribute_not_exists(#status))",
        "ExpressionAttributeNames": {"#status": "status"},
        "ExpressionAttributeValues": to_attribute_map({":plan_id": task["plan_id"], ":completed": "COMPLETED"}),
    }}
    condition_check = {"ConditionCheck": {
        "TableName": table_name("DAILY_CONDITIONS_TABLE_NAME", "DailyConditions"),
        "Key": to_attribute_map({"student_id": student_id, "date": today}),
        "ConditionExpression": "available_minutes = :minutes",
        "ExpressionAttributeValues": to_attribute_map({":minutes": active_plan["available_minutes"]}),
    }}
    try:
        transact_write_items([task_update, record_put, active_plan_check, condition_check])
    except ClientError as exc:
        reasons = exc.response.get("CancellationReasons", [])
        if exc.response.get("Error", {}).get("Code") != "TransactionCanceledException" or not any(
            reason.get("Code") == "ConditionalCheckFailed" for reason in reasons
        ):
            raise
        # A concurrent request may have committed since the handler read the task.
        refreshed = study_tasks_repository.get_task(task["plan_id"], task["task_order"])
        if refreshed and refreshed.get("student_id") == student_id and refreshed.get("completion_record"):
            return _replay_record(refreshed["completion_record"], actual_minutes, understanding)
        raise ConflictError("タスクの状態が変わりました。画面を再読み込みして、もう一度お試しください。") from exc
    return record


def list_records_by_student(student_id: str, limit: int = 50) -> list[dict[str, Any]]:
    response = _table().query(
        KeyConditionExpression="student_id = :student_id",
        ExpressionAttributeValues={":student_id": student_id},
        ScanIndexForward=False,
        Limit=limit,
    )
    return response.get("Items", [])
