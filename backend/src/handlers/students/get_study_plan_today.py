from src.repositories.daily_conditions_repository import get_condition
from src.repositories.study_plans_repository import get_plan
from src.repositories.study_tasks_repository import list_tasks_by_plan
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.dates import today_jst
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler("students.get_study_plan_today")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "STUDENT")

    today = today_jst()
    condition = get_condition(user.user_id, today)
    if not condition:
        return success({"condition": None, "plan": None})

    if int(condition["available_minutes"]) <= 0:
        return success({"condition": condition, "plan": None, "isRestDay": True})

    plan = get_plan(user.user_id, today)
    if not plan:
        return success({"condition": condition, "plan": None})

    tasks = list_tasks_by_plan(plan["plan_id"])
    return success({"condition": condition, "plan": {**plan, "tasks": tasks}})
