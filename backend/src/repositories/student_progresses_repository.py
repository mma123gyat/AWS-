from datetime import UTC, datetime
from typing import Any

from src.repositories.dynamodb_client import table, table_name, to_attribute_map, transact_write_items
from src.repositories.users_repository import teacher_access_check

_TABLE_ENV = "STUDENT_PROGRESSES_TABLE_NAME"
_TABLE_DEFAULT = "StudentProgresses"


def _table():
    return table(_TABLE_ENV, _TABLE_DEFAULT)


def get_progress(student_id: str, subject_id: str) -> dict[str, Any] | None:
    response = _table().get_item(Key={"student_id": student_id, "subject_id": subject_id})
    return response.get("Item")


def list_progresses_by_student(student_id: str) -> list[dict[str, Any]]:
    response = _table().query(
        KeyConditionExpression="student_id = :student_id",
        ExpressionAttributeValues={":student_id": student_id},
    )
    return response.get("Items", [])


def put_progress(
    student_id: str,
    subject_id: str,
    unit_name: str,
    understanding: int,
    status: str,
    *,
    teacher: dict | None = None,
) -> dict[str, Any]:
    item = {
        "student_progress_id": f"{student_id}#{subject_id}",
        "student_id": student_id,
        "subject_id": subject_id,
        "unit_name": unit_name,
        "understanding": understanding,
        "status": status,
        "updated_at": datetime.now(UTC).isoformat(),
    }
    if teacher is None:
        # Admin seed callers retain their existing behavior.
        _table().put_item(Item=item)
    else:
        transact_write_items([
            teacher_access_check(teacher),
            {"ConditionCheck": {
                "TableName": table_name("USERS_TABLE_NAME", "Users"),
                "Key": to_attribute_map({"user_id": student_id}),
                "ConditionExpression": "#role = :student AND class_id = :class",
                "ExpressionAttributeNames": {"#role": "role"},
                "ExpressionAttributeValues": to_attribute_map({":student": "STUDENT", ":class": teacher["class_id"]}),
            }},
            {"Put": {"TableName": table_name(_TABLE_ENV, _TABLE_DEFAULT), "Item": to_attribute_map(item)}},
        ])
    return item
