import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any

from botocore.exceptions import ClientError

from src.repositories import study_tasks_repository
from src.repositories.dynamodb_client import table, table_name as _resolve_table_name, to_attribute_map, transact_write_items

_TABLE_ENV = "STUDY_PLANS_TABLE_NAME"
_TABLE_DEFAULT = "StudyPlans"

_REQUIRED_LEGACY_PLAN_FIELDS = (
    "plan_id",
    "title",
    "reason",
    "generator",
    "model_id",
    "prompt_version",
    "subject_id",
)
_REQUIRED_LEGACY_TASK_FIELDS = ("task_id", "task_order", "title", "description", "planned_minutes", "status")


class PlanLockLostError(Exception):
    """Raised when complete_plan_with_tasks' owner_id/status=GENERATING condition
    on the plan row failed — a newer attempt already holds (or has finished) the
    lock. Callers must not call fail_plan in response to this; they no longer
    own the row.
    """


class PlanPersistenceError(Exception):
    """Raised when the transactional save fails for a reason other than losing
    the lock (e.g. a task write was rejected, throttling, validation). Callers
    may treat this as an ordinary generation failure (fail_plan applies).
    """


def _table():
    return table(_TABLE_ENV, _TABLE_DEFAULT)


def table_name() -> str:
    return _resolve_table_name(_TABLE_ENV, _TABLE_DEFAULT)


def get_plan(student_id: str, plan_date: str) -> dict[str, Any] | None:
    response = _table().get_item(
        Key={"student_id": student_id, "plan_date": plan_date},
        ConsistentRead=True,
    )
    return response.get("Item")


def _is_well_formed_legacy_task(task: dict[str, Any]) -> bool:
    if any(task.get(field) in (None, "") for field in _REQUIRED_LEGACY_TASK_FIELDS):
        return False
    order = task.get("task_order")
    if not isinstance(order, (int, Decimal)) or order <= 0:
        return False
    minutes = task.get("planned_minutes")
    if not isinstance(minutes, (int, Decimal)) or minutes <= 0:
        return False
    return True


def _is_well_formed_legacy_plan(item: dict[str, Any]) -> bool:
    """A plan written before `status` existed is implicitly COMPLETED, but we
    must not trust that blindly: verify it still has everything a completed
    plan needs before treating it as reusable/displayable.
    """
    if any(not item.get(field) for field in _REQUIRED_LEGACY_PLAN_FIELDS):
        return False
    available_minutes = item.get("available_minutes")
    if not isinstance(available_minutes, (int, Decimal)) or available_minutes <= 0:
        return False
    tasks = study_tasks_repository.list_tasks_by_plan(item["plan_id"])
    if not tasks:
        return False
    return all(_is_well_formed_legacy_task(task) for task in tasks)


def get_completed_plan(student_id: str, plan_date: str) -> dict[str, Any] | None:
    item = get_plan(student_id, plan_date)
    if item is None:
        return None

    status = item.get("status")
    if status == "COMPLETED":
        return item
    if status is not None:
        # GENERATING or FAILED — never show an unfinished plan as completed.
        return None

    # Legacy row written before `status` existed. Treat as COMPLETED only if
    # it is actually well-formed; never report incomplete data as finished.
    if not _is_well_formed_legacy_plan(item):
        return None
    return item


