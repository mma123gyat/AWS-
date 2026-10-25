"""One complete seven-day JST window for teacher, parent and support views."""
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import Any

from src.repositories.study_records_repository import list_records_in_period
from src.utils.errors import ApiError

JST = timezone(timedelta(hours=9))
MAX_SAFE_INTEGER = 9_007_199_254_740_991


def positive_integer(value: Any, maximum: int) -> int | None:
    if isinstance(value, (int, Decimal)) and not isinstance(value, bool) and 1 <= value <= maximum and value == int(value):
        return int(value)
    return None


def _timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
        # Legacy timestamps without an offset are UTC.
        return parsed.replace(tzinfo=UTC) if parsed.tzinfo is None else parsed.astimezone(UTC)
    except ValueError:
        return None


@dataclass
class LearningWeek:
    now: datetime
    start_date: date
    end_date: date
    dated_records: list[tuple[datetime, str, dict]]
    unassigned_record_count: int

    @property
    def records(self) -> list[dict]:
        return [record for _, _, record in self.dated_records]

    def total_minutes(self) -> int:
        """Summary nulls mean sharing is off; invalid data must be an error instead."""
        total = 0
        if not self.unassigned_record_count:
            for record in self.records:
                minutes = positive_integer(record.get("actual_minutes"), MAX_SAFE_INTEGER)
                if minutes is None:
                    break
                total += minutes
                if total > MAX_SAFE_INTEGER:
                    break
            else:
                return total
        raise ApiError("学習記録の一部を確認できないため、学習のまとめを取得できませんでした。")


def load_learning_week(student_id: str, now: datetime | None = None) -> LearningWeek:
    now = now or datetime.now(UTC)
    end_date = now.astimezone(JST).date()
    start_date = end_date - timedelta(days=6)
    start = datetime.combine(start_date, time.min, tzinfo=JST).astimezone(UTC)
    end = datetime.combine(end_date + timedelta(days=1), time.min, tzinfo=JST).astimezone(UTC)
    # This repository method follows every page, with consistent reads and no total cap.
    records = list_records_in_period(student_id, start, end)
    dated = []
    unknown_dates = 0
    for record in records:
        completed_at = _timestamp(record.get("completed_at"))
        if completed_at is None:
            unknown_dates += 1
        elif start <= completed_at < end and completed_at <= now:
            dated.append((completed_at, record.get("sort_key", ""), record))
    return LearningWeek(now, start_date, end_date, dated, unknown_dates)
