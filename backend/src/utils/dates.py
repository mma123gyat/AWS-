from datetime import UTC, date, datetime, timedelta, timezone

_JST = timedelta(hours=9)
_JST_TZ = timezone(_JST)


def today_jst() -> str:
    """'today' is always judged in JST, independent of the Lambda's own timezone."""
    return (datetime.now(UTC) + _JST).strftime("%Y-%m-%d")


def jst_date_from_iso(value: str | None) -> date | None:
    """UTCで保存されたISO8601日時文字列を、JST基準の日付(date)に変換する。

    StudyRecords.completed_at等はUTCのISO8601で保存されているため、
    「学習した日」をJSTで判定するにはastimezoneしてからdate()を取る必要がある
    (例: 2026-01-09T15:30:00+00:00 はJSTでは2026-01-10になる)。
    欠損・不正な値はNoneを返す。
    """
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return parsed.astimezone(_JST_TZ).date()
