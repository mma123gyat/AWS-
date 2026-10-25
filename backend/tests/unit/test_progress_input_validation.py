"""Validation boundaries and real handler persistence, using Moto only."""
import json

import boto3
import pytest

from tests.unit.test_parent_support_handlers import tables, _aws_credentials, _event, STUDENT_ID
from src.handlers.teacher import put_class_progress, put_student_progress
from src.handlers.students import get_dashboard
from src.repositories import curriculums_repository, student_progresses_repository, users_repository
from src.utils.errors import ValidationError
from src.validators.progress_validator import validate_curriculum_input, validate_student_progress_input

VALIDATORS = [validate_curriculum_input, validate_student_progress_input]
PAYLOAD = {'subjectId': 'math', 'unitName': '比例・反比例', 'status': 'IN_PROGRESS', 'understanding': 3, 'textbookPage': 'p.42'}


@pytest.mark.parametrize('validate', VALIDATORS)
@pytest.mark.parametrize('unit', [{'label': '比例'}, ['比例'], 42, True, None])
def test_non_text_unit_names_are_rejected(validate, unit):
    with pytest.raises(ValidationError):
        validate({**PAYLOAD, 'unitName': unit})


@pytest.mark.parametrize('validate', VALIDATORS)
@pytest.mark.parametrize('payload', [None, [], 'text', 42, True])
def test_payload_must_be_an_object(validate, payload):
    with pytest.raises(ValidationError):
        validate(payload)


@pytest.mark.parametrize('validate', VALIDATORS)
@pytest.mark.parametrize('field', ['subjectId', 'unitName'])
@pytest.mark.parametrize('value', ['', ' \t\n　'])
def test_required_text_rejects_empty_or_only_whitespace(validate, field, value):
    with pytest.raises(ValidationError):
        validate({**PAYLOAD, field: value})


@pytest.mark.parametrize('validate', VALIDATORS)
@pytest.mark.parametrize('status', [None, 'DONE', [], {}, True])
def test_invalid_status_is_always_a_validation_error(validate, status):
    with pytest.raises(ValidationError):
        validate({**PAYLOAD, 'status': status})


@pytest.mark.parametrize('validate', VALIDATORS)
def test_limits_count_characters_and_trim_only_outer_whitespace(validate):
    payload = {**PAYLOAD, 'subjectId': ' s' + 'x' * 127 + ' ', 'unitName': '　' + '😀' * 200 + '　', 'textbookPage': ' ' + '頁' * 100 + ' '}
    before = dict(payload)
    result = validate(payload)
    assert result['subject_id'] == 's' + 'x' * 127
    assert result['unit_name'] == '😀' * 200
    if validate == validate_curriculum_input:
        assert result['textbook_page'] == '頁' * 100
    assert payload == before


@pytest.mark.parametrize('validate', VALIDATORS)
@pytest.mark.parametrize('field,value', [('subjectId', 's' * 129), ('unitName', '単' * 201)])
def test_text_over_limits_is_rejected_instead_of_truncated(validate, field, value):
    with pytest.raises(ValidationError):
        validate({**PAYLOAD, field: value})


@pytest.mark.parametrize('value', [None, 42, [], {}, '頁' * 101])
def test_textbook_page_is_optional_but_must_be_short_text(value):
    with pytest.raises(ValidationError):
        validate_curriculum_input({**PAYLOAD, 'textbookPage': value})


def test_missing_or_whitespace_textbook_page_stays_optional():
    for payload in [{key: value for key, value in PAYLOAD.items() if key != 'textbookPage'}, {**PAYLOAD, 'textbookPage': '　 '}]:
        assert validate_curriculum_input(payload)['textbook_page'] == ''
    assert validate_student_progress_input({**PAYLOAD, 'unitName': '  比例 の確認\n次の単元  '})['unit_name'] == '比例 の確認\n次の単元'


