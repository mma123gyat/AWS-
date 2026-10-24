import json

from botocore.exceptions import ClientError

from src.models.sharing_settings import read_settings
from src.repositories.messages_repository import put_shared_message
from src.services.sharing_settings_service import conditional_failure, resolve_student
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.errors import ForbiddenError, ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success

MAX_BODY_LENGTH = 1000


@lambda_handler("support.post_message")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "SUPPORT")

    actor, student = resolve_student(user, "SUPPORT")
    settings = read_settings(student)
    if not settings["support"]["messages"] or not settings["parent"]["messages"]:
        raise ForbiddenError("メッセージの共有が停止されています。")

    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        raise ValidationError("リクエストの形式が不正です。")

    if not isinstance(payload, dict) or not isinstance(payload.get("body"), str):
        raise ValidationError("メッセージを入力してください。")
    body = payload["body"].strip()
    if not body:
        raise ValidationError("メッセージを入力してください。")
    if len(body) > MAX_BODY_LENGTH:
        raise ValidationError(f"メッセージは{MAX_BODY_LENGTH}文字以内で入力してください。")

    try:
        item = put_shared_message(student, actor, body)
    except ClientError as exc:
        if conditional_failure(exc):
            raise ForbiddenError("共有設定または対象の生徒が変更されました。再読み込みしてください。") from exc
        raise
    return success(item)
