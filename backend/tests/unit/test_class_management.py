import json
from unittest.mock import patch
import boto3
import pytest
from tests.unit.test_invitations import app, seed_env, _aws_credentials
from src.repositories import users_repository as users
from src.services import class_management_service as service
from src.handlers.admin import get_classes, post_class, put_assignment, put_class


def event(payload=None, role='ADMIN', sub='admin-sub', **paths):
    return {'requestContext': {'authorizer': {'claims': {'sub': sub, 'cognito:groups': [role]}}},
            'body': json.dumps(payload if payload is not None else {}), 'pathParameters': paths}


@pytest.fixture
def setup(app):
    db, _, _ = app
    db.create_table(TableName='ClassAudit', BillingMode='PAY_PER_REQUEST', KeySchema=[{'AttributeName': 'audit_id', 'KeyType': 'HASH'}],
                    AttributeDefinitions=[{'AttributeName': 'audit_id', 'AttributeType': 'S'}])
    users.create_user('admin-1', 'admin-sub', '管理担当', 'admin@example.invalid', 'ADMIN')
    db.Table('SchoolClasses').put_item(Item={'class_id': 'class-2', 'class_name': '2組', 'grade': '2', 'school_year': '2026'})
    users.create_user('parent-1', 'parent-sub', '保護者', '', 'PARENT', linked_student_id='student-1')
    return db


def move(**changes):
    return {'classId': 'class-2', 'previousClassId': 'class-1', 'version': 0, **changes}


def test_create_rename_and_audit(setup):
    result = post_class.handler(event({'className': '3年1組', 'grade': '3', 'schoolYear': '2027'}), None)
    assert result['statusCode'] == 200, result
    audit = json.loads(result['body'])['data']
    cid = audit['target_id']
    result = put_class.handler(event({'className': '3年2組', 'grade': '3', 'schoolYear': '2027', 'version': 0}, classId=cid), None)
    assert result['statusCode'] == 200
    assert setup.Table('ClassAudit').scan()['Count'] == 2
    assert setup.Table('SchoolClasses').get_item(Key={'class_id': cid})['Item']['version'] == 1
    assert put_class.handler(event({'className': 'stale', 'grade': '3', 'schoolYear': '2027', 'version': 0}, classId=cid), None)['statusCode'] == 409


@pytest.mark.parametrize('target', ['student-1', 'teacher-1'])
def test_move_keeps_identity_links_and_atomic_history(setup, target):
    old = users.get_user_by_id(target)
    result = put_assignment.handler(event(move(), userId=target), None)
    assert result['statusCode'] == 200, result
    new = users.get_user_by_id(target)
    assert new['class_id'] == 'class-2' and new['assignment_version'] == 1
    assert new['cognito_sub'] == old['cognito_sub'] and new['user_id'] == old['user_id']
    assert users.get_user_by_id('parent-1')['linked_student_id'] == 'student-1'
    assert setup.Table('ClassAudit').scan()['Count'] == 1
    assert put_assignment.handler(event(move(), userId=target), None)['statusCode'] == 409


@pytest.mark.parametrize('role,sub', [('TEACHER','teacher-sub'), ('STUDENT','student-sub'), ('PARENT','parent-sub')])
def test_non_admin_read_and_write_are_forbidden(setup,role,sub):
    assert get_classes.handler(event(role=role,sub=sub),None)['statusCode']==403
    assert put_assignment.handler(event(move(),role=role,sub=sub,userId='student-1'),None)['statusCode']==403
    assert setup.Table('ClassAudit').scan()['Count']==0


def test_revoked_admin_is_rechecked_in_transaction(setup):
    real=service.transact_write_items
    def revoked(items):
        setup.Table('Users').update_item(Key={'user_id':'admin-1'}, UpdateExpression='SET #r = :r',ExpressionAttributeNames={'#r':'role'},ExpressionAttributeValues={':r':'STUDENT'})
        return real(items)
    with patch.object(service,'transact_write_items',revoked):
        assert put_assignment.handler(event(move(),userId='student-1'),None)['statusCode']==409
    assert users.get_user_by_id('student-1')['class_id']=='class-1'
    assert setup.Table('ClassAudit').scan()['Count']==0


def test_missing_class_does_not_move_or_audit(setup):
    assert put_assignment.handler(event(move(classId='missing'),userId='student-1'),None)['statusCode']==409
    assert users.get_user_by_id('student-1')['class_id']=='class-1'
    assert setup.Table('ClassAudit').scan()['Count']==0


def test_same_class_and_non_teaching_roles_are_rejected(setup):
    assert put_assignment.handler(event(move(classId='class-1'),userId='student-1'),None)['statusCode']==400
    for uid in ['admin-1','parent-1','missing']:
        assert put_assignment.handler(event(move(),userId=uid),None)['statusCode']==400


