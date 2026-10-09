"""One-off admin seed script for the MVP (no self-signup UI yet).

Creates one demo school class, one subject master list, and demo accounts for
all four roles (TEACHER, STUDENT, PARENT, SUPPORT) so the thin end-to-end flow
in spec section 29 can be exercised manually. PARENT/SUPPORT are linked to the
single demo student via `linked_student_id`.

Idempotent: safe to re-run. Existing Cognito users and Users-table rows are
reused rather than recreated (looked up by email / cognito_sub), so re-running
never duplicates accounts or loses the student's existing StudentProgresses /
StudyRecords / StudyPlans / StudyTasks data.

Usage (from backend/, with the venv active):
    python -m scripts.seed_users
"""

import os
import uuid

import boto3
from dotenv import load_dotenv

from src.repositories.school_classes_repository import put_class
from src.repositories.subjects_repository import put_subject
from src.repositories.users_repository import create_user, get_user_by_cognito_sub

load_dotenv(override=True)

CLASS_ID = "class-1"
SUBJECTS = [
    ("math", "数学"),
    ("english", "英語"),
    ("japanese", "国語"),
    ("science", "理科"),
    ("social", "社会"),
]
TEACHER_EMAIL = "teacher@example.com"
STUDENT_EMAIL = "student@example.com"
PARENT_EMAIL = "parent@example.com"
SUPPORT_EMAIL = "support@example.com"
DEMO_PASSWORD = "Passw0rd!2026"


def _sub_of(user: dict) -> str:
    return next(a["Value"] for a in user["UserAttributes"] if a["Name"] == "sub")


def _get_or_create_cognito_user(cognito_client, user_pool_id: str, email: str, name: str, group: str) -> str:
    """Returns the Cognito `sub` for `email`, creating the user only if it
    doesn't already exist (re-running this script must never fail on
    UsernameExistsException nor reset an already-configured account)."""
    try:
        existing = cognito_client.admin_get_user(UserPoolId=user_pool_id, Username=email)
        return _sub_of(existing)
    except cognito_client.exceptions.UserNotFoundException:
        pass

    cognito_client.admin_create_user(
        UserPoolId=user_pool_id,
        Username=email,
        UserAttributes=[
            {"Name": "email", "Value": email},
            {"Name": "email_verified", "Value": "true"},
            {"Name": "name", "Value": name},
        ],
        MessageAction="SUPPRESS",
    )
    cognito_client.admin_set_user_password(
        UserPoolId=user_pool_id,
        Username=email,
        Password=DEMO_PASSWORD,
        Permanent=True,
    )
    cognito_client.admin_add_user_to_group(
        UserPoolId=user_pool_id,
        Username=email,
        GroupName=group,
    )
    user = cognito_client.admin_get_user(UserPoolId=user_pool_id, Username=email)
    return _sub_of(user)


def _get_or_create_user_row(
    cognito_sub: str,
    name: str,
    email: str,
    role: str,
    class_id: str | None = None,
    linked_student_id: str | None = None,
) -> dict:
    """Returns the Users-table row for `cognito_sub`, creating it only if it
    doesn't already exist. A new user_id is only minted on first creation —
    re-running never changes an existing user's id, so it never breaks
    existing StudentProgresses/StudyRecords/StudyPlans/StudyTasks rows that
    reference that student_id."""
    existing = get_user_by_cognito_sub(cognito_sub)
    if existing is not None:
        return existing
    return create_user(
        str(uuid.uuid4()),
        cognito_sub,
        name,
        email,
        role,
        class_id=class_id,
        linked_student_id=linked_student_id,
    )


def main() -> None:
    region = os.environ["AWS_REGION"]
    user_pool_id = os.environ["COGNITO_USER_POOL_ID"]
    cognito_client = boto3.client("cognito-idp", region_name=region)

    put_class(CLASS_ID, grade="中学2年", class_name="2年1組", school_year="2026")
    for subject_id, name in SUBJECTS:
        put_subject(subject_id, name)

    teacher_sub = _get_or_create_cognito_user(cognito_client, user_pool_id, TEACHER_EMAIL, "山田先生", "TEACHER")
    teacher = _get_or_create_user_row(teacher_sub, "山田先生", TEACHER_EMAIL, "TEACHER", class_id=CLASS_ID)

    student_sub = _get_or_create_cognito_user(cognito_client, user_pool_id, STUDENT_EMAIL, "テスト生徒", "STUDENT")
    student = _get_or_create_user_row(student_sub, "テスト生徒", STUDENT_EMAIL, "STUDENT", class_id=CLASS_ID)
    student_id = student["user_id"]

    # PARENT/SUPPORTは常にこの既存studentに紐づける(新しいstudent_idは作らない)。
    parent_sub = _get_or_create_cognito_user(cognito_client, user_pool_id, PARENT_EMAIL, "保護者", "PARENT")
    parent = _get_or_create_user_row(parent_sub, "保護者", PARENT_EMAIL, "PARENT", linked_student_id=student_id)

    support_sub = _get_or_create_cognito_user(cognito_client, user_pool_id, SUPPORT_EMAIL, "支援担当者", "SUPPORT")
    support = _get_or_create_user_row(support_sub, "支援担当者", SUPPORT_EMAIL, "SUPPORT", linked_student_id=student_id)

    print("Seed complete.")
    print(f"  class_id   = {CLASS_ID}")
    print(f"  teacher_id = {teacher['user_id']}  login: {TEACHER_EMAIL} / {DEMO_PASSWORD}")
    print(f"  student_id = {student_id}  login: {STUDENT_EMAIL} / {DEMO_PASSWORD}")
    print(f"  parent_id  = {parent['user_id']}  login: {PARENT_EMAIL} / {DEMO_PASSWORD}  (linked_student_id={student_id})")
    print(f"  support_id = {support['user_id']}  login: {SUPPORT_EMAIL} / {DEMO_PASSWORD}  (linked_student_id={student_id})")


if __name__ == "__main__":
    main()
