from src.repositories.users_repository import get_user_by_id
from src.services.learning_history_service import get_learning_history
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.errors import ForbiddenError, NotFoundError, ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler("teacher.get_learning_history")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "TEACHER")
    student_id = (event.get("pathParameters") or {}).get("studentId")
    if not student_id:
        raise ValidationError("studentIdは必須です。")
    if not user.class_id:
        raise ValidationError("担当クラスが設定されていません。")
    student = get_user_by_id(student_id)
    if not student or student.get("role") != "STUDENT":
        raise NotFoundError("生徒が見つかりませんでした。")
    if student.get("class_id") != user.class_id:
        raise ForbiddenError("担当クラス以外の生徒の学習履歴は確認できません。")
    return success(get_learning_history(student))
