from datetime import date, timedelta

from src.repositories.messages_repository import list_messages_by_student
from src.repositories.study_records_repository import list_records_by_student
from src.models.sharing_settings import read_settings
from src.services.sharing_settings_service import resolve_student
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.badge_rules import compute_badges
from src.utils.dates import jst_date_from_iso, today_jst
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success

WINDOW_DAYS = 7


def _recent_records(records: list[dict], today_str: str) -> list[dict]:
    today = date.fromisoformat(today_str)
    window_start = today - timedelta(days=WINDOW_DAYS - 1)
    recent = []
    for record in records:
        study_date = jst_date_from_iso(record.get("completed_at"))
        if study_date is None:
            continue
        if window_start <= study_date <= today:
            recent.append(record)
    return recent


@lambda_handler("parents.get_dashboard")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "PARENT")

    _, student = resolve_student(user, "PARENT")
    student_id = student["user_id"]
    settings = read_settings(student)["parent"]
    today = today_jst()

    records = list_records_by_student(student_id, limit=50) if settings["studySummary"] else []
    recent = _recent_records(records, today)
    studied_days = {
        d for r in recent if (d := jst_date_from_iso(r["completed_at"])) is not None
    }

    messages = list_messages_by_student(student_id, limit=20) if settings["messages"] else None

    return success(
        {
            "studentName": student.get("name") if student else None,
            "weeklyStudyMinutes": sum(int(r.get("actual_minutes") or 0) for r in recent) if settings["studySummary"] else None,
            "studiedDays": len(studied_days) if settings["studySummary"] else None,
            "recordCount": len(recent) if settings["studySummary"] else None,
            "badges": compute_badges(records, today) if settings["studySummary"] else None,
            "messages": messages,
        }
    )
