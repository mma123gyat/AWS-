"""Time switching with real DynamoDB transactions, isolated with Moto."""
import json
from datetime import UTC, datetime, timedelta

import boto3
import pytest
from moto import mock_aws

from src.handlers.students import get_dashboard, get_study_plan_today, post_study_plan, post_study_record
from src.repositories import daily_conditions_repository, dynamodb_client, study_plans_repository, study_records_repository, study_tasks_repository
from src.services import study_plan_service
from src.services.rule_based_plan_service import generate_rule_based_plan
from src.utils.auth_context import AuthenticatedUser
from src.utils.dates import today_jst
from src.utils.errors import ConflictError

STUDENT = AuthenticatedUser('student-1', 'sub-1', 'test', 'student@example.invalid', 'STUDENT', 'class-1', None)


@pytest.fixture
def app(monkeypatch):
    for key, value in {
        'AWS_ACCESS_KEY_ID': 'testing', 'AWS_SECRET_ACCESS_KEY': 'testing',
        'AWS_SESSION_TOKEN': 'testing', 'AWS_REGION': 'ap-northeast-1',
        'AWS_DEFAULT_REGION': 'ap-northeast-1',
    }.items():
        monkeypatch.setenv(key, value)
    for handler in (get_dashboard, get_study_plan_today, post_study_plan, post_study_record):
        monkeypatch.setattr(handler, 'get_authenticated_user', lambda event: STUDENT)
    progress = {'subject_id': 'math', 'unit_name': 'proportion', 'understanding': 3}
    for module in (study_plan_service, get_dashboard):
        monkeypatch.setattr(module, 'list_progresses_by_student', lambda student_id: [progress])
        monkeypatch.setattr(module, 'get_curriculum', lambda *args: {'unit_name': 'school-unit'})
    monkeypatch.setattr(study_plan_service, 'get_user_by_id', lambda student_id: {'class_id': 'class-1'})
    monkeypatch.setattr(study_plan_service, 'get_class_by_id', lambda class_id: {'grade': 'grade-1'})
    monkeypatch.setattr(study_plan_service, 'get_subject_by_id', lambda subject_id: {'name': 'math'})
    calls = []

    def generate(params, request_id):
        calls.append(params['available_minutes'])
        return {**generate_rule_based_plan(params), 'generator': 'RULE', 'model_id': 'test', 'prompt_version': 'v1'}

    monkeypatch.setattr(study_plan_service, 'generate_plan', generate)
    with mock_aws():
        dynamodb_client.get_resource.cache_clear()
        dynamodb_client.get_client.cache_clear()
        resource = boto3.resource('dynamodb', region_name='ap-northeast-1')
        for table, partition, sort, kind in [
            ('StudyPlans', 'student_id', 'plan_date', 'S'),
            ('StudyTasks', 'plan_id', 'task_order', 'N'),
            ('DailyConditions', 'student_id', 'date', 'S'),
            ('StudyRecords', 'student_id', 'sort_key', 'S'),
        ]:
            resource.create_table(
                TableName=table,
                KeySchema=[{'AttributeName': partition, 'KeyType': 'HASH'}, {'AttributeName': sort, 'KeyType': 'RANGE'}],
                AttributeDefinitions=[{'AttributeName': partition, 'AttributeType': 'S'}, {'AttributeName': sort, 'AttributeType': kind}],
                BillingMode='PAY_PER_REQUEST',
            )
        yield resource, calls
        dynamodb_client.get_resource.cache_clear()
        dynamodb_client.get_client.cache_clear()


def choose(minutes):
    return daily_conditions_repository.put_condition(STUDENT.user_id, today_jst(), minutes)


