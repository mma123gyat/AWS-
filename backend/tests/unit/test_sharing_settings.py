"""Real DynamoDB transactions under Moto; never contacts the deployed environment."""
import copy
import json

import boto3
import pytest

from tests.unit.test_parent_support_handlers import tables, _aws_credentials, _event, STUDENT_ID
from src.handlers.students import get_sharing as student_get, put_sharing as student_put
from src.handlers.parents import get_sharing as parent_get, put_sharing as parent_put, get_dashboard
from src.handlers.support import get_sharing as support_get, get_report, post_message
from src.models.sharing_settings import DEFAULT_SETTINGS
from src.repositories import messages_repository, users_repository
from src.services import sharing_settings_service

GETS = [(student_get, 'STUDENT'), (parent_get, 'PARENT'), (support_get, 'SUPPORT')]
PUTS = [(student_put, 'STUDENT'), (parent_put, 'PARENT')]


@pytest.fixture
def setup(tables):
    for role in ('PARENT', 'SUPPORT', 'TEACHER'):
        users_repository.create_user(role.lower(), role.lower() + '-sub', role, '', role, linked_student_id=STUDENT_ID)
    users_repository.create_user('other-student', 'other-sub', 'Other', '', 'STUDENT')
    return boto3.resource('dynamodb', region_name='ap-northeast-1').Table('Users')


def event(role, body=None):
    sub = 'target-sub' if role == 'STUDENT' else role.lower() + '-sub'
    return {**_event(sub, f'[{role}]'), 'body': json.dumps(body)}


def body(settings=None, version=0, target=STUDENT_ID):
    return {'studentId': target, 'settings': copy.deepcopy(DEFAULT_SETTINGS if settings is None else settings), 'version': version}


def data(response):
    assert response['statusCode'] == 200, response
    return json.loads(response['body'])['data']


def save(settings, version=0):
    return data(student_put.handler(event('STUDENT', body(settings, version)), None))


def test_legacy_read_is_non_mutating_and_support_gets_only_its_own_flags(setup):
    before = setup.get_item(Key={'user_id': STUDENT_ID})['Item']
    student = data(student_get.handler(event('STUDENT'), None))
    parent = data(parent_get.handler(event('PARENT'), None))
    assert student == parent
    assert student['settings'] == DEFAULT_SETTINGS and student['version'] == 0 and student['isLegacyDefault']
    support = data(support_get.handler(event('SUPPORT'), None))
    assert set(support['settings']) == {'support'}
    assert setup.get_item(Key={'user_id': STUDENT_ID})['Item'] == before


@pytest.mark.parametrize('handler,role', PUTS)
def test_both_editors_persist_same_student_without_touching_other_user_fields(setup, handler, role):
    before = setup.get_item(Key={'user_id': STUDENT_ID})['Item']
    settings = copy.deepcopy(DEFAULT_SETTINGS)
    settings['support']['studySummary'] = False
    result = data(handler.handler(event(role, body(settings)), None))
    assert result['settings'] == settings and result['version'] == 1
    assert result['updatedByRole'] == role and result['updatedAt'] and not result['isLegacyDefault']
    assert data(parent_get.handler(event('PARENT'), None)) == result
    saved = setup.get_item(Key={'user_id': STUDENT_ID})['Item']
    for key, value in before.items():
        assert saved[key] == value
    assert 'sharing_settings' not in setup.get_item(Key={'user_id': 'other-student'})['Item']


@pytest.mark.parametrize('module,role', [(module, role) for module, allowed in GETS + PUTS for role in ['STUDENT', 'PARENT', 'SUPPORT', 'TEACHER'] if role != allowed])
def test_role_specific_routes_do_not_accept_other_roles(setup, module, role):
    assert module.handler(event(role, body()), None)['statusCode'] == 403


@pytest.mark.parametrize('module,role', GETS + PUTS)
def test_missing_authentication_is_rejected(setup, module, role):
    assert module.handler({'body': json.dumps(body())}, None)['statusCode'] == 401


