"""Validate invitations; class IDs are assertions, never authorization."""
import re
from typing import Any
from src.utils.errors import ValidationError

INVITABLE_ROLES = {"STUDENT", "PARENT", "SUPPORT"}


def validate_invitation(payload: Any) -> dict:
    if not isinstance(payload, dict) or set(payload) - {"name", "email", "role", "classId", "studentId"}:
        raise ValidationError("招待する方の名前・メールアドレス・種別を指定してください。")
    result = {}
    for key, limit in [("name", 100), ("email", 254), ("classId", 128)]:
        value = payload.get(key)
        if not isinstance(value, str) or not value.strip() or len(value.strip()) > limit:
            raise ValidationError("名前・メールアドレス・担当クラスを確認してください。")
        result[key] = value.strip()
    email = result["email"].lower()
    if not re.fullmatch(r"[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}", email):
        raise ValidationError("受信できるメールアドレスを入力してください。")
    role = payload.get("role")
    if not isinstance(role, str) or role not in INVITABLE_ROLES:
        raise ValidationError("招待できる種別は生徒・保護者・支援者です。")
    student = payload.get("studentId")
    if role == "STUDENT":
        if student is not None:
            raise ValidationError("生徒の招待に紐づけ先は指定できません。")
    elif not isinstance(student, str) or not student.strip() or len(student) > 128:
        raise ValidationError("紐づける生徒を選択してください。")
    return {**result, "email": email, "role": role, "studentId": student}