def test_teacher_settings_apply_only_to_new_plans_preserving_cached_tasks_and_records(app, monkeypatch):
    settings = {'difficulty': 2, 'volume': 1, 'supportLevel': 5}
    monkeypatch.setattr(study_plan_service, 'get_user_by_id', lambda student_id: {'class_id': 'class-1', 'ai_parameters': dict(settings)})
    original = generate(15)
    assert original['available_minutes'] == 15
    assert sum(task['planned_minutes'] for task in original['tasks']) == 6
    assert original['ai_parameters'] == settings
    saved = data(record(original['tasks'][0]))
    old_settings = dict(settings)
    settings.update(difficulty=5, volume=5, supportLevel=1)
    unchanged = generate(15)
    assert unchanged['plan_id'] == original['plan_id']
    assert unchanged['ai_parameters'] == old_settings
    assert unchanged['tasks'][0]['status'] == 'COMPLETED'
    new = generate(30)
    assert new['ai_parameters'] == settings
    assert len(new['tasks']) == 4
    assert sum(task['planned_minutes'] for task in new['tasks']) == 30
    restored = generate(15)
    assert restored['plan_id'] == original['plan_id']
    assert restored['ai_parameters'] == old_settings
    assert restored['tasks'][0]['completion_record']['record_id'] == saved['record_id']
    assert len(study_records_repository.list_records_by_student(STUDENT.user_id)) == 1
    assert app[1] == [15, 30]


def test_settings_change_while_generating_keeps_the_started_attempt_snapshot(app, monkeypatch):
    settings = {'difficulty': 1, 'volume': 1, 'supportLevel': 5}
    monkeypatch.setattr(study_plan_service, 'get_user_by_id', lambda student_id: {'class_id': 'class-1', 'ai_parameters': dict(settings)})
    original_generate = study_plan_service.generate_plan
    def changing_settings(params, request_id):
        settings.update(difficulty=5, volume=5, supportLevel=1)
        return original_generate(params, request_id)
    monkeypatch.setattr(study_plan_service, 'generate_plan', changing_settings)
    plan = generate(15)
    assert plan['ai_parameters'] == {'difficulty': 1, 'volume': 1, 'supportLevel': 5}
    assert sum(task['planned_minutes'] for task in plan['tasks']) == 6
    following = generate(30)
    assert following['ai_parameters'] == settings


def data(response):
    assert response['statusCode'] == 200, response
    return json.loads(response['body'])['data']


def generate(minutes):
    choose(minutes)
    return data(post_study_plan.handler({}, None))['plan']


def record(task, minutes=4):
    return post_study_record.handler({'body': json.dumps({
        'taskId': task['task_id'], 'actualMinutes': minutes, 'understanding': 3,
    })}, None)


@pytest.mark.parametrize('before,after', [(30, 5), (5, 30), (15, 5), (5, 15)])
def test_changed_time_gets_a_matching_plan(app, before, after):
    first, second = generate(before), generate(after)
    assert first['plan_id'] != second['plan_id']
    assert second['available_minutes'] == after
    assert sum(task['planned_minutes'] for task in second['tasks']) <= after
    assert app[1] == [before, after]


def test_returning_to_a_time_restores_completed_tasks_and_keeps_one_record(app):
    first = generate(15)
    saved = data(record(first['tasks'][0]))
    generate(5)
    restored = generate(15)
    assert restored['plan_id'] == first['plan_id']
    assert restored['tasks'][0]['status'] == 'COMPLETED'
    assert restored['tasks'][0]['completion_record']['record_id'] == saved['record_id']
    assert app[1] == [15, 5]
    assert data(record(first['tasks'][0]))['record_id'] == saved['record_id']
    records = study_records_repository.list_records_by_student(STUDENT.user_id)
    assert len(records) == 1
    assert sum(item['actual_minutes'] for item in records) == 4


def test_all_three_time_choices_are_cached_without_duplicate_tasks(app):
    originals = {minutes: generate(minutes) for minutes in (5, 15, 30)}
    for minutes in (5, 30, 15, 5):
        assert generate(minutes)['plan_id'] == originals[minutes]['plan_id']
    assert app[1] == [5, 15, 30]
    assert app[0].Table('StudyTasks').scan()['Count'] == 6


def test_resaving_the_same_time_reuses_the_plan(app):
    first = generate(15)
    assert generate(15)['plan_id'] == first['plan_id']
    assert app[1] == [15]


