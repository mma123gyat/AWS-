from src.services.teacher_class_service import get_teacher_profile
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler("teacher.get_me")
def handler(event: dict, context) -> dict:
    return success(get_teacher_profile(event))
