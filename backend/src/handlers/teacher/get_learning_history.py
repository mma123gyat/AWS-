from src.services.teacher_access_service import get_owned_student
from src.services.learning_history_service import get_learning_history
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler("teacher.get_learning_history")
def handler(event: dict, context) -> dict:
    _, student = get_owned_student(event)
    return success(get_learning_history(student))
