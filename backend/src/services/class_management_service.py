"""Single-school administrator operations, with transactional audit records."""
import json
import uuid
from datetime import UTC, datetime
from decimal import Decimal

from botocore.exceptions import ClientError
from src.repositories.dynamodb_client import table, table_name, to_attribute_map, transact_write_items
from src.repositories.users_repository import get_user_by_id
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.errors import ValidationError, ConflictError


def _table(kind):
    names = {'Users': 'USERS_TABLE_NAME', 'SchoolClasses': 'SCHOOL_CLASSES_TABLE_NAME', 'ClassAudit': 'CLASS_AUDIT_TABLE_NAME'}
    return table(names[kind], kind)


def _name(kind):
    return _table(kind).name


def _all(kind):
    result, kwargs = [], {'ConsistentRead': True}
    while True:
        response = _table(kind).scan(**kwargs)
        result.extend(response.get('Items', []))
        if not response.get('LastEvaluatedKey'):
            return result
        kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']


def _version(row, field):
    value = row.get(field, 0)
    if isinstance(value, bool) or not isinstance(value, (int, Decimal)) or value != int(value) or not 0 <= value < 9007199254740991:
        raise ConflictError('保存情報を確認できません。管理者にお問い合わせください。')
    return int(value)


def _actor(event):
    user = get_authenticated_user(event)
    require_role(user, 'ADMIN')
    return user


def _payload(event, keys):
    try:
        data = json.loads(event.get('body') or '{}')
    except (ValueError, TypeError):
        raise ValidationError('入力内容を確認してください。')
    if not isinstance(data, dict) or set(data) != set(keys):
        raise ValidationError('入力項目を確認してください。')
    return data


def _text(value, limit):
    if not isinstance(value, str) or not value.strip() or len(value.strip()) > limit or any(ord(c) < 32 for c in value):
        raise ValidationError(f'空欄を避け、{limit}文字以内で入力してください。')
    return value.strip()


def _expected(value):
    if type(value) is not int or not 0 <= value < 9007199254740991:
        raise ValidationError('バージョンが不正です。')
    return value


def _cas(row, field, version):
    return (f'{field} = :old' if field in row else f'attribute_not_exists({field})'), ({':old': version} if field in row else {})


def _commit(actor, operation, target, before, after, mutation, extra=None):
    timestamp = datetime.now(UTC).isoformat()
    record = {'audit_id': str(uuid.uuid4()), 'created_at': timestamp, 'actor_id': actor.user_id,
              'actor_name': actor.name, 'operation': operation, 'target_id': target, 'before': before, 'after': after}
    check = {'ConditionCheck': {'TableName': _name('Users'), 'Key': to_attribute_map({'user_id': actor.user_id}),
        'ConditionExpression': '#r = :admin AND cognito_sub = :sub',
        'ExpressionAttributeNames': {'#r': 'role'},
        'ExpressionAttributeValues': to_attribute_map({':admin': 'ADMIN', ':sub': actor.cognito_sub})}}
    try:
        transact_write_items([check, *([extra] if extra else []), mutation, {'Put': {
            'TableName': _name('ClassAudit'), 'Item': to_attribute_map(record), 'ConditionExpression': 'attribute_not_exists(audit_id)'}}])
    except ClientError as exc:
        if exc.response['Error']['Code'] == 'TransactionCanceledException':
            raise ConflictError('権限または登録内容が変更されました。再読み込みして確認してください。') from exc
        raise
    return record


def overview(event):
    _actor(event)
    classes = [{**{k: r.get(k, '') for k in ('class_id', 'class_name', 'grade', 'school_year')},
                'version': _version(r, 'version')} for r in _all('SchoolClasses')]
    users = [{**{k: r.get(k) for k in ('user_id', 'name', 'email', 'role', 'class_id')},
              'version': _version(r, 'assignment_version')} for r in _all('Users') if r.get('role') in ('TEACHER', 'STUDENT')]
    # This development app represents one school. Do not deploy across schools without tenant isolation.
    audits = sorted(_all('ClassAudit'), key=lambda r: (r['created_at'], r['audit_id']), reverse=True)[:100]
    return {'classes': sorted(classes, key=lambda r: (r['school_year'], r['class_name'], r['class_id'])),
            'users': sorted(users, key=lambda r: (r['role'], r.get('name') or '', r['user_id'])), 'audits': audits}


