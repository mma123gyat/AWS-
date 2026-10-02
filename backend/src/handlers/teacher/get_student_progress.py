from src.repositories.student_progresses_repository import list_progresses_by_student
from src.repositories.users_repository import get_user_by_id
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.errors import ForbiddenError, NotFoundError, ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler("teacher.get_student_progress")
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
        raise ForbiddenError("担当クラス以外の生徒の現在地は確認できません。")

    items = list_progresses_by_student(student_id)
    return success(items)
