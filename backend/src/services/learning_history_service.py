from datetime import UTC, datetime, timedelta

from src.services.weekly_learning_service import (
    JST, MAX_SAFE_INTEGER, load_learning_week, positive_integer,
)


def get_learning_history(student: dict, now: datetime | None = None) -> dict:
    week = load_learning_week(student["user_id"], now)
    now, start_date, end_date = week.now, week.start_date, week.end_date
    dates = [(start_date + timedelta(days=index)).isoformat() for index in range(7)]
    days = {day: {"date": day, "minutes": 0, "recordCount": 0} for day in dates}
    subjects: dict[str | None, dict] = {}
    unknown_dates = week.unassigned_record_count
    dated = week.dated_records

    # Last record wins for a subject/day; never average understanding into a percentage.
    for completed_at, _, record in sorted(dated, key=lambda item: (item[0], item[1])):
        day = completed_at.astimezone(JST).date().isoformat()
        daily = days[day]
        daily["recordCount"] += 1
        minutes = positive_integer(record.get("actual_minutes"), MAX_SAFE_INTEGER)
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
            understanding=positive_integer(record.get("understanding"), 5),
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