@pytest.fixture
def positions(tables):
    client = boto3.client('dynamodb', region_name='ap-northeast-1')
    for name, keys in [('Curriculums', [('class_id', 'S'), ('subject_id', 'S')]), ('DailyConditions', [('student_id', 'S'), ('date', 'S')])]:
        client.create_table(TableName=name, KeySchema=[{'AttributeName': key, 'KeyType': 'HASH' if index == 0 else 'RANGE'} for index, (key, _) in enumerate(keys)], AttributeDefinitions=[{'AttributeName': key, 'AttributeType': kind} for key, kind in keys], BillingMode='PAY_PER_REQUEST')
    users_repository.update_user_fields(STUDENT_ID, class_id='class-1')
    users_repository.create_user('teacher-input-test', 'teacher-input-sub', '先生', '', 'TEACHER', class_id='class-1')
    student_progresses_repository.put_progress(STUDENT_ID, 'math', '元の単元', 4, 'IN_PROGRESS')
    curriculums_repository.put_curriculum('class-1', 'math', '学校の元の単元', 'p.40', 'IN_PROGRESS', 'teacher-input-test')


def event(payload):
    return {**_event('teacher-input-sub', '[TEACHER]'), 'pathParameters': {'studentId': STUDENT_ID, 'classId': 'class-1'}, 'body': json.dumps(payload)}


@pytest.mark.parametrize('module', [put_student_progress, put_class_progress])
@pytest.mark.parametrize('payload', [None, [], {**PAYLOAD, 'unitName': {'label': '比例'}}, {**PAYLOAD, 'subjectId': 42}, {**PAYLOAD, 'status': []}, {**PAYLOAD, 'unitName': '単' * 201}, {**PAYLOAD, 'unitName': '　 '}])
def test_invalid_input_returns_400_and_preserves_displayable_positions(positions, module, payload):
    before_student = student_progresses_repository.get_progress(STUDENT_ID, 'math')
    before_school = curriculums_repository.get_curriculum('class-1', 'math')
    response = module.handler(event(payload), None)
    assert response['statusCode'] == 400
    assert json.loads(response['body'])['error']['code'] == 'VALIDATION_ERROR'
    assert student_progresses_repository.get_progress(STUDENT_ID, 'math') == before_student
    assert curriculums_repository.get_curriculum('class-1', 'math') == before_school
    dashboard = get_dashboard.handler(_event('target-sub', '[STUDENT]'), None)
    assert dashboard['statusCode'] == 200
    data = json.loads(dashboard['body'])['data']
    assert data['myCurrentPosition']['unit_name'] == '元の単元'
    assert data['schoolCurrentPosition']['unit_name'] == '学校の元の単元'


@pytest.mark.parametrize('module', [put_student_progress, put_class_progress])
def test_normalized_japanese_text_is_saved_and_returned_to_student(positions, module):
    payload = {**PAYLOAD, 'subjectId': ' math ', 'unitName': '　比例・反比例の確認 😀　', 'textbookPage': ' p.42 '}
    response = module.handler(event(payload), None)
    assert response['statusCode'] == 200
    saved = json.loads(response['body'])['data']
    assert saved['subject_id'] == 'math' and saved['unit_name'] == '比例・反比例の確認 😀'
    if module == put_class_progress:
        assert saved['textbook_page'] == 'p.42'
    dashboard = json.loads(get_dashboard.handler(_event('target-sub', '[STUDENT]'), None)['body'])['data']
    key = 'myCurrentPosition' if module == put_student_progress else 'schoolCurrentPosition'
    assert dashboard[key]['unit_name'] == saved['unit_name']


@pytest.mark.parametrize('module', [put_student_progress, put_class_progress])
def test_non_json_body_returns_400(positions, module):
    for bad in ['{', 42]:
        response = module.handler({**event(PAYLOAD), 'body': bad}, None)
        assert response['statusCode'] == 400
