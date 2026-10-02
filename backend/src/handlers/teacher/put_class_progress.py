import json

from src.repositories.curriculums_repository import put_curriculum
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.errors import ForbiddenError, ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success
from src.validators.progress_validator import validate_curriculum_input


@lambda_handler("teacher.put_class_progress")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "TEACHER")

    class_id = event.get("pathParameters", {}).get("classId")
    if not class_id:
        raise ValidationError("classIdは必須です。")
    if class_id != user.class_id:
        raise ForbiddenError("担当クラス以外の進度は編集できません。")

    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        raise ValidationError("リクエストの形式が不正です。")

    validated = validate_curriculum_input(payload)

    item = put_curriculum(
        class_id=class_id,
        subject_id=validated["subject_id"],
        unit_name=validated["unit_name"],
        textbook_page=validated["textbook_page"],
        status=validated["status"],
        updated_by=user.user_id,
    )
    return success(item)
