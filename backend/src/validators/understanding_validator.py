from typing import Any

from src.utils.errors import ValidationError


def validate_understanding(value: Any) -> int:
    if not isinstance(value, int) or not (1 <= value <= 5):
        raise ValidationError("理解度は1から5の範囲で入力してください。")
    return value
