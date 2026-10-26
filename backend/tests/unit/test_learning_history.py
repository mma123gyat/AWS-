"""Whole-week queries, truthful aggregates, and teacher ownership with mocked AWS."""
import json
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import boto3
import pytest
from moto import mock_aws

from src.handlers.teacher import get_learning_history as history_handler
from src.repositories import dynamodb_client, study_records_repository
from src.services import learning_history_service, teacher_class_service
from src.utils.auth_context import AuthenticatedUser

NOW = datetime(2026, 10, 24, 14, 0, tzinfo=UTC)
START = datetime(2026, 10, 17, 15, 0, tzinfo=UTC)
END = datetime(2026, 10, 24, 15, 0, tzinfo=UTC)
STUDENT = {'user_id': 'student-1', 'role': 'STUDENT', 'class_id': 'class-1', 'name': 'テスト生徒'}
TEACHER = AuthenticatedUser('teacher-1', 'sub-t', '先生', '', 'TEACHER', 'class-1', None)


@pytest.fixture
def app(monkeypatch):
    for key, value in {'AWS_ACCESS_KEY_ID': 'testing', 'AWS_SECRET_ACCESS_KEY': 'testing', 'AWS_SESSION_TOKEN': 'testing', 'AWS_REGION': 'ap-northeast-1', 'AWS_DEFAULT_REGION': 'ap-northeast-1', 'USERS_TABLE_NAME': 'Users', 'STUDY_RECORDS_TABLE_NAME': 'StudyRecords'}.items():
        monkeypatch.setenv(key, value)
    monkeypatch.setattr(teacher_class_service, 'get_authenticated_user', lambda event: TEACHER)
    monkeypatch.setattr(history_handler, 'get_learning_history', lambda student: learning_history_service.get_learning_history(student, NOW))
    with mock_aws():
        dynamodb_client.get_resource.cache_clear()
        dynamodb_client.get_client.cache_clear()
        resource = boto3.resource('dynamodb', region_name='ap-northeast-1')
        users = resource.create_table(TableName='Users', KeySchema=[{'AttributeName': 'user_id', 'KeyType': 'HASH'}], AttributeDefinitions=[{'AttributeName': 'user_id', 'AttributeType': 'S'}], BillingMode='PAY_PER_REQUEST')
        users.put_item(Item=STUDENT)
        users.put_item(Item={'user_id': 'student-2', 'role': 'STUDENT', 'class_id': 'class-2'})
        users.put_item(Item={'user_id': 'teacher-1', 'cognito_sub': 'sub-t', 'role': 'TEACHER', 'class_id': 'class-1'})
        records = resource.create_table(TableName='StudyRecords', KeySchema=[{'AttributeName': 'student_id', 'KeyType': 'HASH'}, {'AttributeName': 'sort_key', 'KeyType': 'RANGE'}], AttributeDefinitions=[{'AttributeName': 'student_id', 'AttributeType': 'S'}, {'AttributeName': 'sort_key', 'AttributeType': 'S'}], BillingMode='PAY_PER_REQUEST')
        yield users, records
        dynamodb_client.get_resource.cache_clear()
        dynamodb_client.get_client.cache_clear()


def record(key, at='2026-10-23T04:00:00+00:00', **fields):
    return {'student_id': 'student-1', 'sort_key': f'{at}#{key}', 'record_id': key, 'completed_at': at, 'subject_id': 'math', 'unit_name': '比例', 'actual_minutes': 7, 'understanding': 3, **fields}


def response(student_id='student-1'):
    result = history_handler.handler({'pathParameters': {'studentId': student_id}}, None)
    assert result['statusCode'] == 200, result
    return json.loads(result['body'])['data']


def test_empty_week_has_seven_jst_days_and_no_fabricated_understanding(app):
    history = response()
    assert (history['startDate'], history['endDate'], history['timeZone']) == ('2026-10-18', '2026-10-24', 'Asia/Tokyo')
    assert len(history['days']) == 7
    assert all(day['minutes'] == 0 and day['recordCount'] == 0 for day in history['days'])
    assert history['subjects'] == []
    assert history['totalMinutes'] == history['recordCount'] == 0


