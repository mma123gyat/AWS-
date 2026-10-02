import uuid
from datetime import UTC, datetime
from typing import Any

from src.repositories.dynamodb_client import table

_TABLE_ENV = "STUDY_RECORDS_TABLE_NAME"
_TABLE_DEFAULT = "StudyRecords"


def _table():
    return table(_TABLE_ENV, _TABLE_DEFAULT)


def put_record(
    student_id: str,
    task_id: str,
    subject_id: str,
    unit_name: str,
    actual_minutes: int,
    understanding: int,
) -> dict[str, Any]:
    completed_at = datetime.now(UTC).isoformat()
    item = {
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
    _table().put_item(Item=item)
    return item


def list_records_by_student(student_id: str, limit: int = 50) -> list[dict[str, Any]]:
    response = _table().query(
        KeyConditionExpression="student_id = :student_id",
        ExpressionAttributeValues={":student_id": student_id},
        ScanIndexForward=False,
        Limit=limit,
    )
    return response.get("Items", [])
