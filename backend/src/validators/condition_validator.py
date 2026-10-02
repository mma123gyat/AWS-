from typing import Any

from src.utils.errors import ValidationError

ALLOWED_AVAILABLE_MINUTES = {0, 5, 15, 30}  # 0 = 今日は休む


def validate_condition_input(payload: dict[str, Any]) -> int:
    available_minutes = payload.get("availableMinutes")
    if not isinstance(available_minutes, int) or available_minutes not in ALLOWED_AVAILABLE_MINUTES:
        raise ValidationError("学習時間は5分・15分・30分・今日は休む、のいずれかを選んでください。")
    return available_minutes
