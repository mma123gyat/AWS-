"""Current teacher authority and atomic membership checks, using Moto only."""
import copy
import json

import boto3
import pytest
from botocore.exceptions import ClientError

from tests.unit.test_parent_support_handlers import tables, _aws_credentials, _event, STUDENT_ID
from tests.unit.test_teacher_profile import teachers, PAYLOAD
from src.handlers.teacher import (
    get_me, get_students, get_student_detail, get_learning_history,
    get_student_progress, put_student_progress, get_ai_parameters, put_ai_parameters,
    get_class_progress, put_class_progress,
)
from src.repositories import student_progresses_repository, users_repository
from src.services import teacher_access_service
from src.utils import auth_context

MODULES = [get_me, get_students, get_student_detail, get_learning_history,
           get_student_progress, put_student_progress, get_ai_parameters, put_ai_parameters,
           get_class_progress, put_class_progress]
STUDENT_MODULES = [get_student_detail, get_learning_history, get_student_progress,
                   put_student_progress, get_ai_parameters, put_ai_parameters]
TEACHER_ID = "teacher-input-test"
OTHER_STUDENT = "student-class-2"
PARAMS = {"difficulty": 2, "volume": 1, "supportLevel": 5}


@pytest.fixture
def app(teachers):
    client = boto3.client("dynamodb", region_name="ap-northeast-1")
    client.update_table(
        TableName="Users",
        AttributeDefinitions=[{"AttributeName": "class_id", "AttributeType": "S"}, {"AttributeName": "role", "AttributeType": "S"}],
        GlobalSecondaryIndexUpdates=[{"Create": {
            "IndexName": "class_id-index", "Projection": {"ProjectionType": "ALL"},
            "KeySchema": [{"AttributeName": "class_id", "KeyType": "HASH"}, {"AttributeName": "role", "KeyType": "RANGE"}],
        }}],
    )
    for name, keys in [("StudyPlans", [("student_id", "S"), ("plan_date", "S")]),
                       ("StudyTasks", [("plan_id", "S"), ("task_order", "N")])]:
        client.create_table(
            TableName=name,
            KeySchema=[{"AttributeName": key, "KeyType": "HASH" if index == 0 else "RANGE"} for index, (key, _) in enumerate(keys)],
            AttributeDefinitions=[{"AttributeName": key, "AttributeType": kind} for key, kind in keys],
            BillingMode="PAY_PER_REQUEST",
        )
    users_repository.create_user(OTHER_STUDENT, "other-student-sub", "2組の生徒", "", "STUDENT", class_id="class-2")
    student_progresses_repository.put_progress(OTHER_STUDENT, "math", "2組の元の単元", 4, "IN_PROGRESS")
    return boto3.resource("dynamodb", region_name="ap-northeast-1")


def event(module, *, student_id=STUDENT_ID, sub="teacher-input-sub", role="TEACHER", class_id="class-1"):
    return {
        **_event(sub, f"[{role}]"),
        "pathParameters": {"studentId": student_id, "classId": class_id},
        "body": json.dumps(PARAMS if module == put_ai_parameters else {**PAYLOAD, "understanding": 3}),
    }


def data(result):
    assert result["statusCode"] == 200, result
    return json.loads(result["body"])["data"]


@pytest.mark.parametrize("module", MODULES)
def test_current_teacher_can_use_every_teacher_endpoint(app, module):
    assert module.handler(event(module), None)["statusCode"] == 200


@pytest.mark.parametrize("module", MODULES)
def test_missing_authentication_never_opens_a_teacher_endpoint(app, module):
    assert module.handler({"pathParameters": {"studentId": STUDENT_ID}}, None)["statusCode"] == 401


@pytest.mark.parametrize("module", MODULES)
@pytest.mark.parametrize("change", ["role", "sub", "delete"])
def test_revoked_authority_with_old_jwt_and_stale_gsi_is_rejected_everywhere(app, monkeypatch, module, change):
    stale = users_repository.get_user_by_id(TEACHER_ID)
    monkeypatch.setattr(auth_context, "get_user_by_cognito_sub", lambda _: copy.deepcopy(stale))
    if change == "delete":
        app.Table("Users").delete_item(Key={"user_id": TEACHER_ID})
    else:
        users_repository.update_user_fields(TEACHER_ID, **({"role": "PARENT"} if change == "role" else {"cognito_sub": "replacement-sub"}))
    student_before = users_repository.get_user_by_id(STUDENT_ID)
    progress_before = student_progresses_repository.get_progress(STUDENT_ID, "math")
    assert module.handler(event(module), None)["statusCode"] == 403
    assert users_repository.get_user_by_id(STUDENT_ID) == student_before
    assert student_progresses_repository.get_progress(STUDENT_ID, "math") == progress_before


@pytest.mark.parametrize("module", [get_students, get_student_detail, get_student_progress, put_student_progress])
@pytest.mark.parametrize("role", ["STUDENT", "PARENT", "SUPPORT"])
def test_non_teacher_cannot_enter_remaining_teacher_endpoints(app, module, role):
    users_repository.create_user("non-teacher", "non-teacher-sub", "", "", role, class_id="class-1")
    assert module.handler(event(module, sub="non-teacher-sub", role=role), None)["statusCode"] == 403