def test_seven_plus_eight_aggregate_to_fifteen_and_latest_score_is_not_averaged(app):
    users, records = app
    records.put_item(Item=record('first', '2026-10-23T04:00:00Z'))
    records.put_item(Item=record('last', '2026-10-23T04:01:00+00:00', actual_minutes=8, understanding=4, unit_name='反比例'))
    before = records.scan()['Items']
    history = response()
    assert history['totalMinutes'] == 15 and history['recordCount'] == 2
    assert history['days'][5] == {'date': '2026-10-23', 'minutes': 15, 'recordCount': 2}
    point = history['subjects'][0]['days'][5]
    assert point['understanding'] == 4 and point['recordCount'] == 2 and point['unitName'] == '反比例'
    assert history['subjects'][0]['days'][4]['understanding'] is None
    assert records.scan()['Items'] == before
    assert users.get_item(Key={'user_id': 'student-1'})['Item'] == STUDENT


def test_jst_midnight_and_period_boundaries_include_only_the_requested_student(app):
    _, records = app
    samples = [
        record('outside', '2026-10-17T14:59:59Z', actual_minutes=99),
        record('start', '2026-10-17T15:00:00Z', actual_minutes=5),
        record('yesterday', '2026-10-23T14:59:59+00:00', actual_minutes=7),
        record('today', '2026-10-23T15:00:00+00:00', actual_minutes=8),
        record('end', '2026-10-24T15:00:00Z', actual_minutes=99),
        record('other-student', '2026-10-23T04:00:00Z', student_id='student-2', actual_minutes=99),
    ]
    for item in samples:
        records.put_item(Item=item)
    history = response()
    assert history['totalMinutes'] == 20 and history['recordCount'] == 3
    assert [day['minutes'] for day in history['days']] == [5, 0, 0, 0, 0, 7, 8]
    assert {row['record_id'] for row in study_records_repository.list_records_in_period('student-1', START, END)} == {'start', 'yesterday', 'today'}


def test_whole_period_paginates_past_latest_twenty_and_fifty(app):
    _, records = app
    with records.batch_writer() as writer:
        for index in range(251):
            at = (START + timedelta(minutes=index)).isoformat()
            writer.put_item(Item=record(str(index), at, actual_minutes=1))
    history = response()
    assert history['recordCount'] == history['totalMinutes'] == 251
    assert history['days'][0]['recordCount'] == 251


def test_query_continues_when_a_page_is_empty_but_has_a_cursor(monkeypatch):
    calls = []
    cursor = {'student_id': 'student-1', 'sort_key': 'cursor'}
    class Table:
        def query(self, **kwargs):
            calls.append(kwargs.copy())
            return {'Items': [], 'LastEvaluatedKey': cursor} if len(calls) == 1 else {'Items': [record('one')]}
    monkeypatch.setattr(study_records_repository, '_table', lambda: Table())
    assert len(study_records_repository.list_records_in_period('student-1', START, END)) == 1
    assert len(calls) == 2 and calls[1]['ExclusiveStartKey'] == cursor
    assert all(call['ConsistentRead'] is True for call in calls)
    assert calls[0]['ExpressionAttributeValues'][':start'] == '2026-10-17T15:00:00'
    assert calls[0]['ExpressionAttributeValues'][':end'] == '2026-10-24T15:00:00'


@pytest.mark.parametrize('role', ['STUDENT', 'PARENT', 'SUPPORT'])
def test_non_teachers_cannot_read_history(app, monkeypatch, role):
    monkeypatch.setattr(teacher_class_service, 'get_authenticated_user', lambda event: AuthenticatedUser('other', 'sub', '', '', role, 'class-1', None))
    assert history_handler.handler({'pathParameters': {'studentId': 'student-1'}}, None)['statusCode'] == 403


@pytest.mark.parametrize('student_id,status', [('student-2', 403), ('teacher-1', 404), ('missing', 404), ('', 400)])
def test_teacher_cannot_access_another_class_or_non_student(app, student_id, status):
    assert history_handler.handler({'pathParameters': {'studentId': student_id}}, None)['statusCode'] == status


