import os
from functools import lru_cache

import boto3


@lru_cache(maxsize=1)
def get_resource():
    return boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "ap-northeast-1"))


def table(env_var_name: str, default_table_name: str):
    name = os.environ.get(env_var_name, default_table_name)
    return get_resource().Table(name)
