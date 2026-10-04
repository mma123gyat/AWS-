import pytest
from botocore.exceptions import ConnectTimeoutError, ReadTimeoutError

from src.repositories.study_plans_repository import PlanLockLostError, PlanPersistenceError
from src.services import bedrock_service, study_plan_service
from src.services.bedrock_service import BedrockGenerationError
from src.utils.errors import ConflictError, ValidationError

BASE_PARAMS = {
    "grade": "中学2年",
    "subject": "数学",
    "school_topic": "一次関数",
    "student_topic": "比例・反比例",
    "understanding": 3,
    "available_minutes": 15,
}

VALID_BEDROCK_PLAN = {
    "subject": "数学",
    "title": "比例・反比例の復習",
    "total_minutes": 15,
    "reason": "理由",
    "tasks": [{"order": 1, "title": "確認", "minutes": 15, "description": "説明"}],
}


def test_uses_bedrock_result_when_available(monkeypatch):
    monkeypatch.setattr(study_plan_service, "generate_study_plan", lambda params: VALID_BEDROCK_PLAN)
    plan = study_plan_service.generate_plan(BASE_PARAMS, request_id="test-1")
    assert plan["generator"] == "BEDROCK"
    assert plan["total_minutes"] == 15


def test_falls_back_to_rule_based_on_bedrock_error(monkeypatch):
    def _raise(params):
        raise BedrockGenerationError("boom")

    monkeypatch.setattr(study_plan_service, "generate_study_plan", _raise)
    plan = study_plan_service.generate_plan(BASE_PARAMS, request_id="test-2")
    assert plan["generator"] == "RULE"
    assert plan["total_minutes"] <= BASE_PARAMS["available_minutes"]


@pytest.mark.parametrize("timeout_type", [ConnectTimeoutError, ReadTimeoutError])
def test_sdk_timeout_falls_back_to_rule_based_and_logs_failure(monkeypatch, timeout_type):
    monkeypatch.setenv("BEDROCK_MODEL_ID", "test-model")

    class _TimeoutClient:
        def converse(self, **kwargs):
            raise timeout_type(endpoint_url="https://bedrock.invalid")

    monkeypatch.setattr(bedrock_service, "_client", lambda: _TimeoutClient())
    logged = []
    monkeypatch.setattr(study_plan_service, "log_event", lambda *args: logged.append(args))

    plan = study_plan_service.generate_plan(BASE_PARAMS, request_id="timeout-request")

    assert plan == {
        **study_plan_service.generate_rule_based_plan(BASE_PARAMS),
        "generator": "RULE",
        "model_id": "rule-based-v1",
        "prompt_version": bedrock_service.PROMPT_VERSION,
    }
    assert len(logged) == 1
    assert logged[0][:3] == (
        "timeout-request", "study_plan_service.generate_plan.bedrock_fallback", "FAILURE"
    )
    assert "Bedrock呼び出しに失敗しました" in logged[0][4]["error"]


def _wire_full_generation_chain(monkeypatch, *, complete_plan_with_tasks=None):
    """Wires every dependency generate_plan_for_student needs to reach
    complete_plan_with_tasks successfully, so tests only need to override the
    lock/completion-related pieces they care about.
    """
    monkeypatch.setattr(
        study_plan_service,
        "list_progresses_by_student",
        lambda student_id: [{"subject_id": "math", "unit_name": "unit", "understanding": 3}],
    )
    monkeypatch.setattr(study_plan_service, "get_user_by_id", lambda student_id: {"class_id": "class-1"})
    monkeypatch.setattr(
        study_plan_service, "get_curriculum", lambda class_id, subject_id: {"unit_name": "school-unit"}
    )
    monkeypatch.setattr(study_plan_service, "get_class_by_id", lambda class_id: {"grade": "grade-1"})
    monkeypatch.setattr(study_plan_service, "get_subject_by_id", lambda subject_id: {"name": "math"})
    monkeypatch.setattr(
        study_plan_service,
        "generate_plan",
        lambda params, request_id: {
            "title": "title",
            "reason": "reason",
            "tasks": [{"order": 1, "title": "t", "description": "d", "minutes": 10}],
            "generator": "RULE",
            "model_id": "rule-based-v1",
            "prompt_version": "v1",
        },
    )
    monkeypatch.setattr(study_plan_service, "build_task_item", lambda **kwargs: {"task_id": "task-1"})
    if complete_plan_with_tasks is not None:
        monkeypatch.setattr(study_plan_service, "complete_plan_with_tasks", complete_plan_with_tasks)


def test_reuses_existing_completed_plan_without_generating(monkeypatch):
    existing_plan = {"plan_id": "plan-1", "status": "COMPLETED"}
    monkeypatch.setattr(study_plan_service, "get_completed_plan", lambda *a, **k: existing_plan)
    monkeypatch.setattr(study_plan_service, "list_tasks_by_plan", lambda plan_id: [{"task_id": "task-1"}])

    def _fail_if_called(*a, **k):
        raise AssertionError("must not try to acquire a lock when a completed plan already exists")

    monkeypatch.setattr(study_plan_service, "try_acquire_lock", _fail_if_called)

    result = study_plan_service.generate_plan_for_student("student-1", 15, "req-1")

    assert result["plan_id"] == "plan-1"
    assert result["tasks"] == [{"task_id": "task-1"}]


