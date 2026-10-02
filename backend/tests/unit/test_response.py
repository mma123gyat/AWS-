import json
from decimal import Decimal

from src.utils.errors import NotFoundError
from src.utils.response import error, error_from_exception, success


def test_success_envelope():
    result = success({"foo": "bar"})
    assert result["statusCode"] == 200
    body = json.loads(result["body"])
    assert body == {"success": True, "data": {"foo": "bar"}}


def test_error_envelope():
    result = error("VALIDATION_ERROR", "不正な入力です。", 400)
    assert result["statusCode"] == 400
    body = json.loads(result["body"])
    assert body == {
        "success": False,
        "error": {"code": "VALIDATION_ERROR", "message": "不正な入力です。"},
    }


def test_error_from_exception_uses_exception_status_and_code():
    result = error_from_exception(NotFoundError("見つかりません。"))
    assert result["statusCode"] == 404
    body = json.loads(result["body"])
    assert body["error"]["code"] == "NOT_FOUND"


def test_success_envelope_serializes_dynamodb_decimal():
    # boto3's DynamoDB resource returns Number attributes as Decimal.
    result = success({"understanding": Decimal("3"), "available_minutes": Decimal("15.5")})
    body = json.loads(result["body"])
    assert body["data"]["understanding"] == 3
    assert isinstance(body["data"]["understanding"], int)
    assert body["data"]["available_minutes"] == 15.5
