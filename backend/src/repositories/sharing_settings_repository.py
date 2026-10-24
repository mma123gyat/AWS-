from datetime import UTC, datetime

from src.repositories.dynamodb_client import table_name, to_attribute_map, transact_write_items


def actor_check(actor: dict, student_id: str) -> dict:
    return {"ConditionCheck": {
        "TableName": table_name("USERS_TABLE_NAME", "Users"),
        "Key": to_attribute_map({"user_id": actor["user_id"]}),
        "ConditionExpression": "#role = :role AND linked_student_id = :student AND cognito_sub = :sub",
        "ExpressionAttributeNames": {"#role": "role"},
        "ExpressionAttributeValues": to_attribute_map({":role": actor["role"], ":student": student_id, ":sub": actor["cognito_sub"]}),
    }}


def put_settings(actor: dict, student_id: str, settings: dict, version: int) -> dict:
    now = datetime.now(UTC).isoformat()
    values = {":settings": settings, ":next": version + 1, ":now": now, ":editor": actor["role"], ":student": "STUDENT", ":version": version}
    condition = "#role = :student AND (sharing_version = :version"
    if version == 0:
        condition += " OR attribute_not_exists(sharing_version)"
    condition += ")"
    if actor["role"] == "STUDENT":
        condition += " AND cognito_sub = :sub"
        values[":sub"] = actor["cognito_sub"]
    operations = [{"Update": {
        "TableName": table_name("USERS_TABLE_NAME", "Users"),
        "Key": to_attribute_map({"user_id": student_id}),
        "UpdateExpression": "SET sharing_settings = :settings, sharing_version = :next, sharing_updated_at = :now, sharing_updated_by_role = :editor",
        "ConditionExpression": condition,
        "ExpressionAttributeNames": {"#role": "role"},
        "ExpressionAttributeValues": to_attribute_map(values),
    }}]
    if actor["role"] != "STUDENT":
        operations.append(actor_check(actor, student_id))
    transact_write_items(operations)
    return {"sharing_settings": settings, "sharing_version": version + 1, "sharing_updated_at": now, "sharing_updated_by_role": actor["role"]}
