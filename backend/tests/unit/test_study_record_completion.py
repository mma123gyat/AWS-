import json
from datetime import UTC, datetime
from unittest.mock import patch

import boto3
import pytest
from botocore.exceptions import EndpointConnectionError
from moto import mock_aws

from src.handlers.parents import get_dashboard as parent_dashboard
from src.handlers.students import post_study_record
from src.handlers.teacher.get_students import _summarize_student
from src.repositories import dynamodb_client, study_records_repository, study_tasks_repository
from src.utils.auth_context import AuthenticatedUser
from src.utils.dates import today_jst

STUDENT = AuthenticatedUser("student-1", "sub-1", "テスト生徒", "student@example.invalid", "STUDENT", "class-1", None)
TASK_ID = "plan-1#1"


@pytest.fixture(autouse=True)
def credentials(monkeypatch):
    for key, value in {
        "AWS_ACCESS_KEY_ID": "testing", "AWS_SECRET_ACCESS_KEY": "testing",
        "AWS_SESSION_TOKEN": "testing", "AWS_REGION": "ap-northeast-1",
        "AWS_DEFAULT_REGION": "ap-northeast-1",
    }.items():
        monkeypatch.setenv(key, value)
    monkeypatch.setattr(post_study_record, "get_authenticated_user", lambda event: STUDENT)


@pytest.fixture
def tables():
    with mock_aws():
        dynamodb_client.get_resource.cache_clear()
        dynamodb_client.get_client.cache_clear()
        resource = boto3.resource("dynamodb", region_name="ap-northeast-1")
        for name, partition, sort, sort_type in [
            ("StudyTasks", "plan_id", "task_order", "N"),
            ("StudyRecords", "student_id", "sort_key", "S"),
            ("Messages", "student_id", "sort_key", "S"),
            ("StudyPlans", "student_id", "plan_date", "S"),
            ("DailyConditions", "student_id", "date", "S"),
        ]:
            resource.create_table(
                TableName=name,
                KeySchema=[{"AttributeName": partition, "KeyType": "HASH"}, {"AttributeName": sort, "KeyType": "RANGE"}],
                AttributeDefinitions=[{"AttributeName": partition, "AttributeType": "S"}, {"AttributeName": sort, "AttributeType": sort_type}],
                BillingMode="PAY_PER_REQUEST",
            )
        task = study_tasks_repository.build_task_item(
            "plan-1", STUDENT.user_id, "math", "比例", 1, "比例の復習", "問題に取り組む", 5, "NOT_STARTED",
        )
        resource.Table("StudyTasks").put_item(Item=task)
        resource.Table("StudyPlans").put_item(Item={
            "student_id": STUDENT.user_id, "plan_date": today_jst(),
            "plan_id": "plan-1", "status": "COMPLETED", "available_minutes": 15,
        })
        resource.Table("DailyConditions").put_item(Item={
            "student_id": STUDENT.user_id, "date": today_jst(), "available_minutes": 15,
        })
        yield resource
        dynamodb_client.get_resource.cache_clear()
        dynamodb_client.get_client.cache_clear()


def post(payload=None):
    if payload is None:
        payload = {"taskId": TASK_ID, "actualMinutes": 7, "understanding": 4}
    return post_study_record.handler({"body": json.dumps(payload)}, None)


def data(response):
    return json.loads(response["body"])["data"]


def test_record_and_task_completion_are_saved_together(tables):
    response = post()
    assert response["statusCode"] == 200
    record = data(response)
    assert (record["actual_minutes"], record["understanding"]) == (7, 4)
    task = study_tasks_repository.get_task("plan-1", 1)
    assert task["status"] == "COMPLETED"
    assert task["completion_record"]["record_id"] == record["record_id"]
    records = study_records_repository.list_records_by_student(STUDENT.user_id)
    assert len(records) == 1
    assert records[0]["record_id"] == record["record_id"]


def test_retry_returns_the_same_record_without_adding_minutes(tables):
    first = post()
    second = post()
    assert first["statusCode"] == second["statusCode"] == 200
    assert data(first) == data(second)
    records = study_records_repository.list_records_by_student(STUDENT.user_id)
    assert len(records) == 1
    assert sum(r["actual_minutes"] for r in records) == 7


def test_changed_values_do_not_overwrite_an_existing_completion(tables):
    first = post()
    response = post({"taskId": TASK_ID, "actualMinutes": 15, "understanding": 2})
    assert response["statusCode"] == 409
    task = study_tasks_repository.get_task("plan-1", 1)
    assert task["completion_record"]["record_id"] == data(first)["record_id"]
    assert task["completion_record"]["actual_minutes"] == 7


def test_stale_read_losing_the_transaction_replays_the_winner(tables, monkeypatch):
    stale_task = study_tasks_repository.get_task("plan-1", 1)
    first = post()
    monkeypatch.setattr(post_study_record, "get_task", lambda *args: stale_task)
    second = post()
    assert second["statusCode"] == 200
    assert data(second) == data(first)
    assert len(study_records_repository.list_records_by_student(STUDENT.user_id)) == 1


