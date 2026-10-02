import json

from src.repositories.study_records_repository import put_record
from src.repositories.study_tasks_repository import get_task, parse_task_id
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.errors import ForbiddenError, NotFoundError, ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success
from src.validators.study_record_validator import validate_study_record_input


@lambda_handler("students.post_study_record")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "STUDENT")

    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        raise ValidationError("リクエストの形式が不正です。")

    validated = validate_study_record_input(payload)
    task_id = validated["task_id"]

    try:
        plan_id, task_order = parse_task_id(task_id)
    except ValueError:
        raise ValidationError("taskIdの形式が不正です。")

    task = get_task(plan_id, task_order)
    if not task:
        raise NotFoundError("タスクが見つかりませんでした。")
    if task.get("student_id") != user.user_id:
        raise ForbiddenError("このタスクを操作する権限がありません。")

    record = put_record(
        student_id=user.user_id,
        task_id=task_id,
        subject_id=task["subject_id"],
        unit_name=task["unit_name"],
        actual_minutes=validated["actual_minutes"],
        understanding=validated["understanding"],
    )
    return success(record)
