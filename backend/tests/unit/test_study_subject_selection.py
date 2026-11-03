"""Subject switching using isolated DynamoDB transactions, not AWS."""
import json
import pytest
from tests.unit.test_study_plan_time_change import app, data, record, STUDENT
from src.handlers.students import get_dashboard, get_study_plan_today, post_condition, post_study_plan
from src.repositories import daily_conditions_repository as conditions, study_plans_repository as plans
from src.repositories import study_records_repository as records, study_tasks_repository as tasks
from src.services import study_plan_service as service
from src.utils.dates import today_jst
from src.utils.errors import ConflictError, ValidationError


@pytest.fixture
def subjects(app, monkeypatch):
    progresses = [
        {'subject_id': 'japanese', 'unit_name': '走れメロス', 'understanding': 2},
        {'subject_id': 'math', 'unit_name': '正負の数の加法・減法', 'understanding': 3},
    ]
    for module in (service, get_dashboard):
        monkeypatch.setattr(module, 'list_progresses_by_student', lambda student_id: progresses)
    monkeypatch.setattr(service, 'get_subject_by_id', lambda subject_id: {'name': subject_id})
    monkeypatch.setattr(post_condition, 'get_authenticated_user', lambda event: STUDENT)
    monkeypatch.setattr(post_condition, 'get_progress', lambda student_id, subject_id: next(
        (p for p in progresses if p['subject_id'] == subject_id and student_id == STUDENT.user_id), None))
    monkeypatch.setattr(post_condition, 'get_curriculum', lambda *args: {'unit_name': '学校の単元'})
    return app


def choose(subject='math', minutes=15):
    conditions.put_condition(STUDENT.user_id, today_jst(), minutes, subject_id=subject)


def generate(subject='math', minutes=15):
    choose(subject, minutes)
    return data(post_study_plan.handler({}, None))['plan']


def test_same_minutes_switches_subject_and_restores_record(subjects):
    first = generate('math')
    saved = data(record(first['tasks'][0]))
    other = generate('japanese')
    assert other['subject_id'] == 'japanese'
    assert other['plan_id'] != first['plan_id']
    assert other['tasks'][0]['unit_name'] == '走れメロス'
    restored = generate('math')
    assert restored['plan_id'] == first['plan_id']
    assert restored['tasks'][0]['completion_record']['record_id'] == saved['record_id']
    assert data(record(first['tasks'][0]))['record_id'] == saved['record_id']
    assert len(records.list_records_by_student(STUDENT.user_id)) == 1
    assert subjects[1] == [15, 15]


def test_all_subject_time_pairs_reuse_task_ids(subjects):
    originals = {(s, m): generate(s, m) for s in ('math', 'japanese') for m in (5, 15, 30)}
    for (subject, minutes), original in originals.items():
        assert generate(subject, minutes)['plan_id'] == original['plan_id']
    assert len(subjects[1]) == 6


def test_legacy_cache_restores_only_its_original_subject(subjects):
    choose(None)
    old = data(post_study_plan.handler({}, None))['plan']
    saved = data(record(old['tasks'][0]))
    new = generate('math')
    assert new['subject_id'] == 'math' and new['plan_id'] != old['plan_id']
    restored = generate('japanese')
    assert restored['plan_id'] == old['plan_id']
    assert restored['tasks'][0]['completion_record']['record_id'] == saved['record_id']
    assert len(subjects[1]) == 2


@pytest.mark.parametrize('handler,field', [(get_dashboard, 'todayPlan'), (get_study_plan_today, 'plan')])
def test_old_subject_hidden_before_generation(subjects, handler, field):
    generate('japanese')
    choose('math')
    assert data(handler.handler({}, None))[field] is None
    dashboard = data(get_dashboard.handler({}, None))
    assert dashboard['myCurrentPosition']['subject_id'] == 'math'
    assert {p['subject_id'] for p in dashboard['availableSubjects']} == {'math', 'japanese'}


def test_old_subject_cannot_record_at_same_minutes(subjects):
    old = generate('japanese')
    choose('math')
    assert record(old['tasks'][0])['statusCode'] == 409
    assert tasks.get_task(old['plan_id'], 1)['status'] == 'NOT_STARTED'
    assert records.list_records_by_student(STUDENT.user_id) == []


def test_subject_change_during_generation_is_atomic(subjects, monkeypatch):
    original = service.generate_plan
    def changing(params, request_id):
        choose('japanese')
        with pytest.raises(ConflictError):
            service.generate_plan_for_student(STUDENT.user_id, 15, 'racer', subject_id='japanese')
        return original(params, request_id)
    monkeypatch.setattr(service, 'generate_plan', changing)
    choose('math')
    assert post_study_plan.handler({}, None)['statusCode'] == 409
    assert subjects[0].Table('StudyTasks').scan()['Count'] == 0
    assert subjects[1] == [15]
    monkeypatch.setattr(service, 'generate_plan', original)
    assert generate('japanese')['subject_id'] == 'japanese'


