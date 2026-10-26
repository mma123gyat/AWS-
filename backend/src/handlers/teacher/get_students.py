from src.repositories.study_plans_repository import get_completed_plan
from src.repositories.study_records_repository import list_records_by_student
from src.services.teacher_access_service import list_owned_students
from src.utils.dates import today_jst
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


def _summarize_student(student: dict) -> dict:
    """Only learning-support-relevant fields — no private condition notes
    or free-text content ever surfaces to teachers (spec section 19)."""
    student_id = student["user_id"]
    records = list_records_by_student(student_id, limit=1)
    latest_record = records[0] if records else None
    today_plan = get_completed_plan(student_id, today_jst())

    return {
        "studentId": student_id,
        "name": student.get("name"),
        "lastStudyDate": latest_record["completed_at"] if latest_record else None,
        "lastUnderstanding": latest_record["understanding"] if latest_record else None,
        "todayPlanExists": today_plan is not None,
    }


@lambda_handler("teacher.get_students")
def handler(event: dict, context) -> dict:
    students = list_owned_students(event)
    return success([_summarize_student(student) for student in students])
