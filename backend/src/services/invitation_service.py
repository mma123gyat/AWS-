"""Teacher-scoped invitation provisioning. No temporary passwords are stored."""
import json
import os
import time
import uuid
from datetime import UTC, datetime
from functools import lru_cache

import boto3
from boto3.dynamodb.conditions import Key
from botocore.config import Config
from botocore.exceptions import ClientError, BotoCoreError

from src.repositories.dynamodb_client import table, table_name, to_attribute_map, transact_write_items
from src.repositories.users_repository import get_user_by_id, list_students_by_class_id, teacher_access_check
from src.repositories.school_classes_repository import get_class_by_id
from src.services.teacher_class_service import get_current_teacher
from src.utils.errors import ConflictError, ForbiddenError, ValidationError
from src.validators.invitation_validator import validate_invitation


def _table():
    return table('INVITATIONS_TABLE_NAME', 'Invitations')


@lru_cache(maxsize=1)
def _cognito():
    return boto3.client('cognito-idp', region_name=os.environ.get('AWS_REGION', 'ap-northeast-1'),
                        config=Config(connect_timeout=2, read_timeout=5, retries={'total_max_attempts': 1}))


def _pool():
    return os.environ['COGNITO_USER_POOL_ID']


def _get_cognito(username):
    try:
        return _cognito().admin_get_user(UserPoolId=_pool(), Username=username)
    except ClientError as exc:
        if exc.response['Error']['Code'] == 'UserNotFoundException':
            return None
        raise


def _attributes(user):
    return {value['Name']: value['Value'] for value in user.get('UserAttributes', [])}


def _read(email):
    return _table().get_item(Key={'email': email}, ConsistentRead=True).get('Item')


def _checks(teacher, item):
    checks = [teacher_access_check(teacher)]
    if item['role'] != 'STUDENT':
        checks.append({'ConditionCheck': {
            'TableName': table_name('USERS_TABLE_NAME', 'Users'),
            'Key': to_attribute_map({'user_id': item['studentId']}),
            'ConditionExpression': '#r = :student AND class_id = :class',
            'ExpressionAttributeNames': {'#r': 'role'},
            'ExpressionAttributeValues': to_attribute_map({':student': 'STUDENT', ':class': teacher['class_id']}),
        }})
    return checks


def _transaction(items):
    try:
        transact_write_items(items)
    except ClientError as exc:
        if exc.response['Error']['Code'] == 'TransactionCanceledException':
            raise ConflictError('登録情報が変更されたか、別の処理が進行中です。再読み込みしてください。') from exc
        raise


def _update(item, owner, **fields):
    # Never let a timed-out worker overwrite a newer attempt.
    names = {f'#f{i}': key for i, key in enumerate(fields)}
    values = {f':v{i}': value for i, value in enumerate(fields.values())}
    values[':owner'] = owner
    _table().update_item(Key={'email': item['email']},
        UpdateExpression='SET ' + ', '.join(f'#f{i} = :v{i}' for i in range(len(fields))),
        ConditionExpression='owner_id = :owner', ExpressionAttributeNames=names, ExpressionAttributeValues=values)


def _public(item):
    return {key: item.get(key) for key in ('email', 'name', 'role', 'studentId', 'status', 'created_at', 'last_sent_at')}


