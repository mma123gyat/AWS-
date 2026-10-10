from datetime import date

from src.utils.dates import jst_date_from_iso


def test_jst_date_from_iso_crosses_to_next_day():
    # 2026-01-09T15:30:00+00:00 はJSTでは2026-01-10 00:30なので、
    # 「学習した日」は2026-01-10として扱われるべき。
    assert jst_date_from_iso("2026-01-09T15:30:00+00:00") == date(2026, 1, 10)


def test_jst_date_from_iso_same_day_when_well_before_jst_midnight():
    # 2026-01-09T09:00:00+00:00 はJSTでは2026-01-09 18:00なので、同じ日のまま。
    assert jst_date_from_iso("2026-01-09T09:00:00+00:00") == date(2026, 1, 9)


def test_jst_date_from_iso_treats_naive_datetime_as_utc():
    assert jst_date_from_iso("2026-01-09T15:30:00") == date(2026, 1, 10)


def test_jst_date_from_iso_returns_none_for_missing_value():
    assert jst_date_from_iso(None) is None
    assert jst_date_from_iso("") is None


def test_jst_date_from_iso_returns_none_for_invalid_value():
    assert jst_date_from_iso("not-a-date") is None
