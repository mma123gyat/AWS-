from src.services.invitation_service import list_invitations
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler('teacher.get_invitations')
def handler(event, context):
    return success(list_invitations(event))
