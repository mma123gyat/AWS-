"""Absent legacy settings preserve sharing; malformed saved flags never grant access."""
from copy import deepcopy
from decimal import Decimal

from src.utils.errors import ValidationError

DEFAULT_SETTINGS = {
    "parent": {"studySummary": True, "messages": True},
    "support": {"studySummary": True, "subjectProgress": True, "messages": True},
}


def read_settings(student: dict) -> dict:
    if "sharing_settings" not in student:
        return deepcopy(DEFAULT_SETTINGS)
    saved = student.get("sharing_settings")
    return {
        role: {key: isinstance(saved, dict) and isinstance(saved.get(role), dict)
               and saved[role].get(key) is True for key in flags}
        for role, flags in DEFAULT_SETTINGS.items()
    }


def read_version(student: dict) -> int:
    value = student.get("sharing_version", 0)
    if isinstance(value, (int, Decimal)) and not isinstance(value, bool) and value == int(value) and 0 <= value <= 9007199254740991:
        return int(value)
    raise ValidationError("共有設定の保存情報を確認できません。管理者にお問い合わせください。")


def validate_input(payload: object) -> tuple[dict, int]:
    if not isinstance(payload, dict) or set(payload) != {"studentId", "settings", "version"}:
        raise ValidationError("共有設定とバージョンを指定してください。")
    if not isinstance(payload["studentId"], str) or not payload["studentId"]:
        raise ValidationError("対象の生徒を確認してください。")
    settings, version = payload["settings"], payload["version"]
    if type(version) is not int or not 0 <= version < 9007199254740991:
        raise ValidationError("バージョンが不正です。")
    if not isinstance(settings, dict) or set(settings) != set(DEFAULT_SETTINGS):
        raise ValidationError("共有先が不正です。")
    for role, flags in DEFAULT_SETTINGS.items():
        if not isinstance(settings[role], dict) or set(settings[role]) != set(flags) or any(type(value) is not bool for value in settings[role].values()):
            raise ValidationError("共有項目にはONまたはOFFを指定してください。")
    return deepcopy(settings), version
