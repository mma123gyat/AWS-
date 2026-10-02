from src.repositories.curriculums_repository import list_curriculums_by_class
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.errors import ForbiddenError, ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler("teacher.get_class_progress")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "TEACHER")

    class_id = event.get("pathParameters", {}).get("classId")
    if not class_id:
        raise ValidationError("classIdは必須です。")
    if class_id != user.class_id:
        raise ForbiddenError("担当クラス以外の進度は確認できません。")

    items = list_curriculums_by_class(class_id)
    return success(items)