def test_raises_conflict_when_lock_busy_and_no_completed_plan(monkeypatch):
    monkeypatch.setattr(study_plan_service, "get_completed_plan", lambda *a, **k: None)
    monkeypatch.setattr(study_plan_service, "try_acquire_lock", lambda *a, **k: None)

    with pytest.raises(ConflictError):
        study_plan_service.generate_plan_for_student("student-1", 15, "req-1")


def test_does_not_call_generate_plan_when_lock_is_busy(monkeypatch):
    """Guards the concurrency guarantee directly: when another request holds
    the lock, Bedrock/the rule-based fallback (both behind generate_plan)
    must never run — not just that a ConflictError happens to come out.
    """
    monkeypatch.setattr(study_plan_service, "get_completed_plan", lambda *a, **k: None)
    monkeypatch.setattr(study_plan_service, "try_acquire_lock", lambda *a, **k: None)

    call_count = {"n": 0}

    def _spy(*a, **k):
        call_count["n"] += 1
        raise AssertionError("generate_plan must not run while another request holds the lock")

    monkeypatch.setattr(study_plan_service, "generate_plan", _spy)

    with pytest.raises(ConflictError):
        study_plan_service.generate_plan_for_student("student-1", 15, "req-1")

    assert call_count["n"] == 0


def test_returns_plan_completed_by_another_request_after_lock_conflict(monkeypatch):
    completed_plan = {"plan_id": "plan-1", "status": "COMPLETED"}
    call_count = {"n": 0}

    def _get_completed_plan(*a, **k):
        call_count["n"] += 1
        return None if call_count["n"] == 1 else completed_plan

    monkeypatch.setattr(study_plan_service, "get_completed_plan", _get_completed_plan)
    monkeypatch.setattr(study_plan_service, "try_acquire_lock", lambda *a, **k: None)
    monkeypatch.setattr(study_plan_service, "list_tasks_by_plan", lambda plan_id: [])

    result = study_plan_service.generate_plan_for_student("student-1", 15, "req-1")

    assert result["plan_id"] == "plan-1"
    assert call_count["n"] == 2


def test_marks_plan_failed_and_reraises_original_exception_on_generation_error(monkeypatch):
    monkeypatch.setattr(study_plan_service, "get_completed_plan", lambda *a, **k: None)
    monkeypatch.setattr(study_plan_service, "try_acquire_lock", lambda *a, **k: {"plan_id": "plan-1"})

    def _raise_validation_error(student_id):
        raise ValidationError("まだ学習の現在地が設定されていません。先生に設定してもらってください。")

    monkeypatch.setattr(study_plan_service, "list_progresses_by_student", _raise_validation_error)

    fail_calls = []
    monkeypatch.setattr(
        study_plan_service, "fail_plan", lambda *a, **k: fail_calls.append((a, k))
    )

    with pytest.raises(ValidationError):
        study_plan_service.generate_plan_for_student("student-1", 15, "req-1")

    assert len(fail_calls) == 1
    args, kwargs = fail_calls[0]
    assert args[0] == "student-1"
    assert kwargs["owner_id"] == "req-1"


def test_lock_lost_during_persistence_returns_concurrently_completed_plan(monkeypatch):
    completed_plan = {"plan_id": "plan-1", "status": "COMPLETED"}
    call_count = {"n": 0}

    def _get_completed_plan(*a, **k):
        call_count["n"] += 1
        return None if call_count["n"] == 1 else completed_plan

    monkeypatch.setattr(study_plan_service, "get_completed_plan", _get_completed_plan)
    monkeypatch.setattr(study_plan_service, "try_acquire_lock", lambda *a, **k: {"plan_id": "plan-1"})
    monkeypatch.setattr(study_plan_service, "list_tasks_by_plan", lambda plan_id: [])

    def _lock_lost(**kwargs):
        raise PlanLockLostError("lock superseded")

    _wire_full_generation_chain(monkeypatch, complete_plan_with_tasks=_lock_lost)

    fail_calls = []
    monkeypatch.setattr(study_plan_service, "fail_plan", lambda *a, **k: fail_calls.append((a, k)))

    result = study_plan_service.generate_plan_for_student("student-1", 15, "req-1")

    assert result["plan_id"] == "plan-1"
    assert fail_calls == []  # we no longer own the row — fail_plan must not run


