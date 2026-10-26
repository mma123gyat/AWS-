from src.services.class_management_service import overview, save_class, move_user
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success

@lambda_handler("admin.put_class")
def handler(event, context):
    return success(save_class(event, (event.get('pathParameters') or {}).get('classId') or ''))