def test_missing_authentication_class_and_path_are_rejected(app, monkeypatch):
    assert history_handler.handler({'pathParameters': None}, None)['statusCode'] == 400
    app[0].update_item(Key={'user_id': 'teacher-1'}, UpdateExpression='SET class_id = :none', ExpressionAttributeValues={':none': None})
    assert history_handler.handler({'pathParameters': {'studentId': 'student-1'}}, None)['statusCode'] == 400
    from src.utils.auth_context import get_authenticated_user
    monkeypatch.setattr(teacher_class_service, 'get_authenticated_user', get_authenticated_user)
    assert history_handler.handler({}, None)['statusCode'] == 401


@pytest.mark.parametrize('minutes', [None, 0, -1, True, Decimal('1.5'), 9_007_199_254_740_992])
def test_invalid_minutes_do_not_understate_daily_or_period_totals(app, minutes):
    _, records = app
    records.put_item(Item=record('bad', actual_minutes=minutes))
    records.put_item(Item=record('good', '2026-10-22T04:00:00Z', actual_minutes=5))
    history = response()
    assert history['totalMinutes'] is None
    assert history['days'][5]['minutes'] is None
    assert history['days'][4]['minutes'] == 5
    assert history['recordCount'] == 2


def test_missing_date_blocks_time_totals_without_fabricating_a_day(app):
    _, records = app
    item = record('bad')
    item['completed_at'] = 'bad'
    records.put_item(Item=item)
    records.put_item(Item=record('valid', actual_minutes=5))
    history = response()
    assert history['recordCount'] == 1 and history['unassignedRecordCount'] == 1
    assert history['totalMinutes'] is None
    assert all(day['minutes'] is None for day in history['days'])


def test_last_invalid_understanding_is_a_gap_not_the_earlier_score(app):
    _, records = app
    records.put_item(Item=record('valid', understanding=4))
    records.put_item(Item=record('invalid', '2026-10-23T04:01:00Z', understanding=9))
    history = response()
    point = history['subjects'][0]['days'][5]
    assert point['understanding'] is None and point['recordCount'] == 2
    assert history['totalMinutes'] == 14


def test_subjects_are_separate_and_missing_subject_is_explicit(app):
    _, records = app
    for key, subject in enumerate(['math', 'japanese', 'new-subject', None]):
        records.put_item(Item=record(str(key), subject_id=subject, understanding=key + 1))
    history = response()
    assert [subject['subjectId'] for subject in history['subjects']] == ['japanese', 'math', 'new-subject', None]
    assert history['recordCount'] == 4 and history['totalMinutes'] == 28
    assert {subject['days'][5]['understanding'] for subject in history['subjects']} == {1, 2, 3, 4}


def test_future_records_are_not_included_in_the_acquisition_snapshot(app):
    _, records = app
    records.put_item(Item=record('future', (NOW + timedelta(minutes=1)).isoformat()))
    assert response()['recordCount'] == 0


def test_failed_later_page_is_an_error_not_a_partial_week(app, monkeypatch):
    from botocore.exceptions import ClientError
    calls = []
    class Table:
        def query(self, **kwargs):
            calls.append(kwargs)
            if len(calls) == 1:
                return {'Items': [record('partial')], 'LastEvaluatedKey': {'student_id': 'student-1', 'sort_key': 'cursor'}}
            raise ClientError({'Error': {'Code': 'ProvisionedThroughputExceededException', 'Message': 'retry'}}, 'Query')
    monkeypatch.setattr(study_records_repository, '_table', lambda: Table())
    result = history_handler.handler({'pathParameters': {'studentId': 'student-1'}}, None)
    assert result['statusCode'] == 500
    assert json.loads(result['body'])['success'] is False


def test_overflow_is_not_reported_as_a_precise_minute_total(app):
    _, records = app
    for index in range(2):
        records.put_item(Item=record(str(index), actual_minutes=learning_history_service.MAX_SAFE_INTEGER))
    history = response()
    assert history['days'][5]['minutes'] is None and history['totalMinutes'] is None
