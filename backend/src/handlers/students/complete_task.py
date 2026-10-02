from src.repositories.study_tasks_repository import get_task, parse_task_id, update_task_status
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.errors import ForbiddenError, NotFoundError, ValidationError
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler("students.complete_task")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "STUDENT")

    task_id = event.get("pathParameters", {}).get("taskId")
    if not task_id:
        raise ValidationError("taskIdは必須です。")

    try:
        plan_id, task_order = parse_task_id(task_id)
    except ValueError:
        raise ValidationError("taskIdの形式が不正です。")

    task = get_task(plan_id, task_order)
    if not task:
        raise NotFoundError("タスクが見つかりませんでした。")
    if task.get("student_id") != user.user_id:
        raise ForbiddenError("このタスクを操作する権限がありません。")

    update_task_status(plan_id, task_order, "COMPLETED")
    return success({"taskId": task_id, "status": "COMPLETED"})
