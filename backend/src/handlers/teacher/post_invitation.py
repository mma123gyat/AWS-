from src.services.invitation_service import invite
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler('teacher.post_invitation')
def handler(event, context):
    return success(invite(event))
