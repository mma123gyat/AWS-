from src.repositories.messages_repository import list_messages_by_student
from src.models.sharing_settings import read_settings
from src.services.sharing_settings_service import resolve_student
from src.services.weekly_learning_service import load_learning_week
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.badge_rules import compute_badges
from src.utils.dates import jst_date_from_iso
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler("parents.get_dashboard")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "PARENT")

    _, student = resolve_student(user, "PARENT")
    student_id = student["user_id"]
    settings = read_settings(student)["parent"]
    week = load_learning_week(student_id) if settings["studySummary"] else None
    total_minutes = week.total_minutes() if week is not None else None
    recent = week.records if week is not None else []
    studied_days = {
        d for r in recent if (d := jst_date_from_iso(r["completed_at"])) is not None
    }

    messages = list_messages_by_student(student_id, limit=20) if settings["messages"] else None

    return success(
        {
            "studentName": student.get("name") if student else None,
            "weeklyStudyMinutes": total_minutes,
            "studiedDays": len(studied_days) if settings["studySummary"] else None,
            "recordCount": len(recent) if settings["studySummary"] else None,
            "badges": compute_badges(recent, week.end_date.isoformat()) if week is not None else None,
            "messages": messages,
        }
    )
