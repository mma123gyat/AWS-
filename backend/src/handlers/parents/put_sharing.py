from src.services.sharing_settings_service import save_sharing
from src.utils.handler_wrapper import lambda_handler
from src.utils.response import success


@lambda_handler("parents.put_sharing")
def handler(event: dict, context) -> dict:
    return success(save_sharing(event, "PARENT"))
