import json
import time
from unittest.mock import Mock

import boto3
import pytest
from botocore.exceptions import EndpointConnectionError

from tests.unit.test_seed_users import seed_env, _aws_credentials
from src.services import invitation_service as service
from src.repositories import users_repository, dynamodb_client
from src.handlers.teacher import post_invitation, get_invitations
from src.validators.invitation_validator import validate_invitation
from src.utils.errors import ValidationError


def event(payload=None, role='TEACHER', sub='teacher-sub'):
    return {'requestContext': {'authorizer': {'claims': {'sub': sub, 'cognito:groups': f'[{role}]'}}},
            'body': json.dumps(payload or {})}


def payload(role='STUDENT', **changes):
    return {'name': '招待テスト', 'email': 'new@example.invalid', 'role': role, 'classId': 'class-1',
            'studentId': None if role == 'STUDENT' else 'student-1', **changes}


@pytest.fixture
def app(seed_env, monkeypatch):
    client, _ = seed_env
    pool = client.create_user_pool(PoolName='invitation-pool', UsernameAttributes=['email'],
        Schema=[{'Name': 'invitation_id', 'AttributeDataType': 'String', 'Mutable': False}])['UserPool']['Id']
    for role in ('TEACHER', 'STUDENT', 'PARENT', 'SUPPORT'):
        client.create_group(UserPoolId=pool, GroupName=role)
    monkeypatch.setenv('COGNITO_USER_POOL_ID', pool)
    # Moto 5.2.4 recreates users on RESEND; model AWS's resend contract.
    original_create = client.admin_create_user
    client._invitation_sends = []
    def create_user(**kwargs):
        if kwargs.get('MessageAction') == 'RESEND':
            current = client.admin_get_user(UserPoolId=pool, Username=kwargs['Username'])
            assert current['UserStatus'] == 'FORCE_CHANGE_PASSWORD'
            client._invitation_sends.append(kwargs)
            return {'User': current}
        return original_create(**kwargs)
    monkeypatch.setattr(client, 'admin_create_user', create_user)
    monkeypatch.setattr(service, '_cognito', lambda: client)
    db = boto3.resource('dynamodb', region_name='ap-northeast-1')
    db.create_table(TableName='Invitations', BillingMode='PAY_PER_REQUEST',
        KeySchema=[{'AttributeName': 'email', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'email', 'AttributeType': 'S'},
                              {'AttributeName': 'class_id', 'AttributeType': 'S'},
                              {'AttributeName': 'created_at', 'AttributeType': 'S'}],
        GlobalSecondaryIndexes=[{'IndexName': 'class_id-index',
            'KeySchema': [{'AttributeName': 'class_id', 'KeyType': 'HASH'}, {'AttributeName': 'created_at', 'KeyType': 'RANGE'}],
            'Projection': {'ProjectionType': 'ALL'}}])
    db.create_table(TableName='SchoolClasses', BillingMode='PAY_PER_REQUEST',
        KeySchema=[{'AttributeName': 'class_id', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'class_id', 'AttributeType': 'S'}])
    db.Table('SchoolClasses').put_item(Item={'class_id': 'class-1', 'class_name': '1組'})
    users_repository.create_user('teacher-1', 'teacher-sub', '先生', '', 'TEACHER', class_id='class-1')
    users_repository.create_user('student-1', 'student-sub', '生徒', '', 'STUDENT', class_id='class-1')
    users_repository.create_user('other-student', 'other-sub', '他クラス', '', 'STUDENT', class_id='class-2')
    db.meta.client.update_table(TableName='Users',
        AttributeDefinitions=[{'AttributeName': 'class_id', 'AttributeType': 'S'}, {'AttributeName': 'role', 'AttributeType': 'S'}],
        GlobalSecondaryIndexUpdates=[{'Create': {'IndexName': 'class_id-index',
            'KeySchema': [{'AttributeName': 'class_id', 'KeyType': 'HASH'}, {'AttributeName': 'role', 'KeyType': 'RANGE'}],
            'Projection': {'ProjectionType': 'ALL'}}}])
    return db, client, pool


def post(data):
    return post_invitation.handler(event(data), None)


@pytest.mark.parametrize('role', ['STUDENT', 'PARENT', 'SUPPORT'])
def test_invites_each_role_and_never_stores_password(app, role):
    db, client, pool = app
    result = post(payload(role))
    assert result['statusCode'] == 200, result
    assert json.loads(result['body'])['data']['status'] == 'SENT'
    invitation = db.Table('Invitations').scan()['Items'][0]
    user = users_repository.get_user_by_id(invitation['user_id'])
    assert user['role'] == role
    assert user.get('class_id') == ('class-1' if role == 'STUDENT' else None)
    assert user.get('linked_student_id') == (None if role == 'STUDENT' else 'student-1')
    assert client.admin_get_user(UserPoolId=pool, Username=invitation['username'])['UserStatus'] == 'FORCE_CHANGE_PASSWORD'
    assert not any('password' in str(key).lower() for row in (invitation, user) for key in row)


def test_duplicate_submission_does_not_send_or_duplicate(app, monkeypatch):
    db, client, pool = app
    assert post(payload())['statusCode'] == 200
    method = Mock(side_effect=AssertionError('duplicate email dispatch'))
    monkeypatch.setattr(client, 'admin_create_user', method)
    assert post(payload())['statusCode'] == 200
    assert db.Table('Invitations').scan()['Count'] == 1
    assert len(client.list_users(UserPoolId=pool)['Users']) == 1


