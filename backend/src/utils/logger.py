import json
import logging
import time
from contextlib import contextmanager
from typing import Any

logger = logging.getLogger("study_platform")
logger.setLevel(logging.INFO)
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(_handler)

# Keys that must never reach CloudWatch, however nested.
_SENSITIVE_KEYS = {
    "password",
    "token",
    "jwt",
    "authorization",
    "id_token",
    "access_token",
    "refresh_token",
}


def _redact(data: Any) -> Any:
    if isinstance(data, dict):
        return {
            key: ("***" if key.lower() in _SENSITIVE_KEYS else _redact(value))
            for key, value in data.items()
        }
    if isinstance(data, list):
        return [_redact(item) for item in data]
    return data


def log_event(
    request_id: str,
    operation: str,
    status: str,
    duration_ms: float,
    extra: dict | None = None,
) -> None:
    payload: dict[str, Any] = {
        "requestId": request_id,
        "operation": operation,
        "status": status,
        "durationMs": round(duration_ms, 2),
    }
    if extra:
        payload.update(_redact(extra))
    logger.info(json.dumps(payload, ensure_ascii=False))


@contextmanager
def operation_timer(request_id: str, operation: str):
    """Logs a single SUCCESS/FAILURE line with duration for a handler/service call."""
    start = time.perf_counter()
    try:
        yield
        log_event(request_id, operation, "SUCCESS", (time.perf_counter() - start) * 1000)
    except Exception as exc:
        log_event(
            request_id,
            operation,
            "FAILURE",
            (time.perf_counter() - start) * 1000,
            {"error": str(exc)},
        )
        raise
