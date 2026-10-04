import os
from typing import Any

from src.models.enums import PlanGenerator
from src.repositories.curriculums_repository import get_curriculum
from src.repositories.school_classes_repository import get_class_by_id
from src.repositories.student_progresses_repository import list_progresses_by_student
from src.repositories.study_plans_repository import (
    PlanLockLostError,
    complete_plan_with_tasks,
    fail_plan,
    get_completed_plan,
    try_acquire_lock,
)
from src.repositories.study_tasks_repository import build_task_item, list_tasks_by_plan
from src.repositories.subjects_repository import get_subject_by_id
from src.repositories.users_repository import get_user_by_id
from src.services.bedrock_service import PROMPT_VERSION, BedrockGenerationError, generate_study_plan
from src.services.rule_based_plan_service import generate_rule_based_plan
from src.utils.dates import today_jst
from src.utils.errors import ConflictError, ValidationError
from src.utils.logger import log_event

RULE_BASED_MODEL_ID = "rule-based-v1"

# The Lambda timeout is 30s (infrastructure/lib/api-stack.ts). If an
# invocation is killed by that timeout it never gets to call fail_plan, so
# the row is stuck at GENERATING. The stale threshold must comfortably
# exceed the max execution time so we never steal a lock from an attempt
# that might still legitimately be running.
STALE_LOCK_SECONDS = 90


def generate_plan(params: dict[str, Any], request_id: str) -> dict:
    """Tries Bedrock first; on any failure, logs it (never silently swallowed)
    and falls back to the deterministic rule-based plan so the feature keeps
    working even when Bedrock is down or returns something unusable.
    """
    try:
        plan = generate_study_plan(params)
        generator = PlanGenerator.BEDROCK
        model_id = os.environ.get("BEDROCK_MODEL_ID", "unknown")
    except BedrockGenerationError as exc:
        log_event(
            request_id,
            "study_plan_service.generate_plan.bedrock_fallback",
            "FAILURE",
            0,
            {"error": str(exc)},
        )
        plan = generate_rule_based_plan(params)
        generator = PlanGenerator.RULE
        model_id = RULE_BASED_MODEL_ID

    return {
        **plan,
        "generator": generator.value,
        "model_id": model_id,
        "prompt_version": PROMPT_VERSION,
    }


def generate_plan_for_student(student_id: str, available_minutes: int, request_id: str) -> dict:
    """Orchestrates the full student study-plan flow with a per-day lock so:
    a completed plan is reused rather than regenerated, concurrent requests
    never produce duplicate plans, and a failed/timed-out attempt can be
    retried by a later request.

    MVP simplification: a student may have progress rows for several
    subjects, but this picks the first one — multi-subject prioritization is
    deferred to Phase 2.
    """
    today = today_jst()

    existing = get_completed_plan(student_id, today)
    if existing:
        return {**existing, "tasks": list_tasks_by_plan(existing["plan_id"])}

    lock = try_acquire_lock(student_id, today, owner_id=request_id, stale_after_seconds=STALE_LOCK_SECONDS)
    if lock is None:
        # Someone else is generating (or just finished) — re-check instead of
        # failing outright, so a race that completed in between is served.
        refreshed = get_completed_plan(student_id, today)
        if refreshed:
            return {**refreshed, "tasks": list_tasks_by_plan(refreshed["plan_id"])}
        raise ConflictError("学習プランを生成中です。しばらく待ってから再試行してください。")

    plan_id = lock["plan_id"]

    try:
        progresses = list_progresses_by_student(student_id)
        if not progresses:
            raise ValidationError("まだ学習の現在地が設定されていません。先生に設定してもらってください。")
        progress = progresses[0]

        student = get_user_by_id(student_id)
        if not student or not student.get("class_id"):
            raise ValidationError("クラス情報が設定されていません。")

        curriculum = get_curriculum(student["class_id"], progress["subject_id"])
        if not curriculum:
            raise ValidationError("学校の授業進度がまだ登録されていません。")

        school_class = get_class_by_id(student["class_id"])
        subject = get_subject_by_id(progress["subject_id"])

        params = {
            "grade": school_class["grade"] if school_class else "",
            "subject": subject["name"] if subject else progress["subject_id"],
            "school_topic": curriculum["unit_name"],
            "student_topic": progress["unit_name"],
            "understanding": int(progress["understanding"]),
            "available_minutes": available_minutes,
        }

        plan = generate_plan(params, request_id)

        task_items = [
            build_task_item(
                plan_id=plan_id,
                student_id=student_id,
                subject_id=progress["subject_id"],
                unit_name=progress["unit_name"],
                task_order=task["order"],
                title=task["title"],
                description=task["description"],
                planned_minutes=task["minutes"],
                status="NOT_STARTED",
            )
            for task in plan["tasks"]
        ]

        plan_item = complete_plan_with_tasks(
            student_id=student_id,
            plan_date=today,
            owner_id=request_id,
            plan_id=plan_id,
            available_minutes=available_minutes,
            subject_id=progress["subject_id"],
            title=plan["title"],
            reason=plan["reason"],
            generator=plan["generator"],
            model_id=plan["model_id"],
            prompt_version=plan["prompt_version"],
            tasks=task_items,
        )
    except PlanLockLostError:
        # Our lock was already superseded (timeout takeover) before we could
        # persist the result. We no longer own the row, so fail_plan would
        # just no-op — re-check instead, the newer attempt may have already
        # completed it.
        refreshed = get_completed_plan(student_id, today)
        if refreshed:
            return {**refreshed, "tasks": list_tasks_by_plan(refreshed["plan_id"])}
        raise ConflictError("学習プランを生成中です。しばらく待ってから再試行してください。")
    except Exception as exc:
        # Mark the row FAILED so the next request can retry. The cleanup
        # itself must never swallow the original failure: log it and still
        # re-raise `exc`, never the cleanup exception.
        try:
            fail_plan(student_id, today, owner_id=request_id)
        except Exception as cleanup_exc:
            log_event(
                request_id,
                "study_plan_service.generate_plan_for_student.fail_plan_error",
                "FAILURE",
                0,
                {"error": str(cleanup_exc)},
            )
        raise exc

    return {**plan_item, "tasks": task_items}
