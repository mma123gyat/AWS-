from typing import Any

from src.utils.errors import ValidationError
from src.validators.understanding_validator import validate_understanding


def validate_study_record_input(payload: dict[str, Any]) -> dict[str, Any]:
    task_id = payload.get("taskId")
    actual_minutes = payload.get("actualMinutes")
    understanding = validate_understanding(payload.get("understanding"))

    if not task_id or not isinstance(task_id, str):
        raise ValidationError("taskIdは必須です。")
    if not isinstance(actual_minutes, int) or actual_minutes <= 0:
        raise ValidationError("学習時間(分)は1以上の整数で入力してください。")

    return {
        "task_id": task_id,
        "actual_minutes": actual_minutes,
        "understanding": understanding,
    }