def test_rest_day_hides_plan_and_returning_restores_the_original(app):
    first = generate(15)
    data(record(first['tasks'][0]))
    choose(0)
    assert data(post_study_plan.handler({}, None)) == {'isRestDay': True, 'plan': None}
    assert data(get_dashboard.handler({}, None))['todayPlan'] is None
    assert data(get_study_plan_today.handler({}, None))['isRestDay'] is True
    restored = generate(15)
    assert restored['plan_id'] == first['plan_id']
    assert restored['tasks'][0]['status'] == 'COMPLETED'
    assert app[1] == [15]
    assert len(study_records_repository.list_records_by_student(STUDENT.user_id)) == 1


@pytest.mark.parametrize('minutes', [0, 5, 30])
def test_old_task_is_rejected_after_time_change_even_before_generation(app, minutes):
    old = generate(15)
    choose(minutes)
    assert record(old['tasks'][0])['statusCode'] == 409
    assert study_tasks_repository.get_task(old['plan_id'], 1)['status'] == 'NOT_STARTED'
    assert study_records_repository.list_records_by_student(STUDENT.user_id) == []


def test_retired_task_is_rejected_after_a_new_plan_is_active(app):
    old = generate(15)
    generate(5)
    assert record(old['tasks'][0])['statusCode'] == 409
    assert study_records_repository.list_records_by_student(STUDENT.user_id) == []


@pytest.mark.parametrize('handler,field', [(get_dashboard, 'todayPlan'), (get_study_plan_today, 'plan')])
def test_get_endpoints_hide_a_plan_for_another_time(app, handler, field):
    first = generate(30)
    choose(5)
    assert data(handler.handler({}, None))[field] is None
    generate(5)
    current = data(handler.handler({}, None))[field]
    assert current['available_minutes'] == 5
    assert current['plan_id'] != first['plan_id']


def test_busy_lock_prevents_second_generation_even_after_time_changes(app, monkeypatch):
    original = study_plan_service.generate_plan

    def racing_generate(params, request_id):
        choose(5)
        with pytest.raises(ConflictError):
            study_plan_service.generate_plan_for_student(STUDENT.user_id, 5, 'second')
        return original(params, request_id)

    monkeypatch.setattr(study_plan_service, 'generate_plan', racing_generate)
    choose(30)
    assert post_study_plan.handler({}, None)['statusCode'] == 409
    assert app[1] == [30]
    assert app[0].Table('StudyTasks').scan()['Count'] == 0
    assert study_plans_repository.get_plan(STUDENT.user_id, today_jst())['status'] == 'FAILED'
    monkeypatch.setattr(study_plan_service, 'generate_plan', original)
    assert generate(5)['available_minutes'] == 5
    assert app[1] == [30, 5]


def test_time_change_at_commit_rolls_back_all_generated_tasks(app, monkeypatch):
    original = study_plans_repository.transact_write_items

    def change_then_write(items):
        choose(5)
        return original(items)

    monkeypatch.setattr(study_plans_repository, 'transact_write_items', change_then_write)
    choose(30)
    assert post_study_plan.handler({}, None)['statusCode'] == 409
    assert app[0].Table('StudyTasks').scan()['Count'] == 0
    monkeypatch.setattr(study_plans_repository, 'transact_write_items', original)
    assert generate(5)['available_minutes'] == 5


def test_failed_generation_keeps_old_plan_and_records_for_restore(app, monkeypatch):
    old = generate(15)
    saved = data(record(old['tasks'][0]))
    original = study_plan_service.generate_plan

    def fail(*args):
        raise RuntimeError('generation failed')

    monkeypatch.setattr(study_plan_service, 'generate_plan', fail)
    choose(5)
    assert post_study_plan.handler({}, None)['statusCode'] == 500
    restored = generate(15)
    assert restored['plan_id'] == old['plan_id']
    assert restored['tasks'][0]['completion_record']['record_id'] == saved['record_id']
    monkeypatch.setattr(study_plan_service, 'generate_plan', original)
    assert generate(5)['available_minutes'] == 5


def test_stale_reader_cannot_overwrite_a_racing_switch_or_its_cache(app, monkeypatch):
    generate(15)
    snapshot = study_plans_repository.get_plan(STUDENT.user_id, today_jst())
    winner = study_plans_repository.try_acquire_lock(STUDENT.user_id, today_jst(), 'winner', 90, available_minutes=5)
    monkeypatch.setattr(study_plans_repository, 'get_plan', lambda *args: snapshot)
    loser = study_plans_repository.try_acquire_lock(STUDENT.user_id, today_jst(), 'loser', 90, available_minutes=30)
    assert loser is None
    stored = app[0].Table('StudyPlans').get_item(Key={'student_id': STUDENT.user_id, 'plan_date': today_jst()})['Item']
    assert stored['owner_id'] == 'winner'
    assert stored['plan_versions'] == winner['plan_versions']


