from botocore.exceptions import ClientError

from src.models.ai_parameters import read_ai_parameters
from src.repositories.users_repository import put_ai_parameters
from src.utils.errors import ConflictError


def settings_response(student: dict) -> dict:
    return {
        "studentId": student["user_id"],
        "params": read_ai_parameters(student.get("ai_parameters")),
        "updatedAt": student.get("ai_parameters_updated_at"),
    }


def save_settings(student_id: str, teacher: dict, params: dict[str, int]) -> dict:
    try:
        return settings_response(put_ai_parameters(student_id, teacher["class_id"], params, teacher=teacher))
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") == "TransactionCanceledException" and any(
            reason.get("Code") == "ConditionalCheckFailed" for reason in exc.response.get("CancellationReasons", [])
        ):
            raise ConflictError("担当クラス・生徒の所属または権限が変更されました。画面を再読み込みしてください。") from exc
        raise
