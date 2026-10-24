"""Teacher-owned settings and generation budgets, with no live AWS requests."""
import copy
import json
from decimal import Decimal
from itertools import product

import boto3
import pytest
from moto import mock_aws
from botocore.exceptions import ClientError

from src.handlers.teacher import get_ai_parameters, put_ai_parameters
from src.models.ai_parameters import DEFAULT_AI_PARAMETERS, read_ai_parameters
from src.repositories import dynamodb_client, users_repository
from src.services import bedrock_service, study_plan_service, teacher_ai_parameters_service
from src.services.rule_based_plan_service import generate_rule_based_plan
from src.utils.auth_context import AuthenticatedUser
from src.validators.ai_parameters_validator import validate_ai_parameters_input

DEFAULT = DEFAULT_AI_PARAMETERS
CUSTOM = {"difficulty": 2, "volume": 1, "supportLevel": 5}
BASE = {"grade": "中学2年", "subject": "数学", "school_topic": "一次関数", "student_topic": "比例", "understanding": 3, "available_minutes": 15}
TEACHER = AuthenticatedUser('teacher-1', 'teacher-sub', '先生', 'teacher@example.invalid', 'TEACHER', 'class-1', None)


@pytest.fixture
def users(monkeypatch):
    for key, value in {
        'AWS_ACCESS_KEY_ID': 'testing', 'AWS_SECRET_ACCESS_KEY': 'testing', 'AWS_SESSION_TOKEN': 'testing',
        'AWS_REGION': 'ap-northeast-1', 'AWS_DEFAULT_REGION': 'ap-northeast-1',
        'USERS_TABLE_NAME': 'Users',
    }.items():
        monkeypatch.setenv(key, value)
    monkeypatch.setattr(teacher_ai_parameters_service, 'get_authenticated_user', lambda event: TEACHER)
    with mock_aws():
        dynamodb_client.get_resource.cache_clear()
        dynamodb_client.get_client.cache_clear()
        table = boto3.resource('dynamodb', region_name='ap-northeast-1').create_table(
            TableName='Users', KeySchema=[{'AttributeName': 'user_id', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'user_id', 'AttributeType': 'S'}], BillingMode='PAY_PER_REQUEST',
        )
        table.put_item(Item={'user_id': 'student-1', 'role': 'STUDENT', 'class_id': 'class-1', 'name': '生徒', 'cognito_sub': 'student-sub', 'linked_student_id': 'keep-link', 'created_at': 'original'})
        table.put_item(Item={'user_id': 'student-2', 'role': 'STUDENT', 'class_id': 'class-2'})
        table.put_item(Item={'user_id': 'teacher-1', 'role': 'TEACHER', 'class_id': 'class-1'})
        yield table
        dynamodb_client.get_resource.cache_clear()
        dynamodb_client.get_client.cache_clear()


def event(params=CUSTOM, student_id='student-1'):
    return {'pathParameters': {'studentId': student_id}, 'body': json.dumps(params)}


def data(response):
    assert response['statusCode'] == 200, response
    return json.loads(response['body'])['data']


def test_defaults_do_not_write_and_saved_settings_round_trip_without_changing_user(users):
    initial = users.get_item(Key={'user_id': 'student-1'})['Item']
    assert data(get_ai_parameters.handler(event(), None)) == {'studentId': 'student-1', 'params': DEFAULT, 'updatedAt': None}
    assert users.get_item(Key={'user_id': 'student-1'})['Item'] == initial
    saved = data(put_ai_parameters.handler(event(), None))
    assert saved['params'] == CUSTOM
    assert saved['updatedAt']
    assert data(get_ai_parameters.handler(event(), None)) == saved
    reloaded = users.get_item(Key={'user_id': 'student-1'})['Item']
    for key, value in initial.items():
        assert reloaded[key] == value
    assert 'ai_parameters' not in users.get_item(Key={'user_id': 'student-2'})['Item']


