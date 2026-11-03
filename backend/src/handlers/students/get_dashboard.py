from src.repositories.curriculums_repository import get_curriculum
from src.repositories.daily_conditions_repository import get_condition
from src.repositories.student_progresses_repository import list_progresses_by_student
from src.repositories.study_plans_repository import get_completed_plan, matches_selection
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
    today = today_jst()
    condition = get_condition(user.user_id, today)
    subject_id = condition.get("subject_id") if condition else None
    my_position = next((p for p in progresses if p["subject_id"] == subject_id), None) if subject_id else (progresses[0] if progresses else None)

    school_position = None
    if my_position and user.class_id:
        school_position = get_curriculum(user.class_id, my_position["subject_id"])

    plan_with_tasks = None
    if condition and int(condition["available_minutes"]) > 0:
        plan = get_completed_plan(user.user_id, today)
        if matches_selection(plan, condition["available_minutes"], subject_id):
            plan_with_tasks = {**plan, "tasks": list_tasks_by_plan(plan["plan_id"])}

    return success(
        {
            "schoolCurrentPosition": school_position,
            "myCurrentPosition": my_position,
            "todayCondition": condition,
            "todayPlan": plan_with_tasks,
            "availableSubjects": [
                {"subject_id": p["subject_id"], "unit_name": p["unit_name"]}
                for p in progresses
            ],
        }
    )