def try_acquire_lock(
    student_id: str, plan_date: str, owner_id: str, stale_after_seconds: int
) -> dict[str, Any] | None:
    """Attempts to become the exclusive generator for this student/day.

    Succeeds only if: no plan exists yet, the existing plan FAILED, or the
    existing plan is GENERATING but its lease (`updated_at`) is older than
    `stale_after_seconds` (the previous attempt likely crashed or timed out).
    A COMPLETED plan — or a legacy plan with no `status` attribute at all —
    never matches, so it is never overwritten.
    """
    now = datetime.now(UTC)
    now_iso = now.isoformat()
    stale_threshold = (now - timedelta(seconds=stale_after_seconds)).isoformat()
    plan_id = str(uuid.uuid4())

    item = {
        "student_id": student_id,
        "plan_date": plan_date,
        "plan_id": plan_id,
        "status": "GENERATING",
        "owner_id": owner_id,
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    try:
        _table().put_item(
            Item=item,
            ConditionExpression=(
                "attribute_not_exists(student_id)"
                " OR #status = :failed"
                " OR (#status = :generating AND #updated_at < :stale_threshold)"
            ),
            ExpressionAttributeNames={"#status": "status", "#updated_at": "updated_at"},
            ExpressionAttributeValues={
                ":failed": "FAILED",
                ":generating": "GENERATING",
                ":stale_threshold": stale_threshold,
            },
        )
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            return None
        raise

    return item


def complete_plan_with_tasks(
    student_id: str,
    plan_date: str,
    owner_id: str,
    plan_id: str,
    available_minutes: int,
    subject_id: str,
    title: str,
    reason: str,
    generator: str,
    model_id: str,
    prompt_version: str,
    tasks: list[dict[str, Any]],
    created_at: str,
) -> dict[str, Any]:
    """Atomically marks the plan COMPLETED and writes every task row in a
    single TransactWriteItems call: either the whole plan is persisted, or
    none of it is — a partially-saved plan (tasks without a completed plan,
    or vice versa) can never happen.

    Only succeeds while `owner_id` still holds the GENERATING lock; otherwise
    raises PlanLockLostError (a newer attempt already took over) or, for any
    other persistence failure, PlanPersistenceError.
    """
    now_iso = datetime.now(UTC).isoformat()

    plan_item = {
        "student_id": student_id,
        "plan_date": plan_date,
        "plan_id": plan_id,
        "status": "COMPLETED",
        "owner_id": owner_id,
        "available_minutes": available_minutes,
        "subject_id": subject_id,
        "title": title,
        "reason": reason,
        "generator": generator,
        "model_id": model_id,
        "prompt_version": prompt_version,
        "created_at": created_at,
        "updated_at": now_iso,
    }

    # The plan Update must be TransactItems[0] so CancellationReasons[0]
    # always reflects whether *our* lock condition held.
    plan_update = {
        "Update": {
            "TableName": table_name(),
            "Key": to_attribute_map({"student_id": student_id, "plan_date": plan_date}),
            "UpdateExpression": (
                "SET #status = :completed, available_minutes = :available_minutes,"
                " subject_id = :subject_id, title = :title, reason = :reason,"
                " generator = :generator, model_id = :model_id, prompt_version = :prompt_version,"
                " updated_at = :updated_at"
            ),
            "ConditionExpression": "#status = :generating AND owner_id = :owner_id",
            "ExpressionAttributeNames": {"#status": "status"},
            "ExpressionAttributeValues": to_attribute_map(
                {
                    ":completed": "COMPLETED",
                    ":generating": "GENERATING",
                    ":owner_id": owner_id,
                    ":available_minutes": available_minutes,
                    ":subject_id": subject_id,
                    ":title": title,
                    ":reason": reason,
                    ":generator": generator,
                    ":model_id": model_id,
                    ":prompt_version": prompt_version,
                    ":updated_at": now_iso,
                }
            ),
        }
    }

    task_puts = [
        {
            "Put": {
                "TableName": study_tasks_repository.table_name(),
                "Item": to_attribute_map(task),
            }
        }
        for task in tasks
    ]

    try:
        transact_write_items([plan_update, *task_puts])
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code")
        reasons = exc.response.get("CancellationReasons", [])
        plan_cancel_reason = reasons[0] if reasons else {}
        if error_code == "TransactionCanceledException" and plan_cancel_reason.get("Code") == "ConditionalCheckFailed":
            raise PlanLockLostError(
                f"plan lock for {student_id}/{plan_date} was lost (owner_id={owner_id})"
            ) from exc
        raise PlanPersistenceError(f"学習プランの保存に失敗しました: {exc}") from exc

    return plan_item


def fail_plan(student_id: str, plan_date: str, owner_id: str) -> None:
    """Marks the plan FAILED so the next request can retry. No-ops (does not
    raise) if `owner_id` no longer holds the GENERATING lock — a newer
    attempt already took over, and must not be clobbered by this one.
    """
    now_iso = datetime.now(UTC).isoformat()
    try:
        _table().update_item(
            Key={"student_id": student_id, "plan_date": plan_date},
            UpdateExpression="SET #status = :failed, updated_at = :updated_at",
            ConditionExpression="#status = :generating AND owner_id = :owner_id",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={
                ":failed": "FAILED",
                ":generating": "GENERATING",
                ":owner_id": owner_id,
                ":updated_at": now_iso,
            },
        )
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            return
        raise
