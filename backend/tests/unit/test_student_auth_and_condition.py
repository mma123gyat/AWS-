"""Exercise real authentication and condition writes against Moto, never AWS."""
import copy
import json

import boto3
import pytest
from moto import mock_aws

from src.handlers.students import (
    complete_task, get_dashboard, get_sharing, get_study_plan_today,
    get_study_records, post_condition, post_study_plan, post_study_record, put_sharing,
)
from src.repositories import dynamodb_client, users_repository
from src.utils import auth_context
from src.utils.dates import today_jst
from src.utils.errors import ForbiddenError

STUDENT_ENDPOINTS = [
    complete_task, get_dashboard, get_sharing, get_study_plan_today,
    get_study_records, post_condition, post_study_plan, post_study_record, put_sharing,
]


def event(body='{"availableMinutes":15}', groups="[STUDENT]"):
    return {
        "requestContext": {"authorizer": {"claims": {"sub": "sub-1", "cognito:groups": groups}}},
        "body": body,
        "pathParameters": {"taskId": "plan-1#1"},
    }


@pytest.fixture
def app(monkeypatch):
    for key, value in {
        "AWS_ACCESS_KEY_ID": "testing", "AWS_SECRET_ACCESS_KEY": "testing",
        "AWS_SESSION_TOKEN": "testing", "AWS_REGION": "ap-northeast-1",
        "AWS_DEFAULT_REGION": "ap-northeast-1", "AWS_EC2_METADATA_DISABLED": "true",
    }.items():
        monkeypatch.setenv(key, value)
    with mock_aws():
        dynamodb_client.get_resource.cache_clear()
        dynamodb_client.get_client.cache_clear()
        db = boto3.resource("dynamodb", region_name="ap-northeast-1")
        db.create_table(
            TableName="Users", BillingMode="PAY_PER_REQUEST",
            KeySchema=[{"AttributeName": "user_id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "user_id", "AttributeType": "S"},
                                  {"AttributeName": "cognito_sub", "AttributeType": "S"}],
            GlobalSecondaryIndexes=[{
                "IndexName": "cognito_sub-index",
                "KeySchema": [{"AttributeName": "cognito_sub", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"},
            }],
        )
        db.create_table(
            TableName="DailyConditions", BillingMode="PAY_PER_REQUEST",
            KeySchema=[{"AttributeName": "student_id", "KeyType": "HASH"}, {"AttributeName": "date", "KeyType": "RANGE"}],
            AttributeDefinitions=[{"AttributeName": "student_id", "AttributeType": "S"}, {"AttributeName": "date", "AttributeType": "S"}],
        )
        users_repository.create_user("student-1", "sub-1", "生徒", "", "STUDENT", class_id="class-1")
        yield db
        dynamodb_client.get_resource.cache_clear()
        dynamodb_client.get_client.cache_clear()


@pytest.mark.parametrize("module", STUDENT_ENDPOINTS)
@pytest.mark.parametrize("change", ["role", "delete", "sub"])
def test_revoked_student_cannot_use_any_endpoint_with_old_jwt_and_stale_gsi(app, monkeypatch, module, change):
    stale = users_repository.get_user_by_id("student-1")
    monkeypatch.setattr(auth_context, "get_user_by_cognito_sub", lambda _: copy.deepcopy(stale))
    if change == "delete":
        app.Table("Users").delete_item(Key={"user_id": "student-1"})
    else:
        users_repository.update_user_fields("student-1", **({"role": "SUPPORT"} if change == "role" else {"cognito_sub": "replacement"}))
    response = module.handler(event(), None)
    assert response["statusCode"] == 403
    assert app.Table("DailyConditions").scan()["Items"] == []


def test_changed_role_is_rejected_even_after_gsi_catches_up(app):
    users_repository.update_user_fields("student-1", role="SUPPORT")
    assert users_repository.get_user_by_cognito_sub("sub-1")["role"] == "SUPPORT"
    assert post_condition.handler(event(), None)["statusCode"] == 403
    assert app.Table("DailyConditions").scan()["Items"] == []


@pytest.mark.parametrize("role", ["STUDENT", "TEACHER", "PARENT", "SUPPORT"])
def test_current_matching_role_still_authenticates(app, role):
    users_repository.update_user_fields("student-1", role=role)
    assert auth_context.get_authenticated_user(event(groups=f"[{role}]")).role == role


def test_authentication_uses_current_class_link_and_name_from_consistent_read(app, monkeypatch):
    stale = users_repository.get_user_by_id("student-1")
    users_repository.update_user_fields("student-1", class_id="class-2", linked_student_id="current-child", name="現在の名前")
    monkeypatch.setattr(auth_context, "get_user_by_cognito_sub", lambda _: stale)
    table = app.Table("Users")
    monkeypatch.setattr(users_repository, "_table", lambda: table)
    original = table.get_item
    observed = []

    def get_item(**kwargs):
        observed.append(kwargs)
        return original(**kwargs)

    monkeypatch.setattr(table, "get_item", get_item)
    user = auth_context.get_authenticated_user(event())
    assert (user.class_id, user.linked_student_id, user.name) == ("class-2", "current-child", "現在の名前")
    assert observed == [{"Key": {"user_id": "student-1"}, "ConsistentRead": True}]


@pytest.mark.parametrize("groups", ["[TEACHER]", "[PARENT]", "[SUPPORT]"])
def test_different_token_role_cannot_escalate_current_student(app, groups):
    with pytest.raises(ForbiddenError):
        auth_context.get_authenticated_user(event(groups=groups))


@pytest.mark.parametrize("body", [
    "null", "[]", '"15"', "15", "false", "{", {"availableMinutes": 15},
    '{"availableMinutes":false}', '{"availableMinutes":true}', '{"availableMinutes":15.0}',
])
def test_bad_condition_body_returns_400_and_keeps_previous_choice(app, body):
    assert post_condition.handler(event(), None)["statusCode"] == 200
    table = app.Table("DailyConditions")
    key = {"student_id": "student-1", "date": today_jst()}
    before = table.get_item(Key=key)["Item"]
    response = post_condition.handler(event(body=body), None)
    assert response["statusCode"] == 400
    assert json.loads(response["body"])["error"]["code"] == "VALIDATION_ERROR"
    assert table.get_item(Key=key)["Item"] == before


@pytest.mark.parametrize("minutes", [0, 5, 15, 30])
def test_valid_condition_is_saved_as_a_number(app, minutes):
    response = post_condition.handler(event(body=json.dumps({"availableMinutes": minutes})), None)
    assert response["statusCode"] == 200
    assert type(json.loads(response["body"])["data"]["available_minutes"]) is int
    stored = app.meta.client.get_item(
        TableName="DailyConditions", Key={"student_id": "student-1", "date": today_jst()},
    )["Item"]["available_minutes"]
    assert stored == minutes and type(stored) is not bool