def test_lock_lost_during_persistence_raises_conflict_when_no_completed_plan(monkeypatch):
    monkeypatch.setattr(study_plan_service, "get_completed_plan", lambda *a, **k: None)
    monkeypatch.setattr(study_plan_service, "try_acquire_lock", lambda *a, **k: {"plan_id": "plan-1"})
    monkeypatch.setattr(study_plan_service, "list_tasks_by_plan", lambda plan_id: [])

    def _lock_lost(**kwargs):
        raise PlanLockLostError("lock superseded")

    _wire_full_generation_chain(monkeypatch, complete_plan_with_tasks=_lock_lost)

    fail_calls = []
    monkeypatch.setattr(study_plan_service, "fail_plan", lambda *a, **k: fail_calls.append((a, k)))

    with pytest.raises(ConflictError):
        study_plan_service.generate_plan_for_student("student-1", 15, "req-1")

    assert fail_calls == []


def test_fail_plan_failure_is_logged_but_does_not_hide_original_exception(monkeypatch):
    monkeypatch.setattr(study_plan_service, "get_completed_plan", lambda *a, **k: None)
    monkeypatch.setattr(study_plan_service, "try_acquire_lock", lambda *a, **k: {"plan_id": "plan-1"})

    def _raise_validation_error(student_id):
        raise ValidationError("original failure")

    monkeypatch.setattr(study_plan_service, "list_progresses_by_student", _raise_validation_error)

    def _fail_plan_raises(*a, **k):
        raise RuntimeError("dynamodb unavailable")

    monkeypatch.setattr(study_plan_service, "fail_plan", _fail_plan_raises)

    logged = []
    monkeypatch.setattr(study_plan_service, "log_event", lambda *a, **k: logged.append((a, k)))

    with pytest.raises(ValidationError, match="original failure"):
        study_plan_service.generate_plan_for_student("student-1", 15, "req-1")

    assert len(logged) == 1


def test_successful_generation_persists_plan_and_tasks_via_single_transaction(monkeypatch):
    monkeypatch.setattr(study_plan_service, "get_completed_plan", lambda *a, **k: None)
    monkeypatch.setattr(study_plan_service, "try_acquire_lock", lambda *a, **k: {"plan_id": "plan-1"})

    captured = {}

    def _complete_plan_with_tasks(**kwargs):
        captured.update(kwargs)
        return {"plan_id": "plan-1", "status": "COMPLETED"}

    _wire_full_generation_chain(monkeypatch, complete_plan_with_tasks=_complete_plan_with_tasks)

    result = study_plan_service.generate_plan_for_student("student-1", 15, "req-1")

    assert result["plan_id"] == "plan-1"
    assert captured["owner_id"] == "req-1"
    assert captured["plan_id"] == "plan-1"
    assert len(captured["tasks"]) == 1


@pytest.mark.parametrize("save_fails", [False, True])
def test_timeout_fallback_reaches_save_and_cleans_up_on_save_failure(monkeypatch, save_fails):
    plan_date = "2026-01-01"
    monkeypatch.setattr(study_plan_service, "today_jst", lambda: plan_date)
    real_generate_plan = study_plan_service.generate_plan
    real_build_task_item = study_plan_service.build_task_item
    monkeypatch.setenv("BEDROCK_MODEL_ID", "test-model")
    monkeypatch.setattr(study_plan_service, "get_completed_plan", lambda *a, **k: None)
    monkeypatch.setattr(study_plan_service, "try_acquire_lock", lambda *a, **k: {"plan_id": "plan-1"})
    captured = {}
    persistence_error = PlanPersistenceError("save failed")

    def _complete_plan_with_tasks(**kwargs):
        captured.update(kwargs)
        if save_fails:
            raise persistence_error
        return {"plan_id": "plan-1", "status": "COMPLETED", "generator": kwargs["generator"]}

    _wire_full_generation_chain(monkeypatch, complete_plan_with_tasks=_complete_plan_with_tasks)
    monkeypatch.setattr(study_plan_service, "generate_plan", real_generate_plan)
    monkeypatch.setattr(study_plan_service, "build_task_item", real_build_task_item)

    class _TimeoutClient:
        def converse(self, **kwargs):
            raise ReadTimeoutError(endpoint_url="https://bedrock.invalid")

    monkeypatch.setattr(bedrock_service, "_client", lambda: _TimeoutClient())
    fail_calls = []
    monkeypatch.setattr(study_plan_service, "fail_plan", lambda *a, **k: fail_calls.append((a, k)))

    if save_fails:
        with pytest.raises(PlanPersistenceError) as exc_info:
            study_plan_service.generate_plan_for_student("student-1", 15, "timeout-request")
        assert exc_info.value is persistence_error
        assert fail_calls == [(("student-1", plan_date), {"owner_id": "timeout-request"})]
    else:
        result = study_plan_service.generate_plan_for_student("student-1", 15, "timeout-request")
        assert result["status"] == "COMPLETED"
        assert result["generator"] == "RULE"
        assert result["tasks"] == captured["tasks"]
        assert fail_calls == []

    assert captured["generator"] == "RULE"
    assert captured["model_id"] == "rule-based-v1"
    assert captured["owner_id"] == "timeout-request"
    assert captured["tasks"]
    assert sum(task["planned_minutes"] for task in captured["tasks"]) <= 15
