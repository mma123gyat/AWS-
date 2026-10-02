import uuid
from datetime import UTC, datetime
from typing import Any

from src.repositories.dynamodb_client import table

_TABLE_ENV = "STUDY_PLANS_TABLE_NAME"
_TABLE_DEFAULT = "StudyPlans"


def _table():
    return table(_TABLE_ENV, _TABLE_DEFAULT)


def get_plan(student_id: str, plan_date: str) -> dict[str, Any] | None:
    response = _table().get_item(Key={"student_id": student_id, "plan_date": plan_date})
    return response.get("Item")


def put_plan(
    student_id: str,
    plan_date: str,
    available_minutes: int,
    subject_id: str,
    title: str,
    reason: str,
    generator: str,
    model_id: str,
    prompt_version: str,
) -> dict[str, Any]:
    item = {
        "plan_id": str(uuid.uuid4()),
        "student_id": student_id,
        "plan_date": plan_date,
        "available_minutes": available_minutes,
        "subject_id": subject_id,
        "title": title,
        "reason": reason,
        "generator": generator,
        "model_id": model_id,
        "prompt_version": prompt_version,
        "created_at": datetime.now(UTC).isoformat(),
    }
    _table().put_item(Item=item)
    return item
