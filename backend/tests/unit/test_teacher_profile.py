"""Current teacher assignment and atomic class writes, entirely inside Moto."""
import json

import boto3
import pytest
from botocore.exceptions import ClientError

from tests.unit.test_parent_support_handlers import tables, _aws_credentials, _event
from tests.unit.test_progress_input_validation import positions
from src.handlers.teacher import get_me, get_class_progress, put_class_progress
from src.repositories import curriculums_repository, school_classes_repository, users_repository
from src.services import teacher_class_service

PAYLOAD = {'subjectId': 'math', 'unitName': '比例', 'textbookPage': 'p.42', 'status': 'IN_PROGRESS'}


@pytest.fixture
def teachers(tables):
    positions.__wrapped__(None)
    boto3.client('dynamodb', region_name='ap-northeast-1').create_table(TableName='SchoolClasses', KeySchema=[{'AttributeName': 'class_id', 'KeyType': 'HASH'}], AttributeDefinitions=[{'AttributeName': 'class_id', 'AttributeType': 'S'}], BillingMode='PAY_PER_REQUEST')
    school_classes_repository.put_class('class-1', '中学2年', '2年1組', '2026')
    school_classes_repository.put_class('class-2', '中学2年', '2年2組', '2026')
    users_repository.create_user('teacher-2', 'teacher-2-sub', '2組の先生', '', 'TEACHER', class_id='class-2')


def event(sub='teacher-input-sub', class_id='class-1', role='TEACHER'):
    return {**_event(sub, f'[{role}]'), 'pathParameters': {'classId': class_id}, 'body': json.dumps(PAYLOAD)}


def data(response):
    assert response['statusCode'] == 200, response
    return json.loads(response['body'])['data']


@pytest.mark.parametrize('sub,class_id,name', [('teacher-input-sub', 'class-1', '2年1組'), ('teacher-2-sub', 'class-2', '2年2組')])
def test_each_teacher_resolves_and_writes_only_their_own_class(teachers, sub, class_id, name):
    assert data(get_me.handler(event(sub), None)) == {'classId': class_id, 'className': name}
    other_id = 'class-1' if class_id == 'class-2' else 'class-2'
    before = curriculums_repository.get_curriculum(other_id, 'math')
    saved = data(put_class_progress.handler(event(sub, class_id), None))
    assert saved['class_id'] == class_id
    assert data(get_class_progress.handler(event(sub, class_id), None))[0]['unit_name'] == '比例'
    assert curriculums_repository.get_curriculum(other_id, 'math') == before
    assert put_class_progress.handler(event(sub, other_id), None)['statusCode'] == 403
    assert get_class_progress.handler(event(sub, other_id), None)['statusCode'] == 403


def test_request_parameters_do_not_choose_profile_class(teachers):
    request = {**event(class_id='class-2'), 'queryStringParameters': {'classId': 'class-2', 'teacherId': 'teacher-2'}}
    assert data(get_me.handler(request, None)) == {'classId': 'class-1', 'className': '2年1組'}


@pytest.mark.parametrize('role', ['STUDENT', 'PARENT', 'SUPPORT'])
@pytest.mark.parametrize('module', [get_me, get_class_progress, put_class_progress])
def test_other_roles_cannot_access_teacher_class_endpoints(teachers, role, module):
    users_repository.create_user('other', 'other-sub', '', '', role, class_id='class-1')
    assert module.handler(event('other-sub', role=role), None)['statusCode'] == 403


@pytest.mark.parametrize('module', [get_me, get_class_progress, put_class_progress])
def test_missing_authentication_is_rejected(teachers, module):
    assert module.handler({'pathParameters': {'classId': 'class-1'}, 'body': json.dumps(PAYLOAD)}, None)['statusCode'] == 401


@pytest.mark.parametrize('class_id', [None, '', '   ', ' class-1 ', 42, [], {}])
def test_missing_or_invalid_assignment_has_no_default(teachers, class_id):
    users_repository.update_user_fields('teacher-input-test', class_id=class_id)
    assert get_me.handler(event(), None)['statusCode'] == 400
    assert put_class_progress.handler(event(), None)['statusCode'] == 400


def test_missing_class_label_does_not_replace_the_authorized_class_id(teachers):
    users_repository.update_user_fields('teacher-input-test', class_id='class-without-label')
    assert data(get_me.handler(event(), None)) == {'classId': 'class-without-label', 'className': None}


def test_current_base_table_assignment_overrides_stale_auth_gsi(teachers, monkeypatch):
    stale = teacher_class_service.get_authenticated_user(event())
    monkeypatch.setattr(teacher_class_service, 'get_authenticated_user', lambda _: stale)
    users_repository.update_user_fields('teacher-input-test', class_id='class-2')
    assert data(get_me.handler(event(), None)) == {'classId': 'class-2', 'className': '2年2組'}
    assert put_class_progress.handler(event(), None)['statusCode'] == 403
    assert data(put_class_progress.handler(event(class_id='class-2'), None))['class_id'] == 'class-2'


@pytest.mark.parametrize('change', ['role', 'sub', 'delete'])
def test_stale_token_or_gsi_cannot_restore_removed_authority(teachers, monkeypatch, change):
    stale = teacher_class_service.get_authenticated_user(event())
    monkeypatch.setattr(teacher_class_service, 'get_authenticated_user', lambda _: stale)
    if change == 'delete':
        boto3.resource('dynamodb', region_name='ap-northeast-1').Table('Users').delete_item(Key={'user_id': 'teacher-input-test'})
    else:
        users_repository.update_user_fields('teacher-input-test', **({'role': 'STUDENT'} if change == 'role' else {'cognito_sub': 'replaced-sub'}))
    assert get_me.handler(event(), None)['statusCode'] == 403
    assert put_class_progress.handler(event(), None)['statusCode'] == 403


@pytest.mark.parametrize('change', ['class', 'role', 'sub', 'delete'])
def test_assignment_or_authority_change_during_write_prevents_atomic_save(teachers, monkeypatch, change):
    before = curriculums_repository.get_curriculum('class-1', 'math')
    original = put_class_progress.put_curriculum
    def moved(*args, **kwargs):
        if change == 'delete':
            boto3.resource('dynamodb', region_name='ap-northeast-1').Table('Users').delete_item(Key={'user_id': 'teacher-input-test'})
        else:
            field, value = {'class': ('class_id', 'class-2'), 'role': ('role', 'STUDENT'), 'sub': ('cognito_sub', 'replaced-sub')}[change]
            users_repository.update_user_fields('teacher-input-test', **{field: value})
        return original(*args, **kwargs)
    monkeypatch.setattr(put_class_progress, 'put_curriculum', moved)
    assert put_class_progress.handler(event(), None)['statusCode'] == 409
    assert curriculums_repository.get_curriculum('class-1', 'math') == before
    assert curriculums_repository.get_curriculum('class-2', 'math') is None


def test_unexpected_storage_failure_is_not_reported_as_assignment_conflict(teachers, monkeypatch):
    def denied(*args, **kwargs):
        raise ClientError({'Error': {'Code': 'AccessDeniedException', 'Message': 'test'}}, 'TransactWriteItems')
    monkeypatch.setattr(put_class_progress, 'put_curriculum', denied)
    assert put_class_progress.handler(event(), None)['statusCode'] == 500
