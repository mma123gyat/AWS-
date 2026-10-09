from datetime import UTC, datetime
from typing import Any

from src.repositories.dynamodb_client import table

_TABLE_ENV = "USERS_TABLE_NAME"
_TABLE_DEFAULT = "Users"


def _table():
    return table(_TABLE_ENV, _TABLE_DEFAULT)


def get_user_by_id(user_id: str) -> dict[str, Any] | None:
    response = _table().get_item(Key={"user_id": user_id})
    return response.get("Item")


def get_user_by_cognito_sub(cognito_sub: str) -> dict[str, Any] | None:
    response = _table().query(
        IndexName="cognito_sub-index",
        KeyConditionExpression="cognito_sub = :sub",
        ExpressionAttributeValues={":sub": cognito_sub},
        Limit=1,
    )
    items = response.get("Items", [])
    return items[0] if items else None


def list_students_by_class_id(class_id: str) -> list[dict[str, Any]]:
    response = _table().query(
        IndexName="class_id-index",
        KeyConditionExpression="class_id = :class_id AND #role = :role",
        ExpressionAttributeNames={"#role": "role"},
        ExpressionAttributeValues={":class_id": class_id, ":role": "STUDENT"},
    )
    return response.get("Items", [])


def create_user(
    user_id: str,
    cognito_sub: str,
    name: str,
    email: str,
    role: str,
    class_id: str | None = None,
    linked_student_id: str | None = None,
) -> dict[str, Any]:
    now = datetime.now(UTC).isoformat()
    item = {
        "user_id": user_id,
        "cognito_sub": cognito_sub,
        "name": name,
        "email": email,
        "role": role,
        "class_id": class_id,
        "linked_student_id": linked_student_id,
        "created_at": now,
        "updated_at": now,
    }
    _table().put_item(Item=item)
    return item
