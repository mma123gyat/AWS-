from src.repositories.curriculums_repository import get_curriculum
from src.repositories.daily_conditions_repository import get_condition
from src.repositories.student_progresses_repository import list_progresses_by_student
from src.repositories.study_plans_repository import get_plan
from src.repositories.study_tasks_repository import list_tasks_by_plan
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.dates import today_jst
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler("students.get_dashboard")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "STUDENT")

    progresses = list_progresses_by_student(user.user_id)
    my_position = progresses[0] if progresses else None

    school_position = None
    if my_position and user.class_id:
        school_position = get_curriculum(user.class_id, my_position["subject_id"])

    today = today_jst()
    condition = get_condition(user.user_id, today)

    plan_with_tasks = None
    if condition and int(condition["available_minutes"]) > 0:
        plan = get_plan(user.user_id, today)
        if plan:
            plan_with_tasks = {**plan, "tasks": list_tasks_by_plan(plan["plan_id"])}

    return success(
        {
            "schoolCurrentPosition": school_position,
            "myCurrentPosition": my_position,
            "todayCondition": condition,
            "todayPlan": plan_with_tasks,
        }
    )
