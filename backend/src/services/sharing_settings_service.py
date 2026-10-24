import json

from botocore.exceptions import ClientError

from src.models.sharing_settings import read_settings, read_version, validate_input
from src.repositories.sharing_settings_repository import put_settings
from src.repositories.users_repository import get_user_by_id
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.errors import ConflictError, ForbiddenError, ValidationError


def resolve_student(user, expected_role: str) -> tuple[dict, dict]:
    require_role(user, expected_role)
    # Re-read the base table: the authentication GSI can lag a role/link change.
    actor = get_user_by_id(user.user_id)
    if not actor or actor.get("role") != expected_role or actor.get("cognito_sub") != user.cognito_sub:
        raise ForbiddenError("アカウントの権限を確認できません。ログインし直してください。")
    student_id = actor["user_id"] if expected_role == "STUDENT" else actor.get("linked_student_id")
    if not student_id:
        raise ValidationError("対象の生徒が設定されていません。")
    student = actor if expected_role == "STUDENT" else get_user_by_id(student_id)
    if not student or student.get("role") != "STUDENT":
        raise ForbiddenError("対象の生徒を確認できません。管理者にお問い合わせください。")
    return actor, student


def response_data(student: dict, role: str) -> dict:
    settings = read_settings(student)
    return {
        "studentId": student["user_id"], "studentName": student.get("name"),
        "settings": settings if role != "SUPPORT" else {"support": settings["support"]},
        "version": read_version(student),
        "updatedAt": student.get("sharing_updated_at"),
        "updatedByRole": student.get("sharing_updated_by_role"),
        "isLegacyDefault": "sharing_settings" not in student,
        "canSendMessage": settings["support"]["messages"] and settings["parent"]["messages"],
    }


def conditional_failure(exc: ClientError) -> bool:
    return exc.response["Error"]["Code"] == "TransactionCanceledException" and any(
        reason.get("Code") == "ConditionalCheckFailed" for reason in exc.response.get("CancellationReasons", [])
    )


def get_sharing(event: dict, role: str) -> dict:
    _, student = resolve_student(get_authenticated_user(event), role)
    return response_data(student, role)


def save_sharing(event: dict, role: str) -> dict:
    actor, student = resolve_student(get_authenticated_user(event), role)
    if role not in ("STUDENT", "PARENT"):
        raise ForbiddenError("共有設定を変更できません。")
    try:
        payload = json.loads(event.get("body") or "{}")
    except (json.JSONDecodeError, TypeError):
        raise ValidationError("リクエストの形式が不正です。")
    settings, version = validate_input(payload)
    # Client ID is only a stale-tab assertion, never the authorization target.
    if payload["studentId"] != student["user_id"]:
        raise ConflictError("対象の生徒が変更されました。再読み込みしてください。")
    try:
        saved = put_settings(actor, student["user_id"], settings, version)
    except ClientError as exc:
        if conditional_failure(exc):
            raise ConflictError("共有設定またはアカウント情報が変更されました。再読み込みして確認してください。") from exc
        raise
    return response_data({**student, **saved}, role)
