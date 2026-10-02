from typing import Any

from src.repositories.dynamodb_client import table

_TABLE_ENV = "SCHOOL_CLASSES_TABLE_NAME"
_TABLE_DEFAULT = "SchoolClasses"


def _table():
    return table(_TABLE_ENV, _TABLE_DEFAULT)


def get_class_by_id(class_id: str) -> dict[str, Any] | None:
    response = _table().get_item(Key={"class_id": class_id})
    return response.get("Item")


def put_class(class_id: str, grade: str, class_name: str, school_year: str) -> dict[str, Any]:
    item = {
        "class_id": class_id,
        "grade": grade,
        "class_name": class_name,
        "school_year": school_year,
    }
    _table().put_item(Item=item)
    return item
