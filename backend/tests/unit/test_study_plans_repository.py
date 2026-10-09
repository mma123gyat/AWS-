from datetime import UTC, datetime, timedelta

import boto3
import pytest
from moto import mock_aws

from src.repositories import dynamodb_client, study_plans_repository, study_tasks_repository

STUDENT_ID = "student-1"
PLAN_DATE = "2026-01-01"


@pytest.fixture(autouse=True)
def _aws_credentials(monkeypatch):
    # Override real credentials/region that may be present in the dev shell
    # (moto intercepts all calls regardless, but this keeps the app code's
    # own region lookup — os.environ["AWS_REGION"] — consistent with the
    # region the test tables are created in below).
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_SECURITY_TOKEN", "testing")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "testing")
    monkeypatch.setenv("AWS_REGION", "ap-northeast-1")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "ap-northeast-1")


@pytest.fixture
def tables():
    with mock_aws():
        dynamodb_client.get_resource.cache_clear()
        dynamodb_client.get_client.cache_clear()

        client = boto3.client("dynamodb", region_name="ap-northeast-1")
        client.create_table(
            TableName="StudyPlans",
            KeySchema=[
                {"AttributeName": "student_id", "KeyType": "HASH"},
                {"AttributeName": "plan_date", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "student_id", "AttributeType": "S"},
                {"AttributeName": "plan_date", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        client.create_table(
            TableName="StudyTasks",
            KeySchema=[
                {"AttributeName": "plan_id", "KeyType": "HASH"},
                {"AttributeName": "task_order", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "plan_id", "AttributeType": "S"},
                {"AttributeName": "task_order", "AttributeType": "N"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        yield
        dynamodb_client.get_resource.cache_clear()
        dynamodb_client.get_client.cache_clear()


def _put_raw_plan(**fields) -> None:
    item = {"student_id": STUDENT_ID, "plan_date": PLAN_DATE, **fields}
    dynamodb_client.get_resource().Table("StudyPlans").put_item(Item=item)


def _put_raw_task(**fields) -> None:
    dynamodb_client.get_resource().Table("StudyTasks").put_item(Item=fields)


def _build_task(plan_id: str, task_order: int = 1) -> dict:
    return study_tasks_repository.build_task_item(
        plan_id=plan_id,
        student_id=STUDENT_ID,
        subject_id="math",
        unit_name="unit",
        task_order=task_order,
        title="title",
        description="description",
        planned_minutes=10,
        status="NOT_STARTED",
    )


def _complete(plan_id: str, owner_id: str, tasks: list[dict], created_at: str = "2026-01-01T00:00:00+00:00") -> dict:
    return study_plans_repository.complete_plan_with_tasks(
        student_id=STUDENT_ID,
        plan_date=PLAN_DATE,
        owner_id=owner_id,
        plan_id=plan_id,
        available_minutes=15,
        subject_id="math",
        title="title",
        reason="reason",
        generator="RULE",
        model_id="rule-based-v1",
        prompt_version="v1",
        tasks=tasks,
        created_at=created_at,
    )


# --- try_acquire_lock ---------------------------------------------------


def test_try_acquire_lock_succeeds_when_no_existing_item(tables):
    lock = study_plans_repository.try_acquire_lock(STUDENT_ID, PLAN_DATE, owner_id="req-1", stale_after_seconds=60)
    assert lock is not None
    assert lock["status"] == "GENERATING"
    assert lock["owner_id"] == "req-1"


def test_try_acquire_lock_never_overwrites_completed_plan_even_if_old(tables):
    ancient = (datetime.now(UTC) - timedelta(days=365)).isoformat()
    _put_raw_plan(status="COMPLETED", owner_id="req-0", updated_at=ancient, plan_id="old-plan")

    lock = study_plans_repository.try_acquire_lock(STUDENT_ID, PLAN_DATE, owner_id="req-1", stale_after_seconds=60)

    assert lock is None
    assert study_plans_repository.get_plan(STUDENT_ID, PLAN_DATE)["status"] == "COMPLETED"


def test_try_acquire_lock_never_overwrites_legacy_plan_without_status(tables):
    _put_raw_plan(plan_id="legacy-plan", title="legacy title")

    lock = study_plans_repository.try_acquire_lock(STUDENT_ID, PLAN_DATE, owner_id="req-1", stale_after_seconds=60)

    assert lock is None
    assert "status" not in study_plans_repository.get_plan(STUDENT_ID, PLAN_DATE)


def test_try_acquire_lock_succeeds_on_failed_plan(tables):
    _put_raw_plan(status="FAILED", owner_id="req-0", updated_at=datetime.now(UTC).isoformat())

    lock = study_plans_repository.try_acquire_lock(STUDENT_ID, PLAN_DATE, owner_id="req-1", stale_after_seconds=60)

    assert lock is not None
    assert lock["owner_id"] == "req-1"


def test_try_acquire_lock_fails_when_generating_and_not_stale(tables):
    _put_raw_plan(status="GENERATING", owner_id="req-0", updated_at=datetime.now(UTC).isoformat())

    lock = study_plans_repository.try_acquire_lock(STUDENT_ID, PLAN_DATE, owner_id="req-1", stale_after_seconds=60)

    assert lock is None


def test_try_acquire_lock_succeeds_when_generating_and_stale(tables):
    stale = (datetime.now(UTC) - timedelta(seconds=120)).isoformat()
    _put_raw_plan(status="GENERATING", owner_id="req-0", updated_at=stale)

    lock = study_plans_repository.try_acquire_lock(STUDENT_ID, PLAN_DATE, owner_id="req-1", stale_after_seconds=60)

    assert lock is not None
    assert lock["owner_id"] == "req-1"


# --- complete_plan_with_tasks -------------------------------------------


def test_complete_plan_with_tasks_persists_plan_and_tasks_together(tables):
    lock = study_plans_repository.try_acquire_lock(STUDENT_ID, PLAN_DATE, owner_id="req-1", stale_after_seconds=60)
    plan_id = lock["plan_id"]
    tasks = [_build_task(plan_id)]

    result = _complete(plan_id, "req-1", tasks)

    assert result["status"] == "COMPLETED"
    assert study_plans_repository.get_plan(STUDENT_ID, PLAN_DATE)["status"] == "COMPLETED"
    assert len(study_tasks_repository.list_tasks_by_plan(plan_id)) == 1


def test_complete_plan_with_tasks_rejects_mismatched_owner(tables):
    lock = study_plans_repository.try_acquire_lock(STUDENT_ID, PLAN_DATE, owner_id="req-1", stale_after_seconds=60)
    plan_id = lock["plan_id"]
    tasks = [_build_task(plan_id)]

    with pytest.raises(study_plans_repository.PlanLockLostError):
        _complete(plan_id, "a-different-owner", tasks)

    # Neither the plan nor the tasks were touched by the rejected attempt.
    assert study_plans_repository.get_plan(STUDENT_ID, PLAN_DATE)["status"] == "GENERATING"
    assert study_tasks_repository.list_tasks_by_plan(plan_id) == []


def test_complete_plan_with_tasks_rolls_back_everything_on_non_lock_failure(tables):
    lock = study_plans_repository.try_acquire_lock(STUDENT_ID, PLAN_DATE, owner_id="req-1", stale_after_seconds=60)
    plan_id = lock["plan_id"]
    task = _build_task(plan_id, task_order=1)
    conflicting_task = {**task, "task_id": "different-task-id"}  # same plan_id+task_order key

    with pytest.raises(study_plans_repository.PlanPersistenceError):
        _complete(plan_id, "req-1", [task, conflicting_task])

    # The whole transaction was rejected before anything committed: the plan
    # must still be GENERATING (not COMPLETED) and no task rows exist.
    assert study_plans_repository.get_plan(STUDENT_ID, PLAN_DATE)["status"] == "GENERATING"
    assert study_tasks_repository.list_tasks_by_plan(plan_id) == []


# --- fail_plan ------------------------------------------------------------


def test_fail_plan_marks_status_failed_when_owner_matches(tables):
    study_plans_repository.try_acquire_lock(STUDENT_ID, PLAN_DATE, owner_id="req-1", stale_after_seconds=60)

    study_plans_repository.fail_plan(STUDENT_ID, PLAN_DATE, owner_id="req-1")

    assert study_plans_repository.get_plan(STUDENT_ID, PLAN_DATE)["status"] == "FAILED"


def test_fail_plan_is_a_no_op_when_owner_does_not_match(tables):
    study_plans_repository.try_acquire_lock(STUDENT_ID, PLAN_DATE, owner_id="req-1", stale_after_seconds=60)

    study_plans_repository.fail_plan(STUDENT_ID, PLAN_DATE, owner_id="someone-else")

    assert study_plans_repository.get_plan(STUDENT_ID, PLAN_DATE)["status"] == "GENERATING"


# --- get_completed_plan ---------------------------------------------------


def test_get_completed_plan_returns_completed_plan(tables):
    _put_raw_plan(status="COMPLETED", plan_id="p1", title="t", reason="r", generator="RULE",
                  model_id="rule-based-v1", prompt_version="v1", subject_id="math", available_minutes=15)
    _put_raw_task(plan_id="p1", task_order=1, task_id="p1#1", title="t", description="d",
                  planned_minutes=10, status="NOT_STARTED")

    plan = study_plans_repository.get_completed_plan(STUDENT_ID, PLAN_DATE)

    assert plan is not None
    assert plan["status"] == "COMPLETED"


@pytest.mark.parametrize("status", ["GENERATING", "FAILED"])
def test_get_completed_plan_returns_none_for_unfinished_status(tables, status):
    _put_raw_plan(status=status, owner_id="req-1", updated_at=datetime.now(UTC).isoformat(), plan_id="p1")

    assert study_plans_repository.get_completed_plan(STUDENT_ID, PLAN_DATE) is None


def test_get_completed_plan_returns_well_formed_legacy_plan(tables):
    _put_raw_plan(plan_id="legacy-1", title="t", reason="r", generator="RULE", model_id="rule-based-v1",
                  prompt_version="v1", subject_id="math", available_minutes=15)
    _put_raw_task(plan_id="legacy-1", task_order=1, task_id="legacy-1#1", title="t", description="d",
                  planned_minutes=10, status="NOT_STARTED")

    plan = study_plans_repository.get_completed_plan(STUDENT_ID, PLAN_DATE)

    assert plan is not None
    assert plan["plan_id"] == "legacy-1"


def test_get_completed_plan_rejects_legacy_plan_with_no_tasks(tables):
    _put_raw_plan(plan_id="legacy-2", title="t", reason="r", generator="RULE", model_id="rule-based-v1",
                  prompt_version="v1", subject_id="math", available_minutes=15)

    assert study_plans_repository.get_completed_plan(STUDENT_ID, PLAN_DATE) is None


def test_get_completed_plan_rejects_legacy_plan_missing_required_fields(tables):
    _put_raw_plan(plan_id="legacy-3", title="t")  # missing reason/generator/model_id/etc.
    _put_raw_task(plan_id="legacy-3", task_order=1, task_id="legacy-3#1", title="t", description="d",
                  planned_minutes=10, status="NOT_STARTED")

    assert study_plans_repository.get_completed_plan(STUDENT_ID, PLAN_DATE) is None


def test_get_completed_plan_rejects_legacy_plan_with_invalid_task_order(tables):
    _put_raw_plan(plan_id="legacy-4", title="t", reason="r", generator="RULE", model_id="rule-based-v1",
                  prompt_version="v1", subject_id="math", available_minutes=15)
    _put_raw_task(plan_id="legacy-4", task_order=0, task_id="legacy-4#0", title="t", description="d",
                  planned_minutes=10, status="NOT_STARTED")

    assert study_plans_repository.get_completed_plan(STUDENT_ID, PLAN_DATE) is None


# --- ConsistentRead --------------------------------------------------------


def test_get_plan_uses_consistent_read(tables, monkeypatch):
    captured = {}
    real_table = dynamodb_client.get_resource().Table("StudyPlans")
    original_get_item = real_table.get_item

    def _spy_get_item(**kwargs):
        captured.update(kwargs)
        return original_get_item(**kwargs)

    monkeypatch.setattr(real_table, "get_item", _spy_get_item)
    monkeypatch.setattr(study_plans_repository, "_table", lambda: real_table)

    study_plans_repository.get_plan(STUDENT_ID, PLAN_DATE)

    assert captured.get("ConsistentRead") is True


def test_list_tasks_by_plan_uses_consistent_read(tables, monkeypatch):
    captured = {}
    real_table = dynamodb_client.get_resource().Table("StudyTasks")
    original_query = real_table.query

    def _spy_query(**kwargs):
        captured.update(kwargs)
        return original_query(**kwargs)

    monkeypatch.setattr(real_table, "query", _spy_query)
    monkeypatch.setattr(study_tasks_repository, "_table", lambda: real_table)

    study_tasks_repository.list_tasks_by_plan("some-plan-id")

    assert captured.get("ConsistentRead") is True
