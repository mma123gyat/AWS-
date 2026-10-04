import json
from decimal import Decimal
from typing import Any

from src.utils.errors import ApiError

_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "http://localhost:5173",
}


def _json_default(obj: Any) -> Any:
    # boto3's DynamoDB resource returns numeric attributes as Decimal.
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def _dumps(payload: dict) -> str:
    return json.dumps(payload, ensure_ascii=False, default=_json_default)


def success(data: Any, status_code: int = 200) -> dict:
    return {
        "statusCode": status_code,
        "headers": _HEADERS,
        "body": _dumps({"success": True, "data": data}),
    }


def error(code: str, message: str, status_code: int = 400) -> dict:
    return {
        "statusCode": status_code,
        "headers": _HEADERS,
        "body": _dumps({"success": False, "error": {"code": code, "message": message}}),
    }


def error_from_exception(exc: ApiError) -> dict:
    return error(exc.code, exc.message, exc.status_code)