@pytest.mark.parametrize("module", STUDENT_MODULES)
def test_current_teacher_class_overrides_stale_gsi_for_reads_and_writes(app, monkeypatch, module):
    stale = users_repository.get_user_by_id(TEACHER_ID)
    monkeypatch.setattr(auth_context, "get_user_by_cognito_sub", lambda _: copy.deepcopy(stale))
    users_repository.update_user_fields(TEACHER_ID, class_id="class-2")
    assert module.handler(event(module), None)["statusCode"] == 403
    assert module.handler(event(module, student_id=OTHER_STUDENT), None)["statusCode"] == 200


def test_student_list_uses_current_teacher_class_and_current_student_rows(app, monkeypatch):
    stale = users_repository.get_user_by_id(TEACHER_ID)
    monkeypatch.setattr(auth_context, "get_user_by_cognito_sub", lambda _: copy.deepcopy(stale))
    users_repository.update_user_fields(TEACHER_ID, class_id="class-2")
    assert [student["studentId"] for student in data(get_students.handler(event(get_students), None))] == [OTHER_STUDENT]

    users_repository.update_user_fields(TEACHER_ID, class_id="class-1")
    candidates = [{"user_id": STUDENT_ID, "name": "古い名前"}, {"user_id": OTHER_STUDENT}, {"user_id": "deleted"}, {"user_id": "not-a-student"}]
    users_repository.create_user("not-a-student", "non-student-sub", "非公開の名前", "", "PARENT", class_id="class-1")
    users_repository.update_user_fields(STUDENT_ID, name="現在の名前")
    monkeypatch.setattr(teacher_access_service, "list_students_by_class_id", lambda _: candidates)
    observed = []
    original = get_students._summarize_student
    def summarize(student):
        observed.append(student["user_id"])
        return original(student)
    monkeypatch.setattr(get_students, "_summarize_student", summarize)
    result = data(get_students.handler(event(get_students), None))
    assert [student["studentId"] for student in result] == observed == [STUDENT_ID]
    assert result[0]["name"] == "現在の名前"


@pytest.mark.parametrize("module", STUDENT_MODULES)
@pytest.mark.parametrize("target,status", [(OTHER_STUDENT, 403), ("missing", 404), (TEACHER_ID, 404), ("", 400)])
def test_other_class_non_student_and_invalid_targets_are_rejected(app, module, target, status):
    assert module.handler(event(module, student_id=target), None)["statusCode"] == status


@pytest.mark.parametrize("module,repository", [(put_student_progress, student_progresses_repository), (put_ai_parameters, users_repository)])
@pytest.mark.parametrize("change", ["teacher_class", "teacher_role", "teacher_sub", "teacher_deleted", "student_class", "student_role", "student_deleted"])
def test_authority_and_membership_are_checked_atomically_at_save(app, monkeypatch, module, repository, change):
    student_before = users_repository.get_user_by_id(STUDENT_ID)
    progress_before = student_progresses_repository.get_progress(STUDENT_ID, "math")
    original = repository.transact_write_items
    def changed(items):
        target = TEACHER_ID if change.startswith("teacher_") else STUDENT_ID
        field = change.split("_", 1)[1]
        if field == "deleted":
            app.Table("Users").delete_item(Key={"user_id": target})
        else:
            key, value = {"class": ("class_id", "class-2"), "role": ("role", "PARENT"), "sub": ("cognito_sub", "replacement-sub")}[field]
            users_repository.update_user_fields(target, **{key: value})
        return original(items)
    monkeypatch.setattr(repository, "transact_write_items", changed)
    result = module.handler(event(module), None)
    assert result["statusCode"] == 409, result
    assert json.loads(result["body"])["error"]["code"] == "CONFLICT"
    assert student_progresses_repository.get_progress(STUDENT_ID, "math") == progress_before
    after = users_repository.get_user_by_id(STUDENT_ID)
    if change == "student_deleted":
        assert after is None
    else:
        assert after.get("ai_parameters") == student_before.get("ai_parameters")
        assert after.get("ai_parameters_updated_at") == student_before.get("ai_parameters_updated_at")
    assert student_progresses_repository.get_progress(OTHER_STUDENT, "math")["unit_name"] == "2組の元の単元"


@pytest.mark.parametrize("module,repository", [(put_student_progress, student_progresses_repository), (put_ai_parameters, users_repository)])
def test_unexpected_storage_error_is_not_misreported_as_an_assignment_conflict(app, monkeypatch, module, repository):
    def denied(items):
        raise ClientError({"Error": {"Code": "AccessDeniedException", "Message": "test"}}, "TransactWriteItems")
    monkeypatch.setattr(repository, "transact_write_items", denied)
    assert module.handler(event(module), None)["statusCode"] == 500


def test_successful_saves_preserve_other_user_fields_and_other_students(app):
    before = users_repository.get_user_by_id(STUDENT_ID)
    teacher_before = users_repository.get_user_by_id(TEACHER_ID)
    other_before = users_repository.get_user_by_id(OTHER_STUDENT)
    progress = data(put_student_progress.handler(event(put_student_progress), None))
    settings = data(put_ai_parameters.handler(event(put_ai_parameters), None))
    assert progress["unit_name"] == PAYLOAD["unitName"] and settings["params"] == PARAMS
    after = users_repository.get_user_by_id(STUDENT_ID)
    for key, value in before.items():
        if key != "updated_at":
            assert after[key] == value
    assert users_repository.get_user_by_id(TEACHER_ID) == teacher_before
    assert users_repository.get_user_by_id(OTHER_STUDENT) == other_before
    assert data(get_ai_parameters.handler(event(get_ai_parameters), None)) == settings
