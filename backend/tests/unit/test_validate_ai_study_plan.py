import os

import pytest

from scripts import validate_ai_study_plan as harness

UI_SELECTABLE_MINUTES = {5, 15, 30}


@pytest.fixture(autouse=True)
def _set_model_id(monkeypatch):
    monkeypatch.setenv("BEDROCK_MODEL_ID", "test-model-id")


def test_ten_conditions_with_unique_ids_and_required_keys():
    assert len(harness.CONDITIONS) == 10
    ids = [c["condition_id"] for c in harness.CONDITIONS]
    assert len(set(ids)) == 10
    required_keys = {
        "condition_id", "note", "grade", "subject", "school_topic",
        "student_topic", "understanding", "available_minutes", "ai_parameters",
    }
    for condition in harness.CONDITIONS:
        assert required_keys <= set(condition.keys())
        assert 1 <= condition["understanding"] <= 5
        assert set(condition["ai_parameters"].keys()) == {"difficulty", "volume", "supportLevel"}


def test_available_minutes_limited_to_ui_selectable_values():
    for condition in harness.CONDITIONS:
        assert condition["available_minutes"] in UI_SELECTABLE_MINUTES


def test_grades_are_centered_on_middle_school():
    middle_school_count = sum(1 for c in harness.CONDITIONS if c["grade"].startswith("中学"))
    assert middle_school_count >= 6


def _by_id(condition_id: str) -> dict:
    return next(c for c in harness.CONDITIONS if c["condition_id"] == condition_id)


def test_understanding_only_pair_P01_P02():
    p01, p02 = _by_id("P01"), _by_id("P02")
    for key in ("grade", "subject", "school_topic", "student_topic", "available_minutes", "ai_parameters"):
        assert p01[key] == p02[key]
    assert p01["understanding"] != p02["understanding"]


def test_minutes_only_trio_P04_P05_P06():
    p04, p05, p06 = _by_id("P04"), _by_id("P05"), _by_id("P06")
    for key in ("grade", "subject", "school_topic", "student_topic", "understanding", "ai_parameters"):
        assert p04[key] == p05[key] == p06[key]
    assert {p04["available_minutes"], p05["available_minutes"], p06["available_minutes"]} == {5, 15, 30}


def test_school_and_student_progress_differ_in_some_conditions():
    mismatched = [c for c in harness.CONDITIONS if c["school_topic"] != c["student_topic"]]
    assert len(mismatched) >= 2


def test_build_params_has_keys_required_by_services():
    params = harness.build_params(_by_id("P01"))
    assert set(params.keys()) == {
        "grade", "subject", "school_topic", "student_topic",
        "understanding", "available_minutes", "ai_parameters",
    }


def test_condition_hash_stable_for_identical_inputs():
    condition = _by_id("P01")
    h1 = harness.condition_hash(condition, "MOCK", "model-a", "v1")
    h2 = harness.condition_hash(condition, "MOCK", "model-a", "v1")
    assert h1 == h2


def test_condition_hash_changes_with_model_id():
    condition = _by_id("P01")
    h1 = harness.condition_hash(condition, "REAL", "model-a", "v1")
    h2 = harness.condition_hash(condition, "REAL", "model-b", "v1")
    assert h1 != h2


def test_condition_hash_changes_with_prompt_version():
    condition = _by_id("P01")
    h1 = harness.condition_hash(condition, "REAL", "model-a", "v1")
    h2 = harness.condition_hash(condition, "REAL", "model-a", "v2")
    assert h1 != h2


def test_condition_hash_changes_between_mock_and_real():
    condition = _by_id("P01")
    h1 = harness.condition_hash(condition, "MOCK", "model-a", "v1")
    h2 = harness.condition_hash(condition, "REAL", "model-a", "v1")
    assert h1 != h2


VALID_PLAN = {
    "subject": "数学",
    "title": "テスト",
    "total_minutes": 15,
    "reason": "テスト用の理由です。",
    "tasks": [
        {"order": 1, "title": "確認", "minutes": 15, "description": "説明。"},
    ],
}

PARAMS = {
    "grade": "中学1年",
    "subject": "数学",
    "school_topic": "正負の数",
    "student_topic": "正負の数",
    "understanding": 3,
    "available_minutes": 15,
    "ai_parameters": {"difficulty": 3, "volume": 3, "supportLevel": 3},
}


def test_auto_checks_pass_for_compliant_plan():
    checks = harness.auto_checks(PARAMS, VALID_PLAN)
    assert checks["auto_check_summary"] == "PASS"
    assert all(v for k, v in checks.items() if k != "auto_check_summary")


