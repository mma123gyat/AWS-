from src.repositories.users_repository import get_user_by_id, list_students_by_class_id
from src.services.teacher_class_service import get_current_teacher
from src.utils.errors import ForbiddenError, NotFoundError, ValidationError


def get_owned_student(event: dict) -> tuple[dict, dict]:
    """Use the current Users rows, not an old JWT role or GSI assignment."""
    teacher = get_current_teacher(event)
    student_id = (event.get("pathParameters") or {}).get("studentId")
    if not isinstance(student_id, str) or not student_id.strip():
        raise ValidationError("studentIdは必須です。")
    student = get_user_by_id(student_id)
    if not student or student.get("role") != "STUDENT":
        raise NotFoundError("生徒が見つかりませんでした。")
    if student.get("class_id") != teacher["class_id"]:
        raise ForbiddenError("担当クラス以外の生徒の情報は確認・変更できません。")
    return teacher, student


def list_owned_students(event: dict) -> list[dict]:
    teacher = get_current_teacher(event)
    # A class GSI can still contain a recently transferred student. Verify each
    # candidate before reading their learning data or returning their name.
    students = []
    for candidate in list_students_by_class_id(teacher["class_id"]):
        student = get_user_by_id(candidate["user_id"])
        if student and student.get("role") == "STUDENT" and student.get("class_id") == teacher["class_id"]:
            students.append(student)
    return students
