from botocore.exceptions import ClientError

from src.models.ai_parameters import read_ai_parameters
from src.repositories.users_repository import get_user_by_id, put_ai_parameters
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.errors import ConflictError, ForbiddenError, NotFoundError, ValidationError


def get_owned_student(event: dict):
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
        raise ForbiddenError("担当クラス以外の生徒の設定は確認・変更できません。")
    return user, student


def settings_response(student: dict) -> dict:
    return {
        "studentId": student["user_id"],
        "params": read_ai_parameters(student.get("ai_parameters")),
        "updatedAt": student.get("ai_parameters_updated_at"),
    }


def save_settings(student_id: str, class_id: str, params: dict[str, int]) -> dict:
    try:
        return settings_response(put_ai_parameters(student_id, class_id, params))
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            raise ConflictError("生徒の所属情報が変更されました。画面を再読み込みしてください。") from exc
        raise