def test_stale_editor_cannot_overwrite_newer_settings(setup):
    settings = copy.deepcopy(DEFAULT_SETTINGS)
    settings['parent']['messages'] = False
    saved = save(settings)
    assert parent_put.handler(event('PARENT', body()), None)['statusCode'] == 409
    assert data(parent_get.handler(event('PARENT'), None)) == saved
    changed = data(parent_put.handler(event('PARENT', body(DEFAULT_SETTINGS, 1)), None))
    assert changed['version'] == 2


@pytest.mark.parametrize('payload', [None, [], {}, {'version': 0}, body(version=True), body(version=-1), body(version=0.0), {**body(), 'extra': 1}, body(target='other-student'), body(settings={}), body(settings={'parent': {'messages': True}, 'support': {}})])
def test_bad_or_wrong_target_input_does_not_write(setup, payload):
    result = student_put.handler(event('STUDENT', payload), None)
    assert result['statusCode'] in (400, 409)
    assert 'sharing_settings' not in setup.get_item(Key={'user_id': STUDENT_ID})['Item']


@pytest.mark.parametrize('value', [1, 0, None, 'true', [], {}])
def test_flags_require_actual_booleans(setup, value):
    settings = copy.deepcopy(DEFAULT_SETTINGS)
    settings['parent']['messages'] = value
    assert student_put.handler(event('STUDENT', body(settings)), None)['statusCode'] == 400


def test_malformed_saved_settings_fail_closed_instead_of_restoring_legacy_defaults(setup):
    users_repository.update_user_fields(STUDENT_ID, sharing_settings={'support': {'messages': 'true'}})
    result = data(parent_get.handler(event('PARENT'), None))
    assert all(not flag for values in result['settings'].values() for flag in values.values())
    assert not result['canSendMessage'] and not result['isLegacyDefault']


@pytest.mark.parametrize('target', ['missing', 'parent'])
def test_missing_or_non_student_link_cannot_expose_data(setup, target):
    users_repository.update_user_fields('parent', linked_student_id=target)
    assert parent_get.handler(event('PARENT'), None)['statusCode'] == 403
    assert get_dashboard.handler(event('PARENT'), None)['statusCode'] == 403


def test_stale_authentication_gsi_role_and_link_are_not_authority(setup, monkeypatch):
    original = sharing_settings_service.get_authenticated_user
    stale = original(event('PARENT'))
    monkeypatch.setattr(sharing_settings_service, 'get_authenticated_user', lambda _: stale)
    users_repository.update_user_fields('parent', linked_student_id='other-student')
    assert parent_put.handler(event('PARENT', body()), None)['statusCode'] == 409
    users_repository.update_user_fields('parent', role='SUPPORT')
    assert parent_get.handler(event('PARENT'), None)['statusCode'] == 403


def test_link_changed_during_save_cannot_update_old_child(setup, monkeypatch):
    original = sharing_settings_service.put_settings
    def moved(*args):
        users_repository.update_user_fields('parent', linked_student_id='other-student')
        return original(*args)
    monkeypatch.setattr(sharing_settings_service, 'put_settings', moved)
    assert parent_put.handler(event('PARENT', body()), None)['statusCode'] == 409
    assert 'sharing_settings' not in setup.get_item(Key={'user_id': STUDENT_ID})['Item']


def test_deleted_student_cannot_be_recreated_by_save(setup, monkeypatch):
    original = sharing_settings_service.put_settings
    def removed(*args):
        setup.delete_item(Key={'user_id': STUDENT_ID})
        return original(*args)
    monkeypatch.setattr(sharing_settings_service, 'put_settings', removed)
    assert student_put.handler(event('STUDENT', body()), None)['statusCode'] == 409
    assert 'Item' not in setup.get_item(Key={'user_id': STUDENT_ID})


