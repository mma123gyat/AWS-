import json

from src.repositories.messages_repository import put_message
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.errors import ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success

MAX_BODY_LENGTH = 1000


@lambda_handler("support.post_message")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "SUPPORT")

    if not user.linked_student_id:
        raise ValidationError("対象の生徒が設定されていません。")

    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        raise ValidationError("リクエストの形式が不正です。")

    body = (payload.get("body") or "").strip()
    if not body:
        raise ValidationError("メッセージを入力してください。")
    if len(body) > MAX_BODY_LENGTH:
        raise ValidationError(f"メッセージは{MAX_BODY_LENGTH}文字以内で入力してください。")

    item = put_message(
        student_id=user.linked_student_id,
        sender_user_id=user.user_id,
        sender_role=user.role,
        body=body,
    )
    return success(item)
