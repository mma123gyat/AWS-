import json

from botocore.exceptions import ClientError

from src.repositories.curriculums_repository import put_curriculum
from src.services.teacher_class_service import get_current_teacher
from src.utils.errors import ConflictError, ForbiddenError, ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success
from src.validators.progress_validator import validate_curriculum_input


@lambda_handler("teacher.put_class_progress")
def handler(event: dict, context) -> dict:
    teacher = get_current_teacher(event)

    class_id = (event.get("pathParameters") or {}).get("classId")
    if not class_id:
        raise ValidationError("classIdは必須です。")
    if class_id != teacher["class_id"]:
        raise ForbiddenError("担当クラス以外の進度は編集できません。")

    try:
        payload = json.loads(event.get("body") or "{}")
    except (json.JSONDecodeError, TypeError):
        raise ValidationError("リクエストの形式が不正です。")

    validated = validate_curriculum_input(payload)

    try:
        item = put_curriculum(
            class_id=class_id,
            subject_id=validated["subject_id"],
            unit_name=validated["unit_name"],
            textbook_page=validated["textbook_page"],
            status=validated["status"],
            updated_by=teacher["user_id"],
            teacher=teacher,
        )
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") == "TransactionCanceledException" and any(
            reason.get("Code") == "ConditionalCheckFailed" for reason in exc.response.get("CancellationReasons", [])
        ):
            raise ConflictError("担当クラスまたは権限が変更されました。担当クラスを再確認してください。") from exc
        raise
    return success(item)
