import uuid
from datetime import UTC, datetime
from typing import Any

from src.repositories.dynamodb_client import table

_TABLE_ENV = "DAILY_CONDITIONS_TABLE_NAME"
_TABLE_DEFAULT = "DailyConditions"


def _table():
    return table(_TABLE_ENV, _TABLE_DEFAULT)


def get_condition(student_id: str, date: str) -> dict[str, Any] | None:
    response = _table().get_item(Key={"student_id": student_id, "date": date})
    return response.get("Item")


def put_condition(student_id: str, date: str, available_minutes: int) -> dict[str, Any]:
    item = {
        "condition_id": str(uuid.uuid4()),
        "student_id": student_id,
        "date": date,
        "available_minutes": available_minutes,
        "created_at": datetime.now(UTC).isoformat(),
    }
    _table().put_item(Item=item)
    return item
