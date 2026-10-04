import os
from functools import lru_cache

import boto3
from boto3.dynamodb.types import TypeSerializer

_serializer = TypeSerializer()


@lru_cache(maxsize=1)
def get_resource():
    return boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "ap-northeast-1"))


@lru_cache(maxsize=1)
def get_client():
    return boto3.client("dynamodb", region_name=os.environ.get("AWS_REGION", "ap-northeast-1"))


def table(env_var_name: str, default_table_name: str):
    return get_resource().Table(table_name(env_var_name, default_table_name))


def table_name(env_var_name: str, default_table_name: str) -> str:
    return os.environ.get(env_var_name, default_table_name)


def to_attribute_map(item: dict) -> dict:
    """Converts a plain Python dict to DynamoDB's low-level AttributeValue
    format, for use with the low-level client (transact_write_items)."""
    return {key: _serializer.serialize(value) for key, value in item.items()}


def transact_write_items(items: list[dict]) -> None:
    get_client().transact_write_items(TransactItems=items)
