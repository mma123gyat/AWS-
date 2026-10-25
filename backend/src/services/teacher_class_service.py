from src.repositories.school_classes_repository import get_class_by_id
from src.repositories.users_repository import get_user_by_id
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.errors import ForbiddenError, ValidationError


def get_current_teacher(event: dict) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "TEACHER")
    # GSI authentication data may lag an assignment or role change.
    teacher = get_user_by_id(user.user_id)
    if not teacher or teacher.get("role") != "TEACHER" or teacher.get("cognito_sub") != user.cognito_sub:
        raise ForbiddenError("教員アカウントの権限を確認できません。ログインし直してください。")
    class_id = teacher.get("class_id")
    if not isinstance(class_id, str) or not class_id.strip() or class_id != class_id.strip():
        raise ValidationError("担当クラスが設定されていません。管理者にお問い合わせください。")
    return teacher


def get_teacher_profile(event: dict) -> dict:
    teacher = get_current_teacher(event)
    school_class = get_class_by_id(teacher["class_id"])
    name = school_class.get("class_name") if school_class else None
    return {"classId": teacher["class_id"], "className": name.strip() if isinstance(name, str) and name.strip() else None}