@pytest.mark.parametrize('role', ['STUDENT', 'PARENT', 'SUPPORT'])
@pytest.mark.parametrize('handler', [get_ai_parameters.handler, put_ai_parameters.handler])
def test_other_roles_cannot_read_or_write(users, monkeypatch, role, handler):
    caller = AuthenticatedUser('other', 'sub', '', '', role, 'class-1', None)
    monkeypatch.setattr(teacher_ai_parameters_service, 'get_authenticated_user', lambda event: caller)
    assert handler(event(), None)['statusCode'] == 403
    assert 'ai_parameters' not in users.get_item(Key={'user_id': 'student-1'})['Item']


@pytest.mark.parametrize('target,status', [('student-2', 403), ('missing', 404), ('teacher-1', 404), ('', 400)])
@pytest.mark.parametrize('handler', [get_ai_parameters.handler, put_ai_parameters.handler])
def test_only_assigned_students_are_accessible(users, target, status, handler):
    assert handler(event(student_id=target), None)['statusCode'] == status


def test_teacher_without_class_and_missing_path_are_rejected(users, monkeypatch):
    assert get_ai_parameters.handler({'pathParameters': None}, None)['statusCode'] == 400
    monkeypatch.setattr(teacher_ai_parameters_service, 'get_authenticated_user', lambda event: AuthenticatedUser('t', 'sub', '', '', 'TEACHER', None, None))
    assert put_ai_parameters.handler(event(), None)['statusCode'] == 400


@pytest.mark.parametrize('payload', [None, [], 'text', {}, {**CUSTOM, 'volume': True}, {**CUSTOM, 'volume': '1'}, {**CUSTOM, 'volume': 1.0}, {**CUSTOM, 'volume': 0}, {**CUSTOM, 'volume': 6}, {**CUSTOM, 'studentId': 'student-2'}])
def test_invalid_input_does_not_write(users, payload):
    assert put_ai_parameters.handler(event(payload), None)['statusCode'] == 400
    assert 'ai_parameters' not in users.get_item(Key={'user_id': 'student-1'})['Item']


def test_invalid_json_is_a_validation_error(users):
    request = event()
    request['body'] = '{'
    assert put_ai_parameters.handler(request, None)['statusCode'] == 400


def test_membership_change_during_save_cannot_update_another_class(users, monkeypatch):
    original = teacher_ai_parameters_service.put_ai_parameters
    def moved(student_id, class_id, params):
        users.update_item(Key={'user_id': student_id}, UpdateExpression='SET class_id = :new', ExpressionAttributeValues={':new': 'class-2'})
        return original(student_id, class_id, params)
    monkeypatch.setattr(teacher_ai_parameters_service, 'put_ai_parameters', moved)
    assert put_ai_parameters.handler(event(), None)['statusCode'] == 409
    assert 'ai_parameters' not in users.get_item(Key={'user_id': 'student-1'})['Item']


def test_removed_student_is_not_recreated_by_update(users):
    users.delete_item(Key={'user_id': 'student-1'})
    with pytest.raises(ClientError) as error:
        users_repository.put_ai_parameters('student-1', 'class-1', CUSTOM)
    assert error.value.response['Error']['Code'] == 'ConditionalCheckFailedException'
    assert 'Item' not in users.get_item(Key={'user_id': 'student-1'})


def test_persisted_decimal_settings_and_legacy_defaults():
    assert read_ai_parameters({key: Decimal(value) for key, value in CUSTOM.items()}) == CUSTOM
    assert read_ai_parameters(None) == DEFAULT
    assert read_ai_parameters({'difficulty': True, 'volume': Decimal('1.5'), 'supportLevel': 9}) == DEFAULT
    for value in range(1, 6):
        assert validate_ai_parameters_input(dict.fromkeys(DEFAULT, value)) == dict.fromkeys(DEFAULT, value)


@pytest.mark.parametrize('minutes', [5, 15, 30])
def test_all_125_combinations_keep_positive_tasks_and_selected_time_budget(minutes):
    for difficulty, volume, support in product(range(1, 6), repeat=3):
        params = {**BASE, 'available_minutes': minutes, 'ai_parameters': {'difficulty': difficulty, 'volume': volume, 'supportLevel': support}}
        before = copy.deepcopy(params)
        plan = generate_rule_based_plan(params)
        assert 1 <= len(plan['tasks']) <= (1 if minutes == 5 else 2 if minutes == 15 else 4)
        assert all(task['minutes'] > 0 for task in plan['tasks'])
        assert sum(task['minutes'] for task in plan['tasks']) == plan['total_minutes'] <= minutes
        assert params == before