@pytest.mark.parametrize('operation', ['plan', 'record'])
def test_subject_change_at_commit_rolls_back_writes(subjects, monkeypatch, operation):
    module = plans if operation == 'plan' else records
    original = module.transact_write_items
    plan = generate('math') if operation == 'record' else None
    def changing(items):
        choose('japanese')
        return original(items)
    monkeypatch.setattr(module, 'transact_write_items', changing)
    choose('math')
    if plan:
        assert record(plan['tasks'][0])['statusCode'] == 409
        assert records.list_records_by_student(STUDENT.user_id) == []
        assert tasks.get_task(plan['plan_id'], 1)['status'] == 'NOT_STARTED'
    else:
        assert post_study_plan.handler({}, None)['statusCode'] == 409
        assert subjects[0].Table('StudyTasks').scan()['Count'] == 0


def test_rest_and_generation_failure_preserve_records(subjects, monkeypatch):
    old = generate('math')
    saved = data(record(old['tasks'][0]))
    choose(None, 0)
    assert data(post_study_plan.handler({}, None))['isRestDay'] is True
    def fail(*args):
        raise RuntimeError('test')
    monkeypatch.setattr(service, 'generate_plan', fail)
    choose('japanese')
    assert post_study_plan.handler({}, None)['statusCode'] == 500
    restored = generate('math')
    assert restored['tasks'][0]['completion_record'] == saved


@pytest.mark.parametrize('subject', ['english', '', 'other-student', '__proto__'])
def test_unregistered_subject_cannot_generate_or_restore(subjects, subject):
    generate('math')
    before = plans.get_plan(STUDENT.user_id, today_jst())
    with pytest.raises(ValidationError):
        service.generate_plan_for_student(STUDENT.user_id, 15, 'invalid', subject_id=subject)
    assert plans.get_plan(STUDENT.user_id, today_jst()) == before


@pytest.mark.parametrize('subject', ['science', '', [], {}, 1, True])
def test_invalid_condition_preserves_current_selection(subjects, subject):
    choose('math')
    before = conditions.get_condition(STUDENT.user_id, today_jst())
    response = post_condition.handler({'body': json.dumps({'availableMinutes': 15, 'subjectId': subject})}, None)
    assert response['statusCode'] == 400
    assert conditions.get_condition(STUDENT.user_id, today_jst()) == before


def test_condition_requires_owned_subject_and_school_progress(subjects, monkeypatch):
    response = post_condition.handler({'body': json.dumps({'availableMinutes': 15, 'subjectId': 'math'})}, None)
    assert data(response)['subject_id'] == 'math'
    monkeypatch.setattr(post_condition, 'get_curriculum', lambda *args: None)
    response = post_condition.handler({'body': json.dumps({'availableMinutes': 5, 'subjectId': 'japanese'})}, None)
    assert response['statusCode'] == 400
    assert conditions.get_condition(STUDENT.user_id, today_jst())['subject_id'] == 'math'
    response = post_condition.handler({'body': json.dumps({'availableMinutes': 0})}, None)
    assert data(response)['available_minutes'] == 0
    assert 'subject_id' not in data(response)


def test_cached_restore_race_does_not_overwrite_completion(subjects, monkeypatch):
    old = generate('math')
    saved = data(record(old['tasks'][0]))
    generate('japanese')
    original = plans.transact_write_items
    def changing(items):
        choose('japanese')
        return original(items)
    monkeypatch.setattr(plans, 'transact_write_items', changing)
    choose('math')
    assert post_study_plan.handler({}, None)['statusCode'] == 409
    assert tasks.get_task(old['plan_id'], 1)['completion_record']['record_id'] == saved['record_id']
    monkeypatch.setattr(plans, 'transact_write_items', original)
    assert generate('math')['tasks'][0]['completion_record']['record_id'] == saved['record_id']
    assert len(subjects[1]) == 2


def test_old_unqualified_cache_with_saved_record_can_be_restored(subjects):
    old = generate('math')
    saved = data(record(old['tasks'][0]))
    generate('japanese', 5)
    current = plans.get_plan(STUDENT.user_id, today_jst())
    subjects[0].Table('StudyPlans').update_item(
        Key={'student_id': STUDENT.user_id, 'plan_date': today_jst()},
        UpdateExpression='SET plan_versions = :versions',
        ExpressionAttributeValues={':versions': {'15': current['plan_versions']['math:15']}},
    )
    restored = generate('math')
    assert restored['plan_id'] == old['plan_id']
    assert restored['tasks'][0]['completion_record']['record_id'] == saved['record_id']
    assert len(subjects[1]) == 2


def test_implicit_generation_cannot_commit_after_explicit_choice(subjects, monkeypatch):
    original = service.generate_plan
    def changing(params, request_id):
        choose('japanese')  # Same time and actual subject, but a new explicit selection.
        return original(params, request_id)
    monkeypatch.setattr(service, 'generate_plan', changing)
    choose(None)
    assert post_study_plan.handler({}, None)['statusCode'] == 409
    assert subjects[0].Table('StudyTasks').scan()['Count'] == 0
