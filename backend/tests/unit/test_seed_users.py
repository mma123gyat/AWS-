import boto3
import pytest
from moto import mock_aws

from scripts.seed_users import _get_or_create_cognito_user, _get_or_create_user_row
from src.repositories import dynamodb_client
from src.repositories.users_repository import create_user, get_user_by_cognito_sub


@pytest.fixture(autouse=True)
def _aws_credentials(monkeypatch):
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_SECURITY_TOKEN", "testing")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "testing")
    monkeypatch.setenv("AWS_REGION", "ap-northeast-1")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "ap-northeast-1")


@pytest.fixture
def seed_env():
    with mock_aws():
        dynamodb_client.get_resource.cache_clear()
        dynamodb_client.get_client.cache_clear()

        ddb = boto3.client("dynamodb", region_name="ap-northeast-1")
        ddb.create_table(
            TableName="Users",
            KeySchema=[{"AttributeName": "user_id", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "user_id", "AttributeType": "S"},
                {"AttributeName": "cognito_sub", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "cognito_sub-index",
                    "KeySchema": [{"AttributeName": "cognito_sub", "KeyType": "HASH"}],
                    "Projection": {"ProjectionType": "ALL"},
                }
            ],
            BillingMode="PAY_PER_REQUEST",
        )

        cognito_client = boto3.client("cognito-idp", region_name="ap-northeast-1")
        pool_id = cognito_client.create_user_pool(PoolName="test-pool")["UserPool"]["Id"]
        for group in ("TEACHER", "STUDENT", "PARENT", "SUPPORT"):
            cognito_client.create_group(UserPoolId=pool_id, GroupName=group)

        yield cognito_client, pool_id

        dynamodb_client.get_resource.cache_clear()
        dynamodb_client.get_client.cache_clear()


def _groups_of(cognito_client, pool_id: str, email: str) -> list[str]:
    result = cognito_client.admin_list_groups_for_user(UserPoolId=pool_id, Username=email)
    return [g["GroupName"] for g in result["Groups"]]


def test_get_or_create_cognito_user_creates_user_and_adds_to_group(seed_env):
    cognito_client, pool_id = seed_env

    sub = _get_or_create_cognito_user(cognito_client, pool_id, "teacher@example.com", "山田先生", "TEACHER")

    assert sub
    assert "TEACHER" in _groups_of(cognito_client, pool_id, "teacher@example.com")


def test_get_or_create_cognito_user_is_idempotent_and_does_not_duplicate(seed_env):
    cognito_client, pool_id = seed_env

    sub1 = _get_or_create_cognito_user(cognito_client, pool_id, "teacher@example.com", "山田先生", "TEACHER")
    sub2 = _get_or_create_cognito_user(cognito_client, pool_id, "teacher@example.com", "山田先生", "TEACHER")

    assert sub1 == sub2
    users = cognito_client.list_users(UserPoolId=pool_id)["Users"]
    assert len(users) == 1


def test_get_or_create_cognito_user_backfills_group_for_pre_existing_user_missing_it(seed_env):
    cognito_client, pool_id = seed_env
    # 既存ユーザーがGroupに所属していない状態を再現(過去にGroup未設定で作られたケース)。
    cognito_client.admin_create_user(
        UserPoolId=pool_id,
        Username="teacher@example.com",
        UserAttributes=[
            {"Name": "email", "Value": "teacher@example.com"},
            {"Name": "email_verified", "Value": "true"},
        ],
        MessageAction="SUPPRESS",
    )
    assert _groups_of(cognito_client, pool_id, "teacher@example.com") == []

    _get_or_create_cognito_user(cognito_client, pool_id, "teacher@example.com", "山田先生", "TEACHER")

    assert "TEACHER" in _groups_of(cognito_client, pool_id, "teacher@example.com")


def test_get_or_create_cognito_user_does_not_reset_password_for_existing_user(seed_env, monkeypatch):
    cognito_client, pool_id = seed_env
    _get_or_create_cognito_user(cognito_client, pool_id, "teacher@example.com", "山田先生", "TEACHER")

    def _fail(*args, **kwargs):
        raise AssertionError("admin_set_user_password は既存ユーザーに対して呼ばれるべきではない")

    monkeypatch.setattr(cognito_client, "admin_set_user_password", _fail)

    _get_or_create_cognito_user(cognito_client, pool_id, "teacher@example.com", "山田先生", "TEACHER")


def test_get_or_create_user_row_creates_new_row_when_none_exists(seed_env):
    row = _get_or_create_user_row("sub-student", "テスト生徒", "student@example.com", "STUDENT", class_id="class-1")

    assert row["class_id"] == "class-1"
    assert row["role"] == "STUDENT"


def test_get_or_create_user_row_backfills_missing_linked_student_id_for_parent(seed_env):
    create_user("parent-1", "sub-parent", "保護者", "parent@example.com", "PARENT")

    row = _get_or_create_user_row(
        "sub-parent", "保護者", "parent@example.com", "PARENT", linked_student_id="student-1"
    )

    assert row["user_id"] == "parent-1"
    assert row["linked_student_id"] == "student-1"


def test_get_or_create_user_row_backfills_missing_linked_student_id_for_support(seed_env):
    create_user("support-1", "sub-support", "支援担当者", "support@example.com", "SUPPORT")

    row = _get_or_create_user_row(
        "sub-support", "支援担当者", "support@example.com", "SUPPORT", linked_student_id="student-1"
    )

    assert row["user_id"] == "support-1"
    assert row["linked_student_id"] == "student-1"


def test_get_or_create_user_row_keeps_existing_user_id_for_student(seed_env):
    create_user("student-1", "sub-student", "テスト生徒", "student@example.com", "STUDENT", class_id="class-1")

    row = _get_or_create_user_row(
        "sub-student", "テスト生徒", "student@example.com", "STUDENT", class_id="class-1"
    )

    assert row["user_id"] == "student-1"


def test_get_or_create_user_row_does_not_duplicate_existing_user(seed_env):
    create_user("student-1", "sub-student", "テスト生徒", "student@example.com", "STUDENT", class_id="class-1")

    _get_or_create_user_row("sub-student", "テスト生徒", "student@example.com", "STUDENT", class_id="class-1")

    row = get_user_by_cognito_sub("sub-student")
    assert row["user_id"] == "student-1"
