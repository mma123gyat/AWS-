from datetime import UTC, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import Any

from src.repositories.study_records_repository import list_records_in_period

JST = timezone(timedelta(hours=9))
MAX_SAFE_INTEGER = 9_007_199_254_740_991


def _timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
        # Legacy records without an offset are UTC, as in utils.dates.
        return parsed.replace(tzinfo=UTC) if parsed.tzinfo is None else parsed.astimezone(UTC)
    except ValueError:
        return None


def _integer(value: Any, maximum: int) -> int | None:
    if isinstance(value, (int, Decimal)) and not isinstance(value, bool) and 1 <= value <= maximum and value == int(value):
        return int(value)
    return None


def get_learning_history(student: dict, now: datetime | None = None) -> dict:
    now = now or datetime.now(UTC)
    end_date = now.astimezone(JST).date()
    start_date = end_date - timedelta(days=6)
    start = datetime.combine(start_date, time.min, tzinfo=JST).astimezone(UTC)
    end = datetime.combine(end_date + timedelta(days=1), time.min, tzinfo=JST).astimezone(UTC)
    dates = [(start_date + timedelta(days=index)).isoformat() for index in range(7)]
    days = {day: {"date": day, "minutes": 0, "recordCount": 0} for day in dates}
    subjects: dict[str | None, dict] = {}
    records = list_records_in_period(student["user_id"], start, end)
    unknown_dates = 0
    dated = []
    for record in records:
        completed_at = _timestamp(record.get("completed_at"))
        if completed_at is None:
            unknown_dates += 1
        elif start <= completed_at < end and completed_at <= now:
            dated.append((completed_at, record.get("sort_key", ""), record))

    # Last record wins for a subject/day; never average understanding into a percentage.
    for completed_at, _, record in sorted(dated, key=lambda item: (item[0], item[1])):
        day = completed_at.astimezone(JST).date().isoformat()
        daily = days[day]
        daily["recordCount"] += 1
        minutes = _integer(record.get("actual_minutes"), MAX_SAFE_INTEGER)
        if minutes is None or daily["minutes"] is None:
            daily["minutes"] = None
        else:
            total = daily["minutes"] + minutes
            daily["minutes"] = total if total <= MAX_SAFE_INTEGER else None
        raw_subject = record.get("subject_id")
        subject_id = raw_subject if isinstance(raw_subject, str) and raw_subject.strip() else None
        if subject_id not in subjects:
            subjects[subject_id] = {
                "subjectId": subject_id,
                "days": {date: {"date": date, "understanding": None, "recordCount": 0, "unitName": None, "completedAt": None} for date in dates},
            }
        point = subjects[subject_id]["days"][day]
        point.update(
            understanding=_integer(record.get("understanding"), 5),
            recordCount=point["recordCount"] + 1,
            unitName=record.get("unit_name") if isinstance(record.get("unit_name"), str) else None,
            completedAt=completed_at.isoformat(),
        )

    # An unassignable timestamp could belong to any day; do not show a misleading total.
    if unknown_dates:
        for daily in days.values():
            daily["minutes"] = None
    values = list(days.values())
    total = None if any(day["minutes"] is None for day in values) else sum(day["minutes"] for day in values)
    return {
        "studentId": student["user_id"], "name": student.get("name"),
        "startDate": start_date.isoformat(), "endDate": end_date.isoformat(),
        "timeZone": "Asia/Tokyo", "generatedAt": now.astimezone(UTC).isoformat(),
        "recordCount": len(dated), "unassignedRecordCount": unknown_dates,
        "totalMinutes": total if total is not None and total <= MAX_SAFE_INTEGER else None,
        "days": values,
        "subjects": [{"subjectId": key, "days": list(subjects[key]["days"].values())} for key in sorted(subjects, key=lambda key: (key is None, key or ""))],
    }