def test_all_off_skips_sensitive_queries_and_does_not_report_fake_zeros(setup, monkeypatch):
    settings = {role: dict.fromkeys(flags, False) for role, flags in DEFAULT_SETTINGS.items()}
    save(settings)
    def forbidden(*args, **kwargs):
        raise AssertionError('Shared data must not even be queried')
    for module, names in [(get_dashboard, ['load_learning_week', 'list_messages_by_student']), (get_report, ['load_learning_week', 'list_progresses_by_student', 'get_subject_by_id'])]:
        for name in names:
            monkeypatch.setattr(module, name, forbidden)
    parent = data(get_dashboard.handler(event('PARENT'), None))
    for key in ['weeklyStudyMinutes', 'studiedDays', 'recordCount', 'badges', 'messages']:
        assert parent[key] is None
    support = data(get_report.handler(event('SUPPORT'), None))
    for key in ['recentStudyMinutes', 'recentRecordCount', 'subjectProgresses', 'supportNeededSubjects']:
        assert support[key] is None
    assert not support['canSendMessage']
    assert post_message.handler(event('SUPPORT', {'studentId': STUDENT_ID, 'body': 'blocked'}), None)['statusCode'] == 403
    assert messages_repository.list_messages_by_student(STUDENT_ID) == []


def test_activity_reason_does_not_leak_when_only_progress_is_shared(setup, monkeypatch):
    settings = copy.deepcopy(DEFAULT_SETTINGS)
    settings['support']['studySummary'] = False
    save(settings)
    monkeypatch.setattr(get_report, 'load_learning_week', lambda *a, **kw: pytest.fail('records are private'))
    monkeypatch.setattr(get_report, 'list_progresses_by_student', lambda _: [{'subject_id': 'math', 'understanding': 2}])
    monkeypatch.setattr(get_report, 'get_subject_by_id', lambda _: {'name': '数学'})
    report = data(get_report.handler(event('SUPPORT'), None))
    assert report['supportNeededSubjects'][0]['reasons'] == ['理解度が低い教科']
    assert report['recentStudyMinutes'] is None


@pytest.mark.parametrize('side', ['parent', 'support'])
def test_either_message_flag_blocks_send_and_old_messages_are_retained(setup, side):
    assert post_message.handler(event('SUPPORT', {'studentId': STUDENT_ID, 'body': 'retained'}), None)['statusCode'] == 200
    settings = copy.deepcopy(DEFAULT_SETTINGS)
    settings[side]['messages'] = False
    save(settings)
    assert post_message.handler(event('SUPPORT', {'studentId': STUDENT_ID, 'body': 'blocked'}), None)['statusCode'] == 403
    assert len(messages_repository.list_messages_by_student(STUDENT_ID)) == 1
    save(DEFAULT_SETTINGS, 1)
    assert data(get_dashboard.handler(event('PARENT'), None))['messages'][0]['body'] == 'retained'


@pytest.mark.parametrize('change', ['sharing', 'link', 'role', 'student_role'])
def test_permission_change_between_read_and_send_prevents_atomic_message_write(setup, monkeypatch, change):
    original = post_message.put_shared_message
    def changed(student, actor, text):
        if change == 'sharing':
            settings = copy.deepcopy(DEFAULT_SETTINGS)
            settings['parent']['messages'] = False
            save(settings)
        elif change == 'student_role':
            users_repository.update_user_fields(STUDENT_ID, role='TEACHER')
        else:
            users_repository.update_user_fields('support', **({'linked_student_id': 'other-student'} if change == 'link' else {'role': 'PARENT'}))
        return original(student, actor, text)
    monkeypatch.setattr(post_message, 'put_shared_message', changed)
    assert post_message.handler(event('SUPPORT', {'studentId': STUDENT_ID, 'body': 'blocked'}), None)['statusCode'] == 403
    assert messages_repository.list_messages_by_student(STUDENT_ID) == []


@pytest.mark.parametrize('payload', [[], None, {'studentId': STUDENT_ID, 'body': 1}, {'studentId': STUDENT_ID, 'body': ' '}, {'studentId': STUDENT_ID, 'body': 'a' * 1001}])
def test_invalid_messages_never_write(setup, payload):
    assert post_message.handler(event('SUPPORT', payload), None)['statusCode'] == 400
    assert messages_repository.list_messages_by_student(STUDENT_ID) == []
