from src.services.teacher_access_service import get_owned_student
from src.services.teacher_ai_parameters_service import settings_response
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler("teacher.get_ai_parameters")
def handler(event: dict, context) -> dict:
    _, student = get_owned_student(event)
    return success(settings_response(student))
