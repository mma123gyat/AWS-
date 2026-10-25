from datetime import UTC, datetime
from typing import Any

from src.repositories.dynamodb_client import table, table_name, to_attribute_map, transact_write_items

_TABLE_ENV = "CURRICULUMS_TABLE_NAME"
_TABLE_DEFAULT = "Curriculums"


def _table():
    return table(_TABLE_ENV, _TABLE_DEFAULT)


def get_curriculum(class_id: str, subject_id: str) -> dict[str, Any] | None:
    response = _table().get_item(Key={"class_id": class_id, "subject_id": subject_id})
    return response.get("Item")


def list_curriculums_by_class(class_id: str) -> list[dict[str, Any]]:
    response = _table().query(
        KeyConditionExpression="class_id = :class_id",
        ExpressionAttributeValues={":class_id": class_id},
    )
    return response.get("Items", [])


def put_curriculum(
    class_id: str,
    subject_id: str,
    unit_name: str,
    textbook_page: str,
    status: str,
    updated_by: str,
    *,
    teacher: dict | None = None,
) -> dict[str, Any]:
    item = {
        "curriculum_id": f"{class_id}#{subject_id}",
        "class_id": class_id,
        "subject_id": subject_id,
        "unit_name": unit_name,
        "textbook_page": textbook_page,
        "status": status,
        "updated_by": updated_by,
        "updated_at": datetime.now(UTC).isoformat(),
    }
    if teacher is None:
        # Admin seed callers retain their existing behavior.
        _table().put_item(Item=item)
    else:
        transact_write_items([
            {"ConditionCheck": {
                "TableName": table_name("USERS_TABLE_NAME", "Users"),
                "Key": to_attribute_map({"user_id": teacher["user_id"]}),
                "ConditionExpression": "#role = :teacher AND cognito_sub = :sub AND class_id = :class",
                "ExpressionAttributeNames": {"#role": "role"},
                "ExpressionAttributeValues": to_attribute_map({":teacher": "TEACHER", ":sub": teacher["cognito_sub"], ":class": class_id}),
            }},
            {"Put": {"TableName": table_name(_TABLE_ENV, _TABLE_DEFAULT), "Item": to_attribute_map(item)}},
        ])
    return item