def test_expired_generation_can_be_retried_without_losing_cached_plan(app):
    old = generate(15)
    choose(5)
    study_plans_repository.try_acquire_lock(STUDENT.user_id, today_jst(), 'crashed', 90, available_minutes=5)
    app[0].Table('StudyPlans').update_item(
        Key={'student_id': STUDENT.user_id, 'plan_date': today_jst()},
        UpdateExpression='SET updated_at = :old',
        ExpressionAttributeValues={':old': (datetime.now(UTC) - timedelta(seconds=120)).isoformat()},
    )
    assert generate(5)['available_minutes'] == 5
    assert generate(15)['plan_id'] == old['plan_id']
    assert app[1] == [15, 5]


def test_well_formed_legacy_plan_can_be_switched_and_restored(app):
    old = generate(15)
    app[0].Table('StudyPlans').update_item(
        Key={'student_id': STUDENT.user_id, 'plan_date': today_jst()},
        UpdateExpression='REMOVE #status, created_at', ExpressionAttributeNames={'#status': 'status'},
    )
    generate(5)
    assert generate(15)['plan_id'] == old['plan_id']
    assert app[1] == [15, 5]


def test_incomplete_legacy_row_can_be_replaced_instead_of_blocking_forever(app):
    app[0].Table('StudyPlans').put_item(Item={
        'student_id': STUDENT.user_id, 'plan_date': today_jst(), 'plan_id': 'broken', 'available_minutes': 15,
    })
    assert generate(15)['available_minutes'] == 15


def test_record_rolls_back_when_time_changes_after_read(app, monkeypatch):
    plan = generate(15)
    original = study_records_repository.transact_write_items

    def change_then_write(items):
        choose(0)
        return original(items)

    monkeypatch.setattr(study_records_repository, 'transact_write_items', change_then_write)
    assert record(plan['tasks'][0])['statusCode'] == 409
    assert study_tasks_repository.get_task(plan['plan_id'], 1)['status'] == 'NOT_STARTED'
    assert study_records_repository.list_records_by_student(STUDENT.user_id) == []


def test_record_rolls_back_when_active_plan_switches_after_read(app, monkeypatch):
    old = generate(15)
    original = study_records_repository.transact_write_items

    def switch_then_write(items):
        generate(5)
        return original(items)

    monkeypatch.setattr(study_records_repository, 'transact_write_items', switch_then_write)
    assert record(old['tasks'][0])['statusCode'] == 409
    assert study_records_repository.list_records_by_student(STUDENT.user_id) == []
    assert study_tasks_repository.get_task(old['plan_id'], 1)['status'] == 'NOT_STARTED'


def test_old_plan_cannot_commit_over_a_different_plan_even_with_reused_owner(app):
    old = generate(15)
    choose(5)
    lock = study_plans_repository.try_acquire_lock(STUDENT.user_id, today_jst(), 'local', 90, available_minutes=5)
    with pytest.raises(study_plans_repository.PlanLockLostError):
        study_plans_repository.complete_plan_with_tasks(
            student_id=STUDENT.user_id, plan_date=today_jst(), owner_id='local', plan_id=old['plan_id'],
            available_minutes=15, subject_id='math', title='stale', reason='stale', generator='RULE',
            model_id='test', prompt_version='v1', tasks=[], created_at=old['created_at'],
        )
    active = study_plans_repository.get_plan(STUDENT.user_id, today_jst())
    assert active['plan_id'] == lock['plan_id']
    assert active['status'] == 'GENERATING'


def test_retry_of_an_already_saved_record_still_works_after_switching_time(app):
    old = generate(15)
    saved = data(record(old['tasks'][0]))
    generate(5)
    assert data(record(old['tasks'][0])) == saved
    assert len(study_records_repository.list_records_by_student(STUDENT.user_id)) == 1