def test_retry_after_response_loss_reuses_committed_record(tables, monkeypatch):
    real_write = study_records_repository.transact_write_items

    def commit_then_lose_response(items):
        real_write(items)
        raise EndpointConnectionError(endpoint_url="https://review.invalid")

    monkeypatch.setattr(study_records_repository, "transact_write_items", commit_then_lose_response)
    assert post()["statusCode"] == 500
    committed = study_tasks_repository.get_task("plan-1", 1)["completion_record"]
    monkeypatch.setattr(study_records_repository, "transact_write_items", real_write)
    retried = post()
    assert retried["statusCode"] == 200
    assert data(retried)["record_id"] == committed["record_id"]
    assert len(study_records_repository.list_records_by_student(STUDENT.user_id)) == 1


def test_failed_record_put_rolls_back_the_task_update(tables, monkeypatch):
    fixed_time = datetime(2026, 10, 23, 4, 0, tzinfo=UTC)

    class FixedDatetime:
        @staticmethod
        def now(tz):
            return fixed_time

    monkeypatch.setattr(study_records_repository, "datetime", FixedDatetime)
    key = {"student_id": STUDENT.user_id, "sort_key": f"{fixed_time.isoformat()}#{TASK_ID}"}
    tables.Table("StudyRecords").put_item(Item={**key, "record_id": "existing-row"})
    assert post()["statusCode"] == 409
    task = study_tasks_repository.get_task("plan-1", 1)
    assert task["status"] == "NOT_STARTED"
    assert "completion_record" not in task
    assert tables.Table("StudyRecords").get_item(Key=key)["Item"]["record_id"] == "existing-row"


def test_another_students_task_cannot_be_completed(tables):
    tables.Table("StudyTasks").update_item(
        Key={"plan_id": "plan-1", "task_order": 1},
        UpdateExpression="SET student_id = :other", ExpressionAttributeValues={":other": "other-student"},
    )
    assert post()["statusCode"] == 403
    assert study_tasks_repository.get_task("plan-1", 1)["status"] == "NOT_STARTED"
    assert study_records_repository.list_records_by_student(STUDENT.user_id) == []


@pytest.mark.parametrize("role", ["TEACHER", "PARENT", "SUPPORT"])
def test_only_the_student_can_submit_a_record(tables, monkeypatch, role):
    caller = AuthenticatedUser("other", "sub", "test", "test@example.invalid", role, "class-1", STUDENT.user_id)
    monkeypatch.setattr(post_study_record, "get_authenticated_user", lambda event: caller)
    assert post()["statusCode"] == 403


def test_missing_task_returns_404(tables):
    assert post({"taskId": "missing#1", "actualMinutes": 5, "understanding": 3})["statusCode"] == 404


@pytest.mark.parametrize("raw", ["[]", "null", '"text"', "{broken"])
def test_invalid_json_shape_returns_400(tables, raw):
    assert post_study_record.handler({"body": raw}, None)["statusCode"] == 400


@pytest.mark.parametrize("field,value", [
    ("taskId", "#1"), ("taskId", "plan#0"), ("taskId", "plan#no"),
    ("actualMinutes", True), ("actualMinutes", 0), ("actualMinutes", -1),
    ("actualMinutes", 1.5), ("actualMinutes", "7"),
    ("understanding", True), ("understanding", 0), ("understanding", 6),
])
def test_invalid_record_values_are_rejected(tables, field, value):
    payload = {"taskId": TASK_ID, "actualMinutes": 7, "understanding": 4, field: value}
    assert post(payload)["statusCode"] == 400
    assert study_records_repository.list_records_by_student(STUDENT.user_id) == []


def test_parent_totals_and_teacher_summary_use_the_saved_record_once(tables):
    saved = data(post())
    post()
    parent = AuthenticatedUser("parent-1", "parent-sub", "保護者", "parent@example.invalid", "PARENT", None, STUDENT.user_id)
    # Sharing authorization now checks real Users rows instead of a name-only stub.
    users = tables.create_table(
        TableName="Users", KeySchema=[{"AttributeName": "user_id", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "user_id", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )
    users.put_item(Item={"user_id": STUDENT.user_id, "cognito_sub": STUDENT.cognito_sub, "role": "STUDENT", "name": STUDENT.name})
    users.put_item(Item={"user_id": parent.user_id, "cognito_sub": parent.cognito_sub, "role": "PARENT", "linked_student_id": STUDENT.user_id})
    with patch.object(parent_dashboard, "get_authenticated_user", return_value=parent):
        response = parent_dashboard.handler({}, None)
    summary = data(response)
    assert summary["weeklyStudyMinutes"] == 7
    assert summary["recordCount"] == 1
    assert summary["studiedDays"] == 1
    teacher = _summarize_student({"user_id": STUDENT.user_id, "name": STUDENT.name})
    assert teacher["lastStudyDate"] == saved["completed_at"]
    assert teacher["lastUnderstanding"] == 4


def test_previously_completed_task_can_still_receive_its_missing_record(tables):
    study_tasks_repository.update_task_status("plan-1", 1, "COMPLETED")
    assert post()["statusCode"] == 200
    assert study_tasks_repository.get_task("plan-1", 1)["completion_record"]["actual_minutes"] == 7
