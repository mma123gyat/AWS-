from src.utils.badge_rules import compute_badges

TODAY = "2026-01-10"


def _record(days_ago: int, actual_minutes: int = 10, understanding: int = 3) -> dict:
    # days_ago=0 -> today
    day = f"2026-01-{10 - days_ago:02d}"
    return {
        "completed_at": f"{day}T09:00:00+00:00",
        "actual_minutes": actual_minutes,
        "understanding": understanding,
    }


def _badge(badges: list[dict], badge_id: str) -> dict:
    return next(b for b in badges if b["id"] == badge_id)


def test_no_records_earns_nothing():
    badges = compute_badges([], TODAY)
    assert all(not b["earned"] for b in badges)


def test_three_distinct_days_earns_streak_3_but_not_streak_5():
    records = [_record(0), _record(1), _record(2)]
    badges = compute_badges(records, TODAY)
    assert _badge(badges, "streak_3")["earned"] is True
    assert _badge(badges, "streak_5")["earned"] is False


def test_five_distinct_days_earns_streak_5():
    records = [_record(d) for d in range(5)]
    badges = compute_badges(records, TODAY)
    assert _badge(badges, "streak_5")["earned"] is True


def test_records_outside_7day_window_are_ignored():
    records = [_record(10)]
    badges = compute_badges(records, TODAY)
    assert all(not b["earned"] for b in badges)


def test_high_understanding_earns_understanding_up():
    records = [_record(0, understanding=4)]
    badges = compute_badges(records, TODAY)
    assert _badge(badges, "understanding_up")["earned"] is True


def test_low_understanding_does_not_earn_understanding_up():
    records = [_record(0, understanding=2)]
    badges = compute_badges(records, TODAY)
    assert _badge(badges, "understanding_up")["earned"] is False


def test_total_minutes_at_least_60_earns_hour_challenge():
    records = [_record(0, actual_minutes=30), _record(1, actual_minutes=30)]
    badges = compute_badges(records, TODAY)
    assert _badge(badges, "hour_challenge")["earned"] is True


def test_total_minutes_under_60_does_not_earn_hour_challenge():
    records = [_record(0, actual_minutes=30)]
    badges = compute_badges(records, TODAY)
    assert _badge(badges, "hour_challenge")["earned"] is False
