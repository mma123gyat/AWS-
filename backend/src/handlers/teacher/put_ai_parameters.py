import json

from src.services.teacher_access_service import get_owned_student
from src.services.teacher_ai_parameters_service import save_settings
from src.utils.errors import ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success
from src.validators.ai_parameters_validator import validate_ai_parameters_input


@lambda_handler("teacher.put_ai_parameters")
def handler(event: dict, context) -> dict:
    teacher, student = get_owned_student(event)
    try:
        payload = json.loads(event.get("body") or "{}")
    except (json.JSONDecodeError, TypeError):
        raise ValidationError("リクエストの形式が不正です。")
    params = validate_ai_parameters_input(payload)
    return success(save_settings(student["user_id"], teacher, params))
