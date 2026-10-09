from datetime import date, datetime, timedelta

from src.repositories.messages_repository import list_messages_by_student
from src.repositories.study_records_repository import list_records_by_student
from src.repositories.users_repository import get_user_by_id
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.badge_rules import compute_badges
from src.utils.dates import today_jst
from src.utils.errors import ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success

WINDOW_DAYS = 7


def _recent_records(records: list[dict], today_str: str) -> list[dict]:
    today = date.fromisoformat(today_str)
    window_start = today - timedelta(days=WINDOW_DAYS - 1)
    recent = []
    for record in records:
        completed_at = record.get("completed_at")
        if not completed_at:
            continue
        try:
            study_date = datetime.fromisoformat(completed_at).date()
        except ValueError:
            continue
        if window_start <= study_date <= today:
            recent.append(record)
    return recent


@lambda_handler("parents.get_dashboard")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "PARENT")

    if not user.linked_student_id:
        raise ValidationError("お子さまの情報が設定されていません。")

    student_id = user.linked_student_id
    student = get_user_by_id(student_id)
    today = today_jst()

    records = list_records_by_student(student_id, limit=50)
    recent = _recent_records(records, today)
    studied_days = {datetime.fromisoformat(r["completed_at"]).date() for r in recent}

    messages = list_messages_by_student(student_id, limit=20)

    return success(
        {
            "studentName": student.get("name") if student else None,
            "weeklyStudyMinutes": sum(int(r.get("actual_minutes") or 0) for r in recent),
            "studiedDays": len(studied_days),
            "recordCount": len(recent),
            "badges": compute_badges(records, today),
            "messages": messages,
        }
    )