@pytest.mark.parametrize('change', [{'role': 'TEACHER'}, {'classId': 'class-2'}, {'role': 'PARENT', 'studentId': 'other-student'}])
def test_forbidden_roles_classes_and_targets_create_no_cognito_users(app, change):
    db, client, pool = app
    assert post(payload(**change))['statusCode'] in (400, 403, 409)
    assert client.list_users(UserPoolId=pool)['Users'] == []


def test_existing_email_account_is_not_rebound_or_reset(app):
    db, client, pool = app
    client.admin_create_user(UserPoolId=pool, Username='new@example.invalid', MessageAction='SUPPRESS')
    before = client.admin_get_user(UserPoolId=pool, Username='new@example.invalid')
    assert post(payload())['statusCode'] == 409
    after = client.admin_get_user(UserPoolId=pool, Username='new@example.invalid')
    assert {k: v for k, v in after.items() if k != 'ResponseMetadata'} == {k: v for k, v in before.items() if k != 'ResponseMetadata'}
    assert db.Table('Users').scan()['Count'] == 3


def test_resend_rate_limit_and_confirmed_user_protection(app, monkeypatch):
    db, client, pool = app
    assert post(payload())['statusCode'] == 200
    assert post({**payload(), 'operation': 'RESEND'})['statusCode'] == 409
    monkeypatch.setattr(service.time, 'time', lambda: time.time_ns() // 1_000_000_000 + 61)
    assert post({**payload(), 'operation': 'RESEND'})['statusCode'] == 200
    invitation = db.Table('Invitations').scan()['Items'][0]
    client.admin_set_user_password(UserPoolId=pool, Username=invitation['username'], Password='Private123!password', Permanent=True)
    monkeypatch.setattr(service.time, 'time', lambda: time.time_ns() // 1_000_000_000 + 122)
    monkeypatch.setattr(client, 'admin_create_user', Mock(side_effect=AssertionError('must not reset confirmed user')))
    assert post({**payload(), 'operation': 'RESEND'})['statusCode'] == 409


def test_delivery_timeout_is_visible_and_retry_does_not_dispatch(app, monkeypatch):
    db, client, pool = app
    original = client.admin_create_user
    def create(**kwargs):
        if kwargs.get('MessageAction') == 'RESEND':
            raise EndpointConnectionError(endpoint_url='https://example.invalid')
        return original(**kwargs)
    monkeypatch.setattr(client, 'admin_create_user', create)
    assert post(payload())['statusCode'] == 409
    assert db.Table('Invitations').scan()['Items'][0]['status'] == 'DELIVERY_UNKNOWN'
    monkeypatch.setattr(client, 'admin_create_user', Mock(side_effect=AssertionError('automatic resend')))
    assert post(payload())['statusCode'] == 200


def test_teacher_revoked_during_provisioning_cannot_bind_or_send(app, monkeypatch):
    db, client, pool = app
    original = client.admin_add_user_to_group
    def revoke(**kwargs):
        original(**kwargs)
        users_repository.update_user_fields('teacher-1', role='PARENT')
    monkeypatch.setattr(client, 'admin_add_user_to_group', revoke)
    assert post(payload())['statusCode'] == 409
    assert db.Table('Users').scan()['Count'] == 3


def test_reassigning_invitation_or_link_is_rejected(app):
    assert post(payload('PARENT'))['statusCode'] == 200
    assert post(payload('PARENT', studentId='other-student'))['statusCode'] == 403
    assert post(payload('SUPPORT'))['statusCode'] == 409


@pytest.mark.parametrize('body', [None, [], {}, {'role': 'TEACHER'}, payload(email='bad'), payload(studentId='student-1')])
def test_bad_input(body):
    with pytest.raises(ValidationError):
        validate_invitation(body)


def test_list_is_scoped_and_has_no_password_or_cognito_ids(app):
    assert post(payload())['statusCode'] == 200
    result = get_invitations.handler(event(), None)
    assert result['statusCode'] == 200
    data = json.loads(result['body'])['data']
    assert data['classId'] == 'class-1'
    assert all(student['studentId'] != 'other-student' for student in data['students'])
    assert 'username' not in data['invitations'][0] and 'owner_id' not in data['invitations'][0]


@pytest.mark.parametrize('role', ['STUDENT', 'PARENT', 'SUPPORT'])
def test_non_teachers_cannot_invite_or_read_invitations(app, role):
    db, client, pool = app
    users_repository.update_user_fields('teacher-1', role=role)
    assert post_invitation.handler(event(payload(), role=role), None)['statusCode'] == 403
    assert get_invitations.handler(event(role=role), None)['statusCode'] == 403
    assert client.list_users(UserPoolId=pool)['Users'] == []


def test_other_class_teacher_cannot_read_or_resend(app):
    assert post(payload())['statusCode'] == 200
    users_repository.update_user_fields('teacher-1', class_id='class-2')
    result = get_invitations.handler(event(), None)
    assert json.loads(result['body'])['data']['invitations'] == []
    assert post({**payload(), 'operation': 'RESEND'})['statusCode'] == 409


@pytest.mark.parametrize('role', ['STUDENT', 'PARENT', 'SUPPORT'])
def test_transferred_student_invitation_is_hidden_and_cannot_be_resent(app, monkeypatch, role):
    db, client, pool = app
    assert post(payload(role))['statusCode'] == 200
    invitation = db.Table('Invitations').scan()['Items'][0]
    student_id = invitation['user_id'] if role == 'STUDENT' else 'student-1'
    users_repository.update_user_fields(student_id, class_id='class-2')
    assert json.loads(get_invitations.handler(event(), None)['body'])['data']['invitations'] == []
    monkeypatch.setattr(service.time, 'time', lambda: time.time_ns() // 1_000_000_000 + 61)
    assert post({**payload(role), 'operation': 'RESEND'})['statusCode'] in (403, 409)
    assert len(client._invitation_sends) == 1
