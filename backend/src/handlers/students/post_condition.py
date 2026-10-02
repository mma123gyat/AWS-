import json

from src.repositories.daily_conditions_repository import put_condition
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.dates import today_jst
from src.utils.errors import ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success
from src.validators.condition_validator import validate_condition_input


@lambda_handler("students.post_condition")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "STUDENT")

    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        raise ValidationError("リクエストの形式が不正です。")

    available_minutes = validate_condition_input(payload)
    item = put_condition(user.user_id, today_jst(), available_minutes)
    return success(item)
