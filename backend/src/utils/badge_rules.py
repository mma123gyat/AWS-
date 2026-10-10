from datetime import date, timedelta
from typing import Any

from src.utils.dates import jst_date_from_iso

# MVP用の簡易バッジ判定ルール(正式仕様なし、デモとして妥当な基準)。
# 直近7日間(今日を含む)のStudyRecordsとStudentProgressesだけから計算し、
# 専用テーブルは持たない(badgeは常にその場で再計算される)。
#
# - "3日継続":  直近7日のうち学習した日が3日以上
# - "5日継続":  直近7日のうち学習した日が5日以上
# - "理解度アップ": 直近7日の記録でunderstanding(1〜5)が4以上のものが1件以上
# - "1時間チャレンジ": 直近7日の合計学習時間(actual_minutes)が60分以上

WINDOW_DAYS = 7
UNDERSTANDING_THRESHOLD = 4
TOTAL_MINUTES_THRESHOLD = 60


def _study_date(record: dict[str, Any]) -> date | None:
    return jst_date_from_iso(record.get("completed_at"))


def _recent_records(records: list[dict[str, Any]], today: date) -> list[dict[str, Any]]:
    window_start = today - timedelta(days=WINDOW_DAYS - 1)
    recent = []
    for record in records:
        study_date = _study_date(record)
        if study_date is not None and window_start <= study_date <= today:
            recent.append(record)
    return recent


def compute_badges(
    records: list[dict[str, Any]],
    today_str: str,
) -> list[dict[str, Any]]:
    """records: StudyRecordsのリスト(study_records_repository.list_records_by_studentの戻り値)。
    today_str: "YYYY-MM-DD"(today_jst()の戻り値)。

    戻り値: [{"id": str, "label": str, "earned": bool}, ...] (常に全種類を返し、
    獲得済みかどうかをearnedで表現する。画面側で未獲得をロック表示できるように)。
    """
    today = date.fromisoformat(today_str)
    recent = _recent_records(records, today)

    studied_days = {d for d in (_study_date(r) for r in recent) if d is not None}
    total_minutes = sum(int(r.get("actual_minutes") or 0) for r in recent)
    has_high_understanding = any(
        int(r.get("understanding") or 0) >= UNDERSTANDING_THRESHOLD for r in recent
    )

    return [
        {"id": "streak_3", "label": "3日継続", "earned": len(studied_days) >= 3},
        {"id": "streak_5", "label": "5日継続", "earned": len(studied_days) >= 5},
        {"id": "understanding_up", "label": "理解度アップ", "earned": has_high_understanding},
        {
            "id": "hour_challenge",
            "label": "1時間チャレンジ",
            "earned": total_minutes >= TOTAL_MINUTES_THRESHOLD,
        },
    ]