@pytest.mark.parametrize('value',[None,[],False,{'className':'x'}, {'className':' ','grade':'2','schoolYear':'2026'}])
def test_invalid_class_payloads(setup,value):
    assert post_class.handler(event(value),None)['statusCode']==400


def test_assignment_version_boolean_and_stale_class(setup):
    assert put_assignment.handler(event(move(version=True),userId='student-1'),None)['statusCode']==400
    assert put_assignment.handler(event(move(previousClassId='wrong'),userId='student-1'),None)['statusCode']==409


def test_overview_omits_parents_and_includes_audit(setup):
    put_assignment.handler(event(move(),userId='student-1'),None)
    result=get_classes.handler(event(),None)
    assert result['statusCode']==200
    data=json.loads(result['body'])['data']
    assert len(data['audits'])==1
    assert all(u['role'] in ('STUDENT','TEACHER') for u in data['users'])
    assert 'cognito_sub' not in str(data)


def test_aba_move_back_cannot_be_overwritten_by_old_form(setup):
    assert put_assignment.handler(event(move(),userId='student-1'),None)['statusCode']==200
    assert put_assignment.handler(event(move(classId='class-1',previousClassId='class-2',version=1),userId='student-1'),None)['statusCode']==200
    assert put_assignment.handler(event(move(),userId='student-1'),None)['statusCode']==409


def test_general_teachers_cannot_grant_admin_via_invitation(setup):
    from src.validators.invitation_validator import validate_invitation
    from src.utils.errors import ValidationError
    with pytest.raises(ValidationError):
        validate_invitation({'name':'管理者','email':'new@example.invalid','role':'ADMIN','classId':'class-1','studentId':None})


def test_audit_write_failure_rolls_back_assignment(setup):
    from botocore.exceptions import ClientError
    def failed(items):
        raise ClientError({'Error': {'Code': 'TransactionCanceledException'}}, 'TransactWriteItems')
    with patch.object(service,'transact_write_items',failed):
        assert put_assignment.handler(event(move(),userId='student-1'),None)['statusCode']==409
    assert users.get_user_by_id('student-1')['class_id']=='class-1'
    assert setup.Table('ClassAudit').scan()['Count']==0


def test_support_role_cannot_manage_classes(setup):
    users.create_user('support-1','support-sub','支援者','','SUPPORT',linked_student_id='student-1')
    assert get_classes.handler(event(role='SUPPORT',sub='support-sub'),None)['statusCode']==403


def test_paginated_scans_read_every_page():
    class Paged:
        def scan(self,**kwargs):
            assert kwargs['ConsistentRead'] is True
            return {'Items':[{'user_id':'second'}]} if 'ExclusiveStartKey' in kwargs else {'Items':[{'user_id':'first'}],'LastEvaluatedKey':{'user_id':'first'}}
    with patch.object(service,'_table',return_value=Paged()):
        assert len(service._all('Users'))==2


def test_old_teacher_access_changes_after_move(setup):
    from src.services.teacher_access_service import get_owned_student
    from src.utils.errors import ForbiddenError
    caller = event(role='TEACHER',sub='teacher-sub',studentId='student-1')
    assert get_owned_student(caller)[1]['user_id'] == 'student-1'
    assert put_assignment.handler(event(move(),userId='student-1'),None)['statusCode']==200
    with pytest.raises(ForbiddenError):
        get_owned_student(caller)


def test_bootstrap_preview_and_existing_account_protection(app,monkeypatch,capsys):
    from scripts import create_school_admin as script
    db,client,pool=app
    session=boto3.Session(region_name='ap-northeast-1')
    real_client=session.client
    sts=real_client('sts')
    monkeypatch.setattr(sts,'get_caller_identity',lambda:{'Account':'836533914233'})
    cfn={'Stacks':[{'Outputs':[{'OutputKey':'UserPoolId','OutputValue':pool}]}]}
    class Cfn:
        def describe_stacks(self,**kwargs): return cfn
    monkeypatch.setattr(session,'client',lambda name,**kwargs:client if name=='cognito-idp' else sts if name=='sts' else Cfn())
    monkeypatch.setattr(script.boto3,'Session',lambda **kwargs:session)
    monkeypatch.setattr('sys.argv',['create_school_admin.py','--email','admin-new@example.invalid','--name','管理者'])
    script.main()
    assert 'PREVIEW ONLY' in capsys.readouterr().out
    assert not client.list_users(UserPoolId=pool)['Users']
    client.admin_create_user(UserPoolId=pool,Username='admin-new@example.invalid',MessageAction='SUPPRESS',UserAttributes=[{'Name':'email','Value':'admin-new@example.invalid'}])
    monkeypatch.setattr('sys.argv',['create_school_admin.py','--email','admin-new@example.invalid','--name','管理者','--create'])
    with pytest.raises(SystemExit,match='already exists'):
        script.main()
