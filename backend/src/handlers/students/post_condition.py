import json

from src.repositories.daily_conditions_repository import put_condition
from src.repositories.student_progresses_repository import get_progress
from src.repositories.curriculums_repository import get_curriculum
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.dates import today_jst
from src.utils.errors import ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success
from src.validators.condition_validator import validate_condition_input, validate_subject_input


@lambda_handler("students.post_condition")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "STUDENT")

    try:
        payload = json.loads(event.get("body") or "{}")
    except (json.JSONDecodeError, TypeError):
        raise ValidationError("リクエストの形式が不正です。")

    available_minutes = validate_condition_input(payload)
    subject_id = validate_subject_input(payload)
    if available_minutes > 0 and subject_id is not None:
        if not get_progress(user.user_id, subject_id):
            raise ValidationError("この教科の学習の現在地を先生に登録してもらってください。")
        if not user.class_id or not get_curriculum(user.class_id, subject_id):
            raise ValidationError("この教科の学校の授業進度を先生に登録してもらってください。")
        item = put_condition(user.user_id, today_jst(), available_minutes, subject_id=subject_id)
    else:
        # Older clients and rest days retain the original request format.
        item = put_condition(user.user_id, today_jst(), available_minutes)
    return success(item)
