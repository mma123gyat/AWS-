from src.services.sharing_settings_service import get_sharing
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler("support.get_sharing")
def handler(event: dict, context) -> dict:
    return success(get_sharing(event, "SUPPORT"))
