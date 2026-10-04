class ApiError(Exception):
    """Base class for errors that map directly to the API error envelope."""

    code = "INTERNAL_ERROR"
    status_code = 500

    def __init__(self, message: str, code: str | None = None, status_code: int | None = None):
        super().__init__(message)
        self.message = message
        if code is not None:
            self.code = code
        if status_code is not None:
            self.status_code = status_code


class ValidationError(ApiError):
    code = "VALIDATION_ERROR"
    status_code = 400


class UnauthorizedError(ApiError):
    code = "UNAUTHORIZED"
    status_code = 401


class ForbiddenError(ApiError):
    code = "FORBIDDEN"
    status_code = 403


class ConflictError(ApiError):
    code = "CONFLICT"
    status_code = 409


class NotFoundError(ApiError):
    code = "NOT_FOUND"
    status_code = 404
