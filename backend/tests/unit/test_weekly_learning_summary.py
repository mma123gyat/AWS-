"""All three real handlers read the complete JST week under mocked AWS."""
import copy
import json
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import boto3
import pytest
from botocore.exceptions import ClientError

from tests.unit.test_parent_support_handlers import tables, _aws_credentials, _event, STUDENT_ID
from src.handlers.parents import get_dashboard
from src.handlers.support import get_report
from src.handlers.teacher import get_learning_history
from src.models.sharing_settings import DEFAULT_SETTINGS
from src.repositories import study_records_repository, users_repository
from src.services import weekly_learning_service

NOW = datetime(2026, 10, 24, 14, 0, tzinfo=UTC)
START = datetime(2026, 10, 17, 15, 0, tzinfo=UTC)
END = datetime(2026, 10, 24, 15, 0, tzinfo=UTC)
HANDLERS = {"PARENT": get_dashboard, "SUPPORT": get_report, "TEACHER": get_learning_history}


@pytest.fixture
def app(tables, monkeypatch):
    class Clock(datetime):
        @classmethod
        def now(cls, tz=None):
            return NOW.astimezone(tz) if tz else NOW.replace(tzinfo=None)
    monkeypatch.setattr(weekly_learning_service, "datetime", Clock)
    users_repository.update_user_fields(STUDENT_ID, class_id="class-1")
    for role in HANDLERS:
        users_repository.create_user(
            role.lower(), role.lower() + "-sub", role, "", role,
            class_id="class-1", linked_student_id=STUDENT_ID,
        )
    return boto3.resource("dynamodb", region_name="ap-northeast-1")


def response(role):
    event = _event(role.lower() + "-sub", f"[{role}]")
    event["pathParameters"] = {"studentId": STUDENT_ID}
    return HANDLERS[role].handler(event, None)


def data(role):
    result = response(role)
    assert result["statusCode"] == 200, result
    return json.loads(result["body"])["data"]


def record(key, at=NOW - timedelta(hours=1), **fields):
    timestamp = at.isoformat()
    return {
        "student_id": STUDENT_ID, "sort_key": f"{timestamp}#{key}",
        "record_id": str(key), "completed_at": timestamp, "subject_id": "math",
        "unit_name": "比例", "actual_minutes": 2, "understanding": 3, **fields,
    }


def assert_totals(minutes, count):
    parent, support, teacher = [data(role) for role in HANDLERS]
    assert parent["weeklyStudyMinutes"] == support["recentStudyMinutes"] == teacher["totalMinutes"] == minutes
    assert parent["recordCount"] == support["recentRecordCount"] == teacher["recordCount"] == count
    return parent, support, teacher


def test_no_records_is_a_real_zero_not_sharing_stopped(app):
    parent, support, _ = assert_totals(0, 0)
    assert parent["studiedDays"] == 0
    assert all(not badge["earned"] for badge in parent["badges"])
    assert support["subjectProgresses"] == []


@pytest.mark.parametrize("count", [51, 251])
def test_all_roles_include_more_than_fifty_records_and_every_page(app, monkeypatch, count):
    with app.Table("StudyRecords").batch_writer() as writer:
        for index in range(count):
            writer.put_item(Item=record(index, START + timedelta(minutes=index)))
    table = app.Table("StudyRecords")
    query = table.query
    calls = []
    def tracked(**kwargs):
        calls.append(kwargs.copy())
        return query(**kwargs)
    monkeypatch.setattr(table, "query", tracked)
    monkeypatch.setattr(study_records_repository, "_table", lambda: table)
    parent, _, _ = assert_totals(count * 2, count)
    assert parent["studiedDays"] == 1
    assert all(call["ConsistentRead"] and "BETWEEN" in call["KeyConditionExpression"] for call in calls)
    assert len(calls) == (6 if count > 200 else 3)
    assert sum("ExclusiveStartKey" in call for call in calls) == (3 if count > 200 else 0)


def test_jst_boundaries_future_timestamps_and_other_students_match_teacher(app):
    samples = [
        record("before", START - timedelta(seconds=1), actual_minutes=99),
        record("start", START, completed_at="2026-10-17T15:00:00Z", actual_minutes=5),
        record("yesterday", NOW - timedelta(hours=24), completed_at="2026-10-23T23:00:00+09:00", actual_minutes=7),
        record("today", END - timedelta(days=1), completed_at="2026-10-23T15:00:00", actual_minutes=8),
        record("now", NOW, actual_minutes=1),
        record("future", NOW + timedelta(seconds=1), actual_minutes=99),
        record("end", END, actual_minutes=99),
        record("other", student_id="another-student", actual_minutes=99),
        record("wrong-completed-at", completed_at=(START - timedelta(days=1)).isoformat(), actual_minutes=99),
    ]
    for item in samples:
        app.Table("StudyRecords").put_item(Item=item)
    parent, _, teacher = assert_totals(21, 4)
    assert parent["studiedDays"] == 3
    assert (teacher["startDate"], teacher["endDate"]) == ("2026-10-18", "2026-10-24")


