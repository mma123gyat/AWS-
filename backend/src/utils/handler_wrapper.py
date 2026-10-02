from functools import wraps
from typing import Any, Callable

from src.utils.errors import ApiError
from src.utils.logger import operation_timer
from src.utils.response import error, error_from_exception


def lambda_handler(operation_name: str) -> Callable:
    """Wraps a Lambda entry point with structured logging and the common
    success/error envelope. Business logic should only ever raise ApiError
    subclasses for expected failures; anything else is logged and reported
    as a generic 500 so it is never silently swallowed.
    """

    def decorator(func: Callable[[dict, Any], dict]) -> Callable[[dict, Any], dict]:
        @wraps(func)
        def wrapper(event: dict, context: Any) -> dict:
            request_id = getattr(context, "aws_request_id", "local")
            try:
                with operation_timer(request_id, operation_name):
                    result = func(event, context)
                return result
            except ApiError as exc:
                return error_from_exception(exc)
            except Exception:
                return error("INTERNAL_ERROR", "予期しないエラーが発生しました。", 500)

        return wrapper

    return decorator