def list_invitations(event):
    teacher = get_current_teacher(event)
    result = _table().query(IndexName='class_id-index', KeyConditionExpression=Key('class_id').eq(teacher['class_id']),
                            ScanIndexForward=False, Limit=50)
    invitations = []
    for candidate in result.get('Items', []):
        current = _read(candidate['email'])
        if not current or current['class_id'] != teacher['class_id']:
            continue
        account = get_user_by_id(current['user_id'])
        if account and (account.get('role') != current['role'] or
            (current['role'] == 'STUDENT' and account.get('class_id') != teacher['class_id']) or
            (current['role'] != 'STUDENT' and account.get('linked_student_id') != current['studentId'])):
            continue
        if current['role'] != 'STUDENT':
            target = get_user_by_id(current['studentId'])
            if not target or target.get('role') != 'STUDENT' or target.get('class_id') != teacher['class_id']:
                continue
        invitations.append(_public(current))
    students = []
    for candidate in list_students_by_class_id(teacher['class_id']):
        current = get_user_by_id(candidate['user_id'])
        if current and current.get('role') == 'STUDENT' and current.get('class_id') == teacher['class_id']:
            students.append({'studentId': current['user_id'], 'name': current.get('name', '')})
    school = get_class_by_id(teacher['class_id'])
    return {'classId': teacher['class_id'], 'className': school.get('class_name') if school else None,
            'students': students, 'invitations': invitations}


