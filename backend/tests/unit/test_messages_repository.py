import boto3
import pytest
from moto import mock_aws

from src.repositories import dynamodb_client, messages_repository

STUDENT_ID = "student-1"


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
            TableName="Messages",
            KeySchema=[
                {"AttributeName": "student_id", "KeyType": "HASH"},
                {"AttributeName": "sort_key", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "student_id", "AttributeType": "S"},
                {"AttributeName": "sort_key", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        yield
        dynamodb_client.get_resource.cache_clear()
        dynamodb_client.get_client.cache_clear()


def test_put_message_sets_expected_fields(tables):
    item = messages_repository.put_message(
        student_id=STUDENT_ID,
        sender_user_id="support-1",
        sender_role="SUPPORT",
        body="最近、数学に継続して取り組めています。",
    )

    assert item["student_id"] == STUDENT_ID
    assert item["sender_user_id"] == "support-1"
    assert item["sender_role"] == "SUPPORT"
    assert item["sort_key"] == f"{item['created_at']}#{item['message_id']}"


def test_list_messages_by_student_returns_newest_first(tables):
    first = messages_repository.put_message(STUDENT_ID, "support-1", "SUPPORT", "1件目")
    second = messages_repository.put_message(STUDENT_ID, "support-1", "SUPPORT", "2件目")

    items = messages_repository.list_messages_by_student(STUDENT_ID)

    assert [i["message_id"] for i in items] == [second["message_id"], first["message_id"]]


def test_list_messages_by_student_only_returns_that_students_messages(tables):
    messages_repository.put_message(STUDENT_ID, "support-1", "SUPPORT", "対象生徒宛")
    messages_repository.put_message("student-2", "support-1", "SUPPORT", "別の生徒宛")

    items = messages_repository.list_messages_by_student(STUDENT_ID)

    assert len(items) == 1
    assert items[0]["body"] == "対象生徒宛"