def test_badges_use_all_days_and_all_scores_not_only_latest_fifty_or_last_score(app):
    with app.Table("StudyRecords").batch_writer() as writer:
        for day in range(5):
            writer.put_item(Item=record(f"old-{day}", START + timedelta(days=day), actual_minutes=1, understanding=4 if day == 0 else 3))
        # The final score on the oldest day is 3, but its earlier 4 still earns the badge.
        writer.put_item(Item=record("old-last", START + timedelta(minutes=1), actual_minutes=1))
        for index in range(54):
            writer.put_item(Item=record(index, NOW - timedelta(minutes=index), actual_minutes=1))
    parent, _, teacher = assert_totals(60, 60)
    assert parent["studiedDays"] == 6
    assert all(badge["earned"] for badge in parent["badges"])
    assert teacher["subjects"][0]["days"][0]["understanding"] == 3


def test_support_does_not_mark_a_subject_missing_because_its_record_is_older_than_fifty(app):
    for subject in ["math", "english"]:
        app.Table("StudentProgresses").put_item(Item={"student_id": STUDENT_ID, "subject_id": subject, "understanding": 4})
    with app.Table("StudyRecords").batch_writer() as writer:
        writer.put_item(Item=record("old-math", START))
        for index in range(55):
            writer.put_item(Item=record(index, NOW - timedelta(minutes=index), subject_id="japanese"))
    report = data("SUPPORT")
    assert report["recentRecordCount"] == 56
    assert report["supportNeededSubjects"] == [{"subjectId": "english", "subjectName": "english", "reasons": ["最近学習記録が少ない教科"]}]


@pytest.mark.parametrize("role", ["PARENT", "SUPPORT"])
@pytest.mark.parametrize("minutes", [None, 0, -1, True, Decimal("1.5"), "7", 9_007_199_254_740_992])
def test_invalid_minutes_are_an_error_not_zero_or_sharing_stopped(app, role, minutes):
    app.Table("StudyRecords").put_item(Item=record("bad", actual_minutes=minutes))
    result = response(role)
    assert result["statusCode"] == 500
    body = json.loads(result["body"])
    assert not body["success"] and "data" not in body
    assert "学習のまとめを取得できませんでした" in body["error"]["message"]


@pytest.mark.parametrize("role", ["PARENT", "SUPPORT"])
@pytest.mark.parametrize("timestamp", [None, "bad", [], {}])
def test_unassignable_dates_do_not_silently_omit_time(app, role, timestamp):
    app.Table("StudyRecords").put_item(Item=record("bad", completed_at=timestamp))
    assert response(role)["statusCode"] == 500
    teacher = data("TEACHER")
    assert teacher["totalMinutes"] is None and teacher["unassignedRecordCount"] == 1


@pytest.mark.parametrize("role", ["PARENT", "SUPPORT"])
def test_unsafe_sum_is_an_error(app, role):
    for index in range(2):
        app.Table("StudyRecords").put_item(Item=record(index, actual_minutes=weekly_learning_service.MAX_SAFE_INTEGER))
    assert response(role)["statusCode"] == 500


@pytest.mark.parametrize("role", ["PARENT", "SUPPORT"])
def test_failed_second_page_does_not_return_a_partial_summary(app, monkeypatch, role):
    calls = []
    class Table:
        def query(self, **kwargs):
            calls.append(kwargs)
            if len(calls) == 1:
                return {"Items": [record("partial")], "LastEvaluatedKey": {"student_id": STUDENT_ID, "sort_key": "cursor"}}
            raise ClientError({"Error": {"Code": "ProvisionedThroughputExceededException", "Message": "retry"}}, "Query")
    monkeypatch.setattr(study_records_repository, "_table", lambda: Table())
    result = response(role)
    assert len(calls) == 2 and result["statusCode"] == 500
    assert "data" not in json.loads(result["body"])


@pytest.mark.parametrize("role", ["PARENT", "SUPPORT"])
def test_private_summary_skips_period_query_even_if_private_records_are_invalid(app, monkeypatch, role):
    settings = copy.deepcopy(DEFAULT_SETTINGS)
    settings[role.lower()]["studySummary"] = False
    users_repository.update_user_fields(STUDENT_ID, sharing_settings=settings)
    app.Table("StudyRecords").put_item(Item=record("private", actual_minutes=None))
    def forbidden(*args, **kwargs):
        pytest.fail("Private records must not be queried")
    monkeypatch.setattr(study_records_repository, "_table", forbidden)
    result = data(role)
    if role == "PARENT":
        assert all(result[key] is None for key in ["weeklyStudyMinutes", "recordCount", "studiedDays", "badges"])
        assert result["messages"] == []
    else:
        assert result["recentStudyMinutes"] is result["recentRecordCount"] is None
        assert result["subjectProgresses"] == [] and result["canSendMessage"]
