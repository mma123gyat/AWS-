from src.repositories.daily_conditions_repository import get_condition
from src.services.study_plan_service import generate_plan_for_student
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.dates import today_jst
from src.utils.errors import ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler("students.post_study_plan")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "STUDENT")

    condition = get_condition(user.user_id, today_jst())
    if not condition:
        raise ValidationError("先に今日の学習時間を選択してください。")

    available_minutes = int(condition["available_minutes"])
    if available_minutes <= 0:
        # "今日は休む" を選んだ場合はプランを生成しない。
        return success({"isRestDay": True, "plan": None})

    request_id = getattr(context, "aws_request_id", "local")
    plan = generate_plan_for_student(user.user_id, available_minutes, request_id)
    return success({"isRestDay": False, "plan": plan})