def test_auto_checks_fail_when_total_minutes_exceeds_available():
    over_budget = {**VALID_PLAN, "total_minutes": 999}
    checks = harness.auto_checks(PARAMS, over_budget)
    assert checks["auto_check_summary"] == "FAIL"
    assert checks["auto_time_within_available"] is False


def test_reference_signals_flag_forbidden_phrase_without_affecting_auto_checks():
    condition = _by_id("P01")
    plan_with_forbidden_word = {**VALID_PLAN, "reason": "学校の進度に遅れています。"}
    refs = harness.reference_signals(condition, plan_with_forbidden_word)
    assert refs["ref_forbidden_phrase_hit"] is True
    assert "遅れ" in refs["ref_forbidden_phrase_matches"]
    # auto_checks never looks at ref_* signals or plan text content.
    checks = harness.auto_checks(PARAMS, plan_with_forbidden_word)
    assert checks["auto_check_summary"] == "PASS"


def test_reference_signals_detect_student_topic_mention():
    condition = _by_id("P01")
    plan_mentioning_topic = {**VALID_PLAN, "title": "正負の数の復習プラン"}
    refs = harness.reference_signals(condition, plan_mentioning_topic)
    assert refs["ref_student_topic_mentioned"] is True


def test_build_row_marks_human_columns_na_for_mock_mode():
    condition = _by_id("P01")
    result = {
        "plan": VALID_PLAN, "run_mode": "MOCK", "invocation_type": "NEW_GENERATION",
        "generator": "BEDROCK", "model_id": harness.MOCK_MODEL_ID, "prompt_version": "v2-teacher-parameters",
        "generated_at": "2026-01-01T00:00:00+00:00", "evaluated_at": "2026-01-01T00:00:00+00:00",
    }
    row = harness.build_row(condition, PARAMS, result)
    for column in harness.HUMAN_COLUMNS:
        assert row[column] == "N/A(MOCK)"


def test_build_row_leaves_human_columns_blank_for_real_mode():
    condition = _by_id("P01")
    result = {
        "plan": VALID_PLAN, "run_mode": "REAL", "invocation_type": "NEW_GENERATION",
        "generator": "BEDROCK", "model_id": "real-model", "prompt_version": "v2-teacher-parameters",
        "generated_at": "2026-01-01T00:00:00+00:00", "evaluated_at": "2026-01-01T00:00:00+00:00",
    }
    row = harness.build_row(condition, PARAMS, result)
    for column in harness.HUMAN_COLUMNS:
        assert row[column] == ""


def test_run_condition_reuses_cache_without_calling_generate_plan(monkeypatch):
    condition = _by_id("P01")
    calls = []

    def _fake_generate_plan(params, request_id):
        calls.append(request_id)
        return {**VALID_PLAN, "generator": "BEDROCK", "model_id": harness.MOCK_MODEL_ID, "prompt_version": "v2-teacher-parameters"}

    monkeypatch.setattr(harness.study_plan_service, "generate_plan", _fake_generate_plan)

    cache = {}
    first = harness.run_condition(condition, "MOCK", cache, force=False)
    assert first["invocation_type"] == "NEW_GENERATION"
    assert len(calls) == 1

    second = harness.run_condition(condition, "MOCK", cache, force=False)
    assert second["invocation_type"] == "CACHED_REUSE"
    assert len(calls) == 1  # no second call to generate_plan


def test_run_condition_recomputes_when_model_id_changes(monkeypatch):
    condition = _by_id("P01")
    calls = []

    def _fake_generate_plan(params, request_id):
        calls.append(request_id)
        return {**VALID_PLAN, "generator": "BEDROCK", "model_id": os.environ.get("BEDROCK_MODEL_ID"), "prompt_version": "v2-teacher-parameters"}

    monkeypatch.setattr(harness.study_plan_service, "generate_plan", _fake_generate_plan)

    cache = {}
    harness.run_condition(condition, "REAL", cache, force=False)
    assert len(calls) == 1

    monkeypatch.setenv("BEDROCK_MODEL_ID", "a-different-model")
    harness.run_condition(condition, "REAL", cache, force=False)
    assert len(calls) == 2  # different model id => cache miss, real call happens again


def test_mock_fallback_conditions_trigger_rule_generator():
    """The two designated fallback conditions must route through RULE when
    run through the real bedrock_service + study_plan_service pipeline with
    the mock client installed, proving the harness exercises an exception
    type bedrock_service actually catches (not a made-up one)."""
    from src.services import bedrock_service, study_plan_service

    original_client = bedrock_service._client
    try:
        for condition_id in harness.MOCK_FALLBACK_CONDITIONS:
            condition = next(c for c in harness.CONDITIONS if c["condition_id"] == condition_id)
            bedrock_service._client = harness._mock_client_factory(condition)
            params = harness.build_params(condition)
            plan = study_plan_service.generate_plan(params, request_id=f"test-{condition_id}")
            assert plan["generator"] == "RULE"
    finally:
        bedrock_service._client = original_client