def invite(event):
    teacher = get_current_teacher(event)
    try:
        payload = json.loads(event.get('body') or '{}')
    except (ValueError, TypeError):
        raise ValidationError('招待内容を確認してください。')
    if not isinstance(payload, dict):
        raise ValidationError('招待内容を確認してください。')
    operation = payload.pop('operation', 'CREATE')
    if operation not in ('CREATE', 'RESEND'):
        raise ValidationError('操作が不正です。')
    data = validate_invitation(payload)
    if data['classId'] != teacher['class_id']:
        raise ConflictError('担当クラスが変更されています。再読み込みしてください。')
    if not get_class_by_id(teacher['class_id']):
        raise ValidationError('担当クラスを確認できません。管理者にお問い合わせください。')
    if data['role'] != 'STUDENT':
        student = get_user_by_id(data['studentId'])
        if not student or student.get('role') != 'STUDENT' or student.get('class_id') != teacher['class_id']:
            raise ForbiddenError('担当クラスの生徒を選択してください。')
    now = int(time.time())
    owner = str(uuid.uuid4())
    item = _read(data['email'])
    if item:
        if any(item.get(key) != data.get(key) for key in ('email', 'name', 'role', 'studentId')) or item['class_id'] != teacher['class_id']:
            raise ConflictError('このメールアドレスは登録・招待済みです。既存の紐づけは変更できません。')
        if operation == 'CREATE' and item['status'] != 'PROVISIONING':
            return _public(item)  # Retried submission never sends another email.
        if item.get('lease_until', 0) > now:
            raise ConflictError('招待を処理中です。しばらく待ってください。')
        if operation == 'RESEND' and item.get('last_send_started', 0) > now - 60:
            raise ConflictError('再送は1分以上あけてお試しください。')
        previous_owner = item['owner_id']
        _transaction([*_checks(teacher, item), {'Update': {
            'TableName': table_name('INVITATIONS_TABLE_NAME', 'Invitations'),
            'Key': to_attribute_map({'email': item['email']}),
            'UpdateExpression': 'SET owner_id = :owner, lease_until = :lease',
            'ConditionExpression': 'owner_id = :previous AND lease_until <= :now',
            'ExpressionAttributeValues': to_attribute_map({':owner': owner, ':previous': previous_owner, ':lease': now + 60, ':now': now}),
        }}])
        item.update(owner_id=owner, lease_until=now + 60)
    else:
        if operation == 'RESEND':
            raise ConflictError('招待が見つかりません。再読み込みしてください。')
        item = {**data, 'class_id': teacher['class_id'], 'user_id': str(uuid.uuid4()),
                'username': data['email'], 'status': 'PROVISIONING',
                'owner_id': owner, 'lease_until': now + 60, 'created_at': datetime.now(UTC).isoformat()}
        _transaction([*_checks(teacher, item), {'Put': {
            'TableName': table_name('INVITATIONS_TABLE_NAME', 'Invitations'), 'Item': to_attribute_map(item),
            'ConditionExpression': 'attribute_not_exists(email)',
        }}])
    try:
        cognito_user = _get_cognito(item['username'])
        if not cognito_user:
            if _get_cognito(item['email']):
                raise ConflictError('このメールアドレスは登録済みです。既存アカウントは変更しません。')
            _cognito().admin_create_user(UserPoolId=_pool(), Username=item['username'], MessageAction='SUPPRESS',
                ForceAliasCreation=False, UserAttributes=[{'Name': 'email', 'Value': item['email']},
                    {'Name': 'email_verified', 'Value': 'true'}, {'Name': 'name', 'Value': item['name']},
                    {'Name': 'custom:invitation_id', 'Value': item['user_id']}])
            cognito_user = _get_cognito(item['username'])
        attrs = _attributes(cognito_user)
        if (attrs.get('email', '').lower() != item['email'] or not cognito_user.get('Enabled')
            or attrs.get('custom:invitation_id') != item['user_id']):
            raise ConflictError('アカウント情報が変更されています。管理者にお問い合わせください。')
        if cognito_user['UserStatus'] != 'FORCE_CHANGE_PASSWORD':
            raise ConflictError('初回設定済みのアカウントには再送できません。パスワードは変更しません。')
        sub = attrs['sub']
        _cognito().admin_add_user_to_group(UserPoolId=_pool(), Username=item['username'], GroupName=item['role'])
        existing = get_user_by_id(item['user_id'])
        expected = {'user_id': item['user_id'], 'cognito_sub': sub, 'role': item['role']}
        if item['role'] == 'STUDENT':
            expected['class_id'] = item['class_id']
        else:
            expected['linked_student_id'] = item['studentId']
        if existing and any(existing.get(key) != value for key, value in expected.items()):
            raise ConflictError('登録情報が変更されています。既存の紐づけは変更しません。')
        user_check = {'ConditionCheck': {
            'TableName': table_name('USERS_TABLE_NAME', 'Users'), 'Key': to_attribute_map({'user_id': item['user_id']}),
            'ConditionExpression': ' AND '.join(f'#k{i} = :v{i}' for i in range(len(expected))),
            'ExpressionAttributeNames': {f'#k{i}': key for i, key in enumerate(expected)},
            'ExpressionAttributeValues': to_attribute_map({f':v{i}': value for i, value in enumerate(expected.values())}),
        }} if existing else {'Put': {
            'TableName': table_name('USERS_TABLE_NAME', 'Users'),
            'Item': to_attribute_map({**expected, 'name': item['name'], 'email': item['email'],
                'created_at': item['created_at'], 'updated_at': item['created_at']}),
            'ConditionExpression': 'attribute_not_exists(user_id)',
        }}
        now = int(time.time())
        # Recheck authority and binding atomically immediately before email dispatch.
        _transaction([*_checks(teacher, item), user_check, {'Update': {
            'TableName': table_name('INVITATIONS_TABLE_NAME', 'Invitations'),
            'Key': to_attribute_map({'email': item['email']}),
            'UpdateExpression': 'SET #s = :sending, last_send_started = :now',
            'ConditionExpression': 'owner_id = :owner AND lease_until > :now',
            'ExpressionAttributeNames': {'#s': 'status'},
            'ExpressionAttributeValues': to_attribute_map({':sending': 'SENDING', ':now': now, ':owner': owner}),
        }}])
        _cognito().admin_create_user(UserPoolId=_pool(), Username=item['username'], MessageAction='RESEND',
                                    DesiredDeliveryMediums=['EMAIL'])
        sent = datetime.now(UTC).isoformat()
        _update(item, owner, status='SENT', last_sent_at=sent, lease_until=0)
        return _public({**item, 'status': 'SENT', 'last_sent_at': sent})
    except (BotoCoreError, ClientError):
        # A timeout may have happened after delivery. Never automatically resend.
        _update(item, owner, status='DELIVERY_UNKNOWN', lease_until=0)
        raise ConflictError('招待の処理結果を確認できませんでした。再読み込みし、受信を確認してから必要な場合だけ再送してください。')
    except (ConflictError, ForbiddenError):
        _update(item, owner, lease_until=0)
        raise
