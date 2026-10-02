from typing import Any

from src.repositories.dynamodb_client import table

_TABLE_ENV = "SUBJECTS_TABLE_NAME"
_TABLE_DEFAULT = "Subjects"


def _table():
    return table(_TABLE_ENV, _TABLE_DEFAULT)


def get_subject_by_id(subject_id: str) -> dict[str, Any] | None:
    response = _table().get_item(Key={"subject_id": subject_id})
    return response.get("Item")


def list_subjects() -> list[dict[str, Any]]:
    response = _table().scan()
    return response.get("Items", [])


def put_subject(subject_id: str, name: str) -> dict[str, Any]:
    item = {"subject_id": subject_id, "name": name}
    _table().put_item(Item=item)
    return item
