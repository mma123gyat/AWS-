from src.repositories.student_progresses_repository import list_progresses_by_student
from src.repositories.study_plans_repository import get_completed_plan
from src.repositories.study_records_repository import list_records_by_student
from src.repositories.study_tasks_repository import list_tasks_by_plan
from src.repositories.users_repository import get_user_by_id
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.dates import today_jst
from src.utils.errors import ForbiddenError, NotFoundError, ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler("teacher.get_student_detail")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "TEACHER")

    student_id = event.get("pathParameters", {}).get("studentId")
    if not student_id:
        raise ValidationError("studentIdは必須です。")

    student = get_user_by_id(student_id)
    if not student or student.get("role") != "STUDENT":
        raise NotFoundError("生徒が見つかりませんでした。")
    if student.get("class_id") != user.class_id:
        raise ForbiddenError("担当クラス以外の生徒は確認できません。")

    progresses = list_progresses_by_student(student_id)
    records = list_records_by_student(student_id, limit=20)

    today_plan = get_completed_plan(student_id, today_jst())
    today_plan_with_tasks = None
    if today_plan:
        today_plan_with_tasks = {**today_plan, "tasks": list_tasks_by_plan(today_plan["plan_id"])}

    return success(
        {
            "studentId": student_id,
            "name": student.get("name"),
            "progresses": progresses,
            "recentRecords": records,
            "todayPlan": today_plan_with_tasks,
        }
    )
