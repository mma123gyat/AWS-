"""Recipient assertions use Moto only; no requests reach the deployed account."""
import json

import pytest

from tests.unit.test_parent_support_handlers import tables, _aws_credentials, _event, STUDENT_ID
from src.handlers.support import get_report, post_message
from src.repositories import messages_repository, users_repository


@pytest.fixture
def support(tables):
    users_repository.create_user('support-target-test', 'support-target-sub', '支援者', '', 'SUPPORT', linked_student_id=STUDENT_ID)
    users_repository.create_user('student-B', 'student-B-sub', '別の生徒', '', 'STUDENT')


def request(payload):
    return {**_event('support-target-sub', '[SUPPORT]'), 'body': json.dumps(payload)}


def assert_no_messages():
    assert messages_repository.list_messages_by_student(STUDENT_ID) == []
    assert messages_repository.list_messages_by_student('student-B') == []


def test_link_changed_after_report_requires_reload_before_any_delivery(support):
    report = get_report.handler(request(None), None)
    assert report['statusCode'] == 200
    old_id = json.loads(report['body'])['data']['studentId']
    users_repository.update_user_fields('support-target-test', linked_student_id='student-B')

    response = post_message.handler(request({'studentId': old_id, 'body': '元の生徒についての本文'}), None)

    assert response['statusCode'] == 409
    assert json.loads(response['body'])['error']['code'] == 'CONFLICT'
    assert_no_messages()

    reloaded = get_report.handler(request(None), None)
    new_id = json.loads(reloaded['body'])['data']['studentId']
    assert new_id == 'student-B'
    sent = post_message.handler(request({'studentId': new_id, 'body': ' 新しい生徒についての本文\n次の行 '}), None)
    assert sent['statusCode'] == 200
    assert messages_repository.list_messages_by_student(STUDENT_ID) == []
    assert messages_repository.list_messages_by_student('student-B')[0]['body'] == '新しい生徒についての本文\n次の行'


@pytest.mark.parametrize('target', ['student-B', 'nonexistent-student'])
def test_client_target_never_selects_an_unlinked_student(support, target):
    response = post_message.handler(request({'studentId': target, 'body': '送信しない本文'}), None)
    assert response['statusCode'] == 409
    assert_no_messages()


@pytest.mark.parametrize('target', [None, '', '   ', False, 42, [], {}])
def test_invalid_recipient_assertion_is_rejected_without_writing(support, target):
    response = post_message.handler(request({'studentId': target, 'body': '送信しない本文'}), None)
    assert response['statusCode'] == 400
    assert_no_messages()


def test_old_client_without_target_fails_closed_and_explains_site_refresh(support):
    response = post_message.handler(request({'body': '古い画面からの本文'}), None)
    assert response['statusCode'] == 400
    assert 'サイトを更新' in json.loads(response['body'])['error']['message']
    assert_no_messages()
