from typing import Any

from src.utils.errors import ValidationError
from src.validators.understanding_validator import validate_understanding

VALID_CURRICULUM_STATUSES = {"NOT_STARTED", "IN_PROGRESS", "COMPLETED"}
MAX_SUBJECT_ID_LENGTH = 128
MAX_UNIT_NAME_LENGTH = 200
MAX_TEXTBOOK_PAGE_LENGTH = 100


def _object(payload: object) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValidationError("リクエストはオブジェクト形式で入力してください。")
    return payload


def _text(payload: dict[str, Any], key: str, label: str, maximum: int, *, required: bool = True) -> str:
    value = payload.get(key, "")
    if not isinstance(value, str):
        raise ValidationError(f"{label}は文字列で入力してください。")
    value = value.strip()
    if required and not value:
        raise ValidationError(f"{label}は必須です。")
    if len(value) > maximum:
        raise ValidationError(f"{label}は{maximum}文字以内で入力してください。")
    return value


def _status(payload: dict[str, Any]) -> str:
    status = payload.get("status")
    # Check the type before set membership, so lists/maps return 400, not 500.
    if not isinstance(status, str) or status not in VALID_CURRICULUM_STATUSES:
        raise ValidationError("進行状態の指定が不正です。")
    return status


def validate_curriculum_input(payload: object) -> dict[str, Any]:
    payload = _object(payload)
    return {
        "subject_id": _text(payload, "subjectId", "教科ID", MAX_SUBJECT_ID_LENGTH),
        "unit_name": _text(payload, "unitName", "単元名", MAX_UNIT_NAME_LENGTH),
        "textbook_page": _text(payload, "textbookPage", "教科書ページ", MAX_TEXTBOOK_PAGE_LENGTH, required=False),
        "status": _status(payload),
    }


def validate_student_progress_input(payload: object) -> dict[str, Any]:
    payload = _object(payload)
    return {
        "subject_id": _text(payload, "subjectId", "教科ID", MAX_SUBJECT_ID_LENGTH),
        "unit_name": _text(payload, "unitName", "単元名", MAX_UNIT_NAME_LENGTH),
        "status": _status(payload),
        "understanding": validate_understanding(payload.get("understanding")),
    }
