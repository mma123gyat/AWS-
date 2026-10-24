from typing import Any

from src.models.ai_parameters import DEFAULT_AI_PARAMETERS
from src.utils.errors import ValidationError


def validate_ai_parameters_input(payload: Any) -> dict[str, int]:
    if not isinstance(payload, dict) or set(payload) != set(DEFAULT_AI_PARAMETERS):
        raise ValidationError("難易度・学習量・サポートの強さをすべて指定してください。")
    if any(type(value) is not int or not 1 <= value <= 5 for value in payload.values()):
        raise ValidationError("AI提案パラメータは1〜5の整数で指定してください。")
    return {key: payload[key] for key in DEFAULT_AI_PARAMETERS}
