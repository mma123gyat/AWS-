import boto3
import pytest
from moto import mock_aws

from src.repositories import dynamodb_client
from src.repositories.users_repository import create_user, get_user_by_id, update_user_fields


@pytest.fixture(autouse=True)
def _aws_credentials(monkeypatch):
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_SECURITY_TOKEN", "testing")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "testing")
    monkeypatch.setenv("AWS_REGION", "ap-northeast-1")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "ap-northeast-1")


@pytest.fixture
def tables():
    with mock_aws():
        dynamodb_client.get_resource.cache_clear()
        dynamodb_client.get_client.cache_clear()

        client = boto3.client("dynamodb", region_name="ap-northeast-1")
        client.create_table(
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
        yield
        dynamodb_client.get_resource.cache_clear()
        dynamodb_client.get_client.cache_clear()


def test_update_user_fields_updates_only_specified_fields(tables):
    create_user("user-1", "sub-1", "保護者", "parent@example.com", "PARENT")

    updated = update_user_fields("user-1", linked_student_id="student-1")

    assert updated["user_id"] == "user-1"
    assert updated["linked_student_id"] == "student-1"
    assert updated["name"] == "保護者"
    assert updated["role"] == "PARENT"


def test_update_user_fields_persists_and_keeps_user_id(tables):
    create_user("user-2", "sub-2", "支援担当者", "support@example.com", "SUPPORT")

    update_user_fields("user-2", linked_student_id="student-1")
    reloaded = get_user_by_id("user-2")

    assert reloaded["user_id"] == "user-2"
    assert reloaded["linked_student_id"] == "student-1"


def test_update_user_fields_can_update_multiple_fields(tables):
    create_user("user-3", "sub-3", "山田先生", "teacher@example.com", "TEACHER")

    updated = update_user_fields("user-3", class_id="class-1", name="山田先生2")

    assert updated["class_id"] == "class-1"
    assert updated["name"] == "山田先生2"
