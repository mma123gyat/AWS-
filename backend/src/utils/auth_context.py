from dataclasses import dataclass
from typing import Any

from src.repositories.users_repository import get_user_by_cognito_sub, get_user_by_id
from src.utils.errors import ForbiddenError, UnauthorizedError


@dataclass(frozen=True)
class AuthenticatedUser:
    user_id: str
    cognito_sub: str
    name: str
    email: str
    role: str
    class_id: str | None
    linked_student_id: str | None


def _parse_groups(raw_groups: str | list[str] | None) -> list[str]:
    if raw_groups is None:
        return []
    if isinstance(raw_groups, list):
        return raw_groups
    # REST API + Cognito authorizer renders a list claim as "[STUDENT, TEACHER]".
    return [g.strip() for g in raw_groups.strip("[]").split(",") if g.strip()]


def get_authenticated_user(event: dict[str, Any]) -> AuthenticatedUser:
    """Resolves the calling user from the Cognito-verified JWT claims.

    API Gateway's COGNITO_USER_POOLS authorizer has already verified the
    token signature/expiry before the Lambda runs; this only trusts
    `requestContext.authorizer.claims`, never a header the caller could set.
    """
    claims = event.get("requestContext", {}).get("authorizer", {}).get("claims")
    if not claims:
        raise UnauthorizedError("認証情報が確認できませんでした。")

    cognito_sub = claims.get("sub")
    if not cognito_sub:
        raise UnauthorizedError("認証情報が確認できませんでした。")

    candidate = get_user_by_cognito_sub(cognito_sub)
    if not candidate:
        raise UnauthorizedError("ユーザー情報が見つかりませんでした。")

    # The GSI only locates the row. Its role, class and link may be stale.
    # Re-read the base table consistently before authorizing any endpoint,
    # including student endpoints that have no additional role resolver.
    user = get_user_by_id(candidate["user_id"])
    if not user or user.get("cognito_sub") != cognito_sub:
        raise ForbiddenError("アカウントの権限を確認できません。ログインし直してください。")

    groups = _parse_groups(claims.get("cognito:groups"))
    role = 'ADMIN' if 'ADMIN' in groups else next((g for g in groups if g in ("ADMIN", "STUDENT", "TEACHER", "PARENT", "SUPPORT")), user.get("role"))
    if role not in ("ADMIN", "STUDENT", "TEACHER", "PARENT", "SUPPORT") or role != user.get("role"):
        raise ForbiddenError("アカウントの権限が変更されました。ログインし直してください。")

    return AuthenticatedUser(
        user_id=user["user_id"],
        cognito_sub=cognito_sub,
        name=user.get("name", ""),
        email=user.get("email", ""),
        role=role,
        class_id=user.get("class_id"),
        linked_student_id=user.get("linked_student_id"),
    )


def require_role(user: AuthenticatedUser, *allowed_roles: str) -> None:
    if user.role not in allowed_roles:
        raise ForbiddenError("この操作を行う権限がありません。")
