from typing import Any

from src.utils.errors import ValidationError

ALLOWED_AVAILABLE_MINUTES = {0, 5, 15, 30}  # 0 = 今日は休む
ALLOWED_SUBJECT_IDS = {"japanese", "math", "science", "social", "english"}


def validate_subject_input(payload: dict) -> str | None:
    subject_id = payload.get("subjectId")
    if subject_id is not None and (
        not isinstance(subject_id, str) or subject_id not in ALLOWED_SUBJECT_IDS
    ):
        raise ValidationError("教科を選び直してください。")
    return subject_id


def validate_condition_input(payload: Any) -> int:
    if not isinstance(payload, dict):
        raise ValidationError("リクエストはオブジェクト形式で入力してください。")
    available_minutes = payload.get("availableMinutes")
    if type(available_minutes) is not int or available_minutes not in ALLOWED_AVAILABLE_MINUTES:
        raise ValidationError("学習時間は5分・15分・30分・今日は休む、のいずれかを選んでください。")
    return available_minutes
