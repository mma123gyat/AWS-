from typing import Any

from src.utils.errors import ValidationError

VALID_CURRICULUM_STATUSES = {"NOT_STARTED", "IN_PROGRESS", "COMPLETED"}


def validate_curriculum_input(payload: dict[str, Any]) -> dict[str, Any]:
    subject_id = payload.get("subjectId")
    unit_name = payload.get("unitName")
    textbook_page = payload.get("textbookPage", "")
    status = payload.get("status")

    if not subject_id:
        raise ValidationError("教科は必須です。")
    if not unit_name:
        raise ValidationError("単元は必須です。")
    if status not in VALID_CURRICULUM_STATUSES:
        raise ValidationError("進行状態の指定が不正です。")

    return {
        "subject_id": subject_id,
        "unit_name": unit_name,
        "textbook_page": textbook_page,
        "status": status,
    }


def validate_student_progress_input(payload: dict[str, Any]) -> dict[str, Any]:
    from src.validators.understanding_validator import validate_understanding

    subject_id = payload.get("subjectId")
    unit_name = payload.get("unitName")
    status = payload.get("status")
    understanding = validate_understanding(payload.get("understanding"))

    if not subject_id:
        raise ValidationError("教科は必須です。")
    if not unit_name:
        raise ValidationError("単元は必須です。")
    if status not in VALID_CURRICULUM_STATUSES:
        raise ValidationError("進行状態の指定が不正です。")

    return {
        "subject_id": subject_id,
        "unit_name": unit_name,
        "status": status,
        "understanding": understanding,
    }
