import json

from src.repositories.student_progresses_repository import put_progress
from src.repositories.users_repository import get_user_by_id
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.errors import ForbiddenError, NotFoundError, ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success
from src.validators.progress_validator import validate_student_progress_input


@lambda_handler("teacher.put_student_progress")
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
        raise ForbiddenError("担当クラス以外の生徒の現在地は編集できません。")

    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        raise ValidationError("リクエストの形式が不正です。")

    validated = validate_student_progress_input(payload)

    item = put_progress(
        student_id=student_id,
        subject_id=validated["subject_id"],
        unit_name=validated["unit_name"],
        understanding=validated["understanding"],
        status=validated["status"],
    )
    return success(item)
