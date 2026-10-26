from src.repositories.student_progresses_repository import list_progresses_by_student
from src.services.teacher_access_service import get_owned_student
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler("teacher.get_student_progress")
def handler(event: dict, context) -> dict:
    _, student = get_owned_student(event)
    items = list_progresses_by_student(student["user_id"])
    return success(items)