def save_class(event, class_id=None):
    actor = _actor(event)
    if class_id is not None:
        class_id = _text(class_id, 128)
    keys = ['className', 'grade', 'schoolYear'] + (['version'] if class_id else [])
    data = _payload(event, keys)
    fields = {'class_name': _text(data['className'], 100), 'grade': _text(data['grade'], 30),
              'school_year': _text(data['schoolYear'], 30)}
    if class_id:
        old = _table('SchoolClasses').get_item(Key={'class_id': class_id}, ConsistentRead=True).get('Item')
        if not old:
            raise ValidationError('クラスが見つかりません。')
        version = _expected(data['version'])
        if version != _version(old, 'version'):
            raise ConflictError('クラス情報が変更されました。再読み込みしてください。')
        condition, values = _cas(old, 'version', version)
        mutation = {'Update': {'TableName': _name('SchoolClasses'), 'Key': to_attribute_map({'class_id': class_id}),
            'UpdateExpression': 'SET class_name = :name, grade = :grade, school_year = :year, version = :next',
            'ConditionExpression': 'attribute_exists(class_id) AND ' + condition,
            'ExpressionAttributeValues': to_attribute_map({**values, ':name': fields['class_name'], ':grade': fields['grade'],
                                                         ':year': fields['school_year'], ':next': version + 1})}}
        before = {k: old.get(k) for k in fields}
    else:
        class_id = str(uuid.uuid4())
        mutation = {'Put': {'TableName': _name('SchoolClasses'), 'Item': to_attribute_map({'class_id': class_id, **fields, 'version': 0}),
                            'ConditionExpression': 'attribute_not_exists(class_id)'}}
        before = None
    return _commit(actor, 'UPDATE_CLASS' if before is not None else 'CREATE_CLASS', class_id, before, fields, mutation)


def move_user(event, user_id):
    actor = _actor(event)
    data = _payload(event, ['classId', 'previousClassId', 'version'])
    class_id = _text(data['classId'], 128)
    version = _expected(data['version'])
    old = get_user_by_id(user_id)
    if not old or old.get('role') not in ('TEACHER', 'STUDENT'):
        raise ValidationError('教員または生徒を選択してください。')
    if old.get('class_id') != data['previousClassId'] or _version(old, 'assignment_version') != version:
        raise ConflictError('所属が変更されています。再読み込みしてください。')
    if old.get('class_id') == class_id:
        raise ValidationError('現在と異なるクラスを選択してください。')
    condition, values = _cas(old, 'assignment_version', version)
    prior = 'class_id = :prior' if 'class_id' in old else 'attribute_not_exists(class_id)'
    if 'class_id' in old:
        values[':prior'] = old['class_id']
    mutation = {'Update': {'TableName': _name('Users'), 'Key': to_attribute_map({'user_id': user_id}),
        'UpdateExpression': 'SET class_id = :class, assignment_version = :next, updated_at = :now',
        'ConditionExpression': '#r = :role AND cognito_sub = :sub AND ' + prior + ' AND ' + condition,
        'ExpressionAttributeNames': {'#r': 'role'},
        'ExpressionAttributeValues': to_attribute_map({**values, ':class': class_id, ':next': version + 1, ':role': old['role'],
                ':sub': old['cognito_sub'], ':now': datetime.now(UTC).isoformat()})}}
    previous_class = _table('SchoolClasses').get_item(Key={'class_id': old['class_id']}, ConsistentRead=True).get('Item', {}) if old.get('class_id') else {}
    next_class = _table('SchoolClasses').get_item(Key={'class_id': class_id}, ConsistentRead=True).get('Item', {})
    exists = {'ConditionCheck': {'TableName': _name('SchoolClasses'), 'Key': to_attribute_map({'class_id': class_id}),
                                'ConditionExpression': 'attribute_exists(class_id)'}}
    return _commit(actor, 'MOVE_' + old['role'], user_id, {'class_id': old.get('class_id'), 'class_name': previous_class.get('class_name', old.get('class_id') or '未設定'), 'name': old.get('name', '')},
                   {'class_id': class_id, 'class_name': next_class.get('class_name', class_id), 'name': old.get('name', '')}, mutation, exists)
