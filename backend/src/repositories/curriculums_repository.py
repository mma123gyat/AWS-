from datetime import UTC, datetime
from typing import Any

from src.repositories.dynamodb_client import table

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
    _table().put_item(Item=item)
    return item
