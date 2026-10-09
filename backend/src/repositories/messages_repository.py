import uuid
from datetime import UTC, datetime
from typing import Any

from src.repositories.dynamodb_client import table

_TABLE_ENV = "MESSAGES_TABLE_NAME"
_TABLE_DEFAULT = "Messages"


def _table():
    return table(_TABLE_ENV, _TABLE_DEFAULT)


def put_message(student_id: str, sender_user_id: str, sender_role: str, body: str) -> dict[str, Any]:
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
    _table().put_item(Item=item)
    return item


def list_messages_by_student(student_id: str, limit: int = 50) -> list[dict[str, Any]]:
    response = _table().query(
        KeyConditionExpression="student_id = :student_id",
        ExpressionAttributeValues={":student_id": student_id},
        ScanIndexForward=False,
        Limit=limit,
    )
    return response.get("Items", [])
