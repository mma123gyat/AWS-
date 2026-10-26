import json

from botocore.exceptions import ClientError

from src.repositories.student_progresses_repository import put_progress
from src.services.teacher_access_service import get_owned_student
from src.utils.errors import ConflictError, ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success
from src.validators.progress_validator import validate_student_progress_input


@lambda_handler("teacher.put_student_progress")
def handler(event: dict, context) -> dict:
    teacher, student = get_owned_student(event)

    try:
        payload = json.loads(event.get("body") or "{}")
    except (json.JSONDecodeError, TypeError):
        raise ValidationError("リクエストの形式が不正です。")

    validated = validate_student_progress_input(payload)

    try:
        item = put_progress(
            student_id=student["user_id"],
            subject_id=validated["subject_id"],
            unit_name=validated["unit_name"],
            understanding=validated["understanding"],
            status=validated["status"],
            teacher=teacher,
        )
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") == "TransactionCanceledException" and any(
            reason.get("Code") == "ConditionalCheckFailed" for reason in exc.response.get("CancellationReasons", [])
        ):
            raise ConflictError("担当クラス・生徒の所属または権限が変更されました。画面を再読み込みしてください。") from exc
        raise
    return success(item)
