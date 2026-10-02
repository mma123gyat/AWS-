from datetime import UTC, datetime, timedelta

_JST = timedelta(hours=9)


def today_jst() -> str:
    """'today' is always judged in JST, independent of the Lambda's own timezone."""
    return (datetime.now(UTC) + _JST).strftime("%Y-%m-%d")