def test_mock_valid_conditions_produce_schema_valid_bedrock_plan():
    from src.models.study_plan_schema import validate_study_plan_output
    from src.services import bedrock_service

    original_client = bedrock_service._client
    try:
        for condition in harness.CONDITIONS:
            if condition["condition_id"] in harness.MOCK_FALLBACK_CONDITIONS:
                continue
            params = harness.build_params(condition)
            bedrock_service._client = harness._mock_client_factory(condition)
            plan = bedrock_service.generate_study_plan(params)
            validate_study_plan_output(plan)  # must not raise
            assert plan["total_minutes"] <= params["available_minutes"]
    finally:
        bedrock_service._client = original_client


class _StubMeta:
    def __init__(self, region_name):
        self.region_name = region_name


class _StubBedrockClient:
    def __init__(self, region_name):
        self.meta = _StubMeta(region_name)


class _StubStsClient:
    def __init__(self, account):
        self._account = account

    def get_caller_identity(self):
        return {"Account": self._account, "Arn": f"arn:aws:iam::{self._account}:user/test"}


def test_verify_safety_preconditions_aborts_on_region_mismatch(monkeypatch):
    monkeypatch.setattr(harness.bedrock_service, "_client", lambda: _StubBedrockClient("us-east-1"))

    def _fail_if_called(*args, **kwargs):
        raise AssertionError("sts must not be called when region already mismatches")

    monkeypatch.setattr(harness.boto3, "client", _fail_if_called)

    with pytest.raises(SystemExit) as exc_info:
        harness.verify_safety_preconditions()
    message = str(exc_info.value)
    assert "us-east-1" in message
    assert harness.EXPECTED_AWS_REGION in message


def test_verify_safety_preconditions_aborts_on_account_mismatch(monkeypatch):
    monkeypatch.setattr(harness.bedrock_service, "_client", lambda: _StubBedrockClient(harness.EXPECTED_AWS_REGION))
    monkeypatch.setattr(harness.boto3, "client", lambda *a, **kw: _StubStsClient("999999999999"))

    with pytest.raises(SystemExit) as exc_info:
        harness.verify_safety_preconditions()
    message = str(exc_info.value)
    assert "999999999999" in message
    assert harness.EXPECTED_AWS_ACCOUNT_ID in message


def test_verify_safety_preconditions_passes_when_region_and_account_match(monkeypatch):
    monkeypatch.setattr(harness.bedrock_service, "_client", lambda: _StubBedrockClient(harness.EXPECTED_AWS_REGION))
    monkeypatch.setattr(harness.boto3, "client", lambda *a, **kw: _StubStsClient(harness.EXPECTED_AWS_ACCOUNT_ID))

    harness.verify_safety_preconditions()  # must not raise


def test_mode_real_gate_runs_safety_check_before_any_bedrock_call(monkeypatch):
    """Account mismatch must abort main() before the for-CONDITIONS loop that
    is the only path reaching a real Bedrock call. The region-matching stub
    has no .converse(), so if the gate failed to short-circuit, main() would
    raise AttributeError instead of the expected SystemExit."""
    monkeypatch.setattr(harness.bedrock_service, "_client", lambda: _StubBedrockClient(harness.EXPECTED_AWS_REGION))
    monkeypatch.setattr(harness.boto3, "client", lambda *a, **kw: _StubStsClient("999999999999"))
    monkeypatch.setattr("sys.argv", ["validate_ai_study_plan", "--mode", "real"])

    with pytest.raises(SystemExit):
        harness.main()


def test_build_summary_counts_bedrock_and_rule_separately():
    rows = [
        {"generator": "BEDROCK", "invocation_type": "NEW_GENERATION", "run_mode": "MOCK", "auto_check_summary": "PASS", "condition_id": "P01"},
        {"generator": "BEDROCK", "invocation_type": "CACHED_REUSE", "run_mode": "MOCK", "auto_check_summary": "PASS", "condition_id": "P02"},
        {"generator": "RULE", "invocation_type": "NEW_GENERATION", "run_mode": "MOCK", "auto_check_summary": "FAIL", "condition_id": "P03"},
    ]
    summary = harness.build_summary(rows)
    assert "Bedrock生成件数: 2" in summary
    assert "RULEフォールバック件数: 1" in summary
    assert "新規生成: 2" in summary
    assert "キャッシュ再利用: 1" in summary
    assert "P03" in summary
