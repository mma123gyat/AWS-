import uuid
from datetime import UTC, datetime
from typing import Any

from src.repositories.dynamodb_client import table, table_name, to_attribute_map, transact_write_items
from src.repositories.sharing_settings_repository import actor_check

_TABLE_ENV = "MESSAGES_TABLE_NAME"
_TABLE_DEFAULT = "Messages"


def _table():
    return table(_TABLE_ENV, _TABLE_DEFAULT)


def _message(student_id: str, sender_user_id: str, sender_role: str, body: str) -> dict[str, Any]:
    created_at = datetime.now(UTC).isoformat()
    message_id = str(uuid.uuid4())
    item = {
        "message_id": message_id,
        "student_id": student_id,
        "sort_key": f"{created_at}#{message_id}",
        "sender_user_id": sender_user_id,
        "sender_role": sender_role,
        "body": body,
        "created_at": created_at,
    }
    return item


def put_message(student_id: str, sender_user_id: str, sender_role: str, body: str) -> dict[str, Any]:
    item = _message(student_id, sender_user_id, sender_role, body)
    _table().put_item(Item=item)
    return item


def put_shared_message(student: dict, actor: dict, body: str) -> dict[str, Any]:
    """Check live sharing and sender membership atomically with the message write."""
    item = _message(student["user_id"], actor["user_id"], actor["role"], body)
    transact_write_items([
        {"ConditionCheck": {
            "TableName": table_name("USERS_TABLE_NAME", "Users"),
            "Key": to_attribute_map({"user_id": student["user_id"]}),
            "ConditionExpression": "#role = :student AND (attribute_not_exists(sharing_settings) OR (sharing_settings.#support.messages = :yes AND sharing_settings.#parent.messages = :yes))",
            "ExpressionAttributeNames": {"#role": "role", "#support": "support", "#parent": "parent"},
            "ExpressionAttributeValues": to_attribute_map({":student": "STUDENT", ":yes": True}),
        }},
        actor_check(actor, student["user_id"]),
        {"Put": {"TableName": table_name(_TABLE_ENV, _TABLE_DEFAULT), "Item": to_attribute_map(item)}},
    ])
    return item


def list_messages_by_student(student_id: str, limit: int = 50) -> list[dict[str, Any]]:
    response = _table().query(
        KeyConditionExpression="student_id = :student_id",
        ExpressionAttributeValues={":student_id": student_id},
        ScanIndexForward=False,
        Limit=limit,
    )
    return response.get("Items", [])