def test_each_parameter_changes_fallback_without_changing_understanding():
    standard = generate_rule_based_plan({**BASE, 'available_minutes': 30})
    low = generate_rule_based_plan({**BASE, 'available_minutes': 30, 'ai_parameters': CUSTOM})
    assert low['total_minutes'] < standard['total_minutes']
    assert len(low['tasks']) < len(standard['tasks'])
    for key in DEFAULT:
        changed = generate_rule_based_plan({**BASE, 'ai_parameters': {**DEFAULT, key: 1}})
        assert changed != generate_rule_based_plan(BASE)
    assert BASE['understanding'] == 3


def test_prompt_includes_all_settings_real_understanding_and_budget():
    text = bedrock_service._build_user_message({**BASE, 'ai_parameters': CUSTOM})
    assert '本人の理解度(1〜5): 3' in text
    assert '今日使える時間(分): 15' in text
    assert '教員の難易度設定(1〜5): 2' in text
    assert '教員の学習量設定(1〜5): 1' in text
    assert '教員のサポート設定(1〜5): 5' in text
    assert '6分以内' in text
    assert '1個以内' in text


def test_bedrock_over_teacher_budget_or_task_count_falls_back(monkeypatch):
    monkeypatch.setenv('BEDROCK_MODEL_ID', 'test-model')
    over_budget = {'subject': '数学', 'title': 'test', 'reason': 'test', 'total_minutes': 15, 'tasks': [{'order': 1, 'title': 'test', 'minutes': 15, 'description': 'test'}]}
    class Client:
        def converse(self, **kwargs):
            return {'output': {'message': {'content': [{'toolUse': {'input': over_budget}}]}}}
    monkeypatch.setattr(bedrock_service, '_client', lambda: Client())
    plan = study_plan_service.generate_plan({**BASE, 'ai_parameters': CUSTOM}, 'req')
    assert plan['generator'] == 'RULE'
    assert plan['total_minutes'] == 6
    over_budget['total_minutes'] = 6
    over_budget['tasks'] = [{'order': i + 1, 'title': 't', 'minutes': 3, 'description': 'd'} for i in range(2)]
    with pytest.raises(bedrock_service.BedrockGenerationError):
        bedrock_service.generate_study_plan({**BASE, 'ai_parameters': CUSTOM})


@pytest.mark.parametrize('handler', [get_ai_parameters.handler, put_ai_parameters.handler])
def test_missing_authentication_is_unauthorized(users, monkeypatch, handler):
    from src.utils.auth_context import get_authenticated_user
    monkeypatch.setattr(teacher_ai_parameters_service, 'get_authenticated_user', get_authenticated_user)
    assert handler(event(), None)['statusCode'] == 401


def test_bedrock_can_use_the_adjusted_settings_without_fallback(monkeypatch):
    monkeypatch.setenv('BEDROCK_MODEL_ID', 'test-model')
    captured = {}
    adjusted = {'subject': '数学', 'title': '短く確認', 'reason': '短い復習', 'total_minutes': 6, 'tasks': [{'order': 1, 'title': '基礎', 'minutes': 6, 'description': '手順を確認'}]}
    class Client:
        def converse(self, **kwargs):
            captured.update(kwargs)
            return {'output': {'message': {'content': [{'toolUse': {'input': adjusted}}]}}}
    monkeypatch.setattr(bedrock_service, '_client', lambda: Client())
    result = study_plan_service.generate_plan({**BASE, 'ai_parameters': CUSTOM}, 'req')
    assert result['generator'] == 'BEDROCK'
    assert result['total_minutes'] == 6
    assert '6分以内' in captured['messages'][0]['content'][0]['text']
    assert '具体例' in captured['messages'][0]['content'][0]['text']
