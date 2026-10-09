import json

import boto3
import pytest
from moto import mock_aws

from src.handlers.parents import get_dashboard as parents_get_dashboard
from src.handlers.support import get_report as support_get_report
from src.handlers.support import post_message as support_post_message
from src.repositories import dynamodb_client, messages_repository
from src.repositories.users_repository import create_user

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
        client.create_table(
            TableName="StudyRecords",
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
        client.create_table(
            TableName="StudentProgresses",
            KeySchema=[
                {"AttributeName": "student_id", "KeyType": "HASH"},
                {"AttributeName": "subject_id", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "student_id", "AttributeType": "S"},
                {"AttributeName": "subject_id", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        client.create_table(
            TableName="Subjects",
            KeySchema=[{"AttributeName": "subject_id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "subject_id", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
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


def _event(cognito_sub: str, groups: str) -> dict:
    return {
        "requestContext": {
            "authorizer": {"claims": {"sub": cognito_sub, "cognito:groups": groups}}
        }
    }


def _body(result: dict) -> dict:
    return json.loads(result["body"])


def test_parent_dashboard_rejects_non_parent_role(tables):
    create_user("student-user", "sub-student", "テスト生徒", "student@example.com", "STUDENT")

    result = parents_get_dashboard.handler(_event("sub-student", "[STUDENT]"), None)

    assert result["statusCode"] == 403


def test_parent_dashboard_requires_linked_student_id(tables):
    create_user("parent-user", "sub-parent", "保護者", "parent@example.com", "PARENT")

    result = parents_get_dashboard.handler(_event("sub-parent", "[PARENT]"), None)

    assert result["statusCode"] == 400


def test_parent_dashboard_returns_messages_sent_by_support(tables):
    create_user(
        "parent-user", "sub-parent", "保護者", "parent@example.com", "PARENT", linked_student_id=STUDENT_ID
    )
    messages_repository.put_message(STUDENT_ID, "support-user", "SUPPORT", "最近がんばっています。")

    result = parents_get_dashboard.handler(_event("sub-parent", "[PARENT]"), None)

    assert result["statusCode"] == 200
    body = _body(result)
    assert body["data"]["messages"][0]["body"] == "最近がんばっています。"
    assert len(body["data"]["badges"]) == 4


def test_support_report_rejects_non_support_role(tables):
    create_user("student-user", "sub-student", "テスト生徒", "student@example.com", "STUDENT")

    result = support_get_report.handler(_event("sub-student", "[STUDENT]"), None)

    assert result["statusCode"] == 403


def test_support_report_shows_attendance_as_not_yet_linked(tables):
    create_user(
        "support-user", "sub-support", "支援担当者", "support@example.com", "SUPPORT",
        linked_student_id=STUDENT_ID,
    )

    result = support_get_report.handler(_event("sub-support", "[SUPPORT]"), None)

    assert result["statusCode"] == 200
    body = _body(result)
    assert body["data"]["attendance"] is None
    assert "連携" in body["data"]["attendanceNote"]


def test_support_post_message_persists_and_is_visible_to_parent(tables):
    create_user(
        "support-user", "sub-support", "支援担当者", "support@example.com", "SUPPORT",
        linked_student_id=STUDENT_ID,
    )

    event = _event("sub-support", "[SUPPORT]")
    event["body"] = json.dumps({"body": "数学の宿題に継続して取り組めています。"})

    result = support_post_message.handler(event, None)

    assert result["statusCode"] == 200
    messages = messages_repository.list_messages_by_student(STUDENT_ID)
    assert len(messages) == 1
    assert messages[0]["body"] == "数学の宿題に継続して取り組めています。"


def test_support_post_message_rejects_empty_body(tables):
    create_user(
        "support-user", "sub-support", "支援担当者", "support@example.com", "SUPPORT",
        linked_student_id=STUDENT_ID,
    )

    event = _event("sub-support", "[SUPPORT]")
    event["body"] = json.dumps({"body": "   "})

    result = support_post_message.handler(event, None)

    assert result["statusCode"] == 400
