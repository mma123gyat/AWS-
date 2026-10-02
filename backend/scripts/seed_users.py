"""One-off admin seed script for the MVP (no self-signup UI yet).

Creates one demo school class, one subject master list, one TEACHER and one
STUDENT Cognito account (+ matching Users table rows), so the thin end-to-end
flow in spec section 29 can be exercised manually.

Usage (from backend/, with the venv active):
    python -m scripts.seed_users
"""

import os
import uuid

import boto3
from dotenv import load_dotenv

from src.repositories.school_classes_repository import put_class
from src.repositories.subjects_repository import put_subject
from src.repositories.users_repository import create_user

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
DEMO_PASSWORD = "Passw0rd!2026"


def _create_cognito_user(cognito_client, user_pool_id: str, email: str, name: str, group: str) -> str:
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
    sub = next(a["Value"] for a in user["UserAttributes"] if a["Name"] == "sub")
    return sub


def main() -> None:
    region = os.environ["AWS_REGION"]
    user_pool_id = os.environ["COGNITO_USER_POOL_ID"]
    cognito_client = boto3.client("cognito-idp", region_name=region)

    put_class(CLASS_ID, grade="中学2年", class_name="2年1組", school_year="2026")
    for subject_id, name in SUBJECTS:
        put_subject(subject_id, name)

    teacher_sub = _create_cognito_user(cognito_client, user_pool_id, TEACHER_EMAIL, "山田先生", "TEACHER")
    teacher_id = str(uuid.uuid4())
    create_user(teacher_id, teacher_sub, "山田先生", TEACHER_EMAIL, "TEACHER", class_id=CLASS_ID)

    student_sub = _create_cognito_user(cognito_client, user_pool_id, STUDENT_EMAIL, "テスト生徒", "STUDENT")
    student_id = str(uuid.uuid4())
    create_user(student_id, student_sub, "テスト生徒", STUDENT_EMAIL, "STUDENT", class_id=CLASS_ID)

    print("Seed complete.")
    print(f"  class_id   = {CLASS_ID}")
    print(f"  teacher_id = {teacher_id}  login: {TEACHER_EMAIL} / {DEMO_PASSWORD}")
    print(f"  student_id = {student_id}  login: {STUDENT_EMAIL} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
