from src.repositories.study_records_repository import list_records_by_student
from src.utils.auth_context import get_authenticated_user, require_role
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler("students.get_study_records")
def handler(event: dict, context) -> dict:
    user = get_authenticated_user(event)
    require_role(user, "STUDENT")

    records = list_records_by_student(user.user_id)
    return success(records)
