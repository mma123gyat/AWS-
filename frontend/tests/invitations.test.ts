import test from 'node:test'
import assert from 'node:assert/strict'
import { readInvitation } from '../src/features/teacher/utils/invitations.ts'

const item = { email: 'new@example.invalid', name: '生徒A', role: 'STUDENT', studentId: null,
  status: 'SENT', created_at: '2026-10-26T00:00:00Z', last_sent_at: '2026-10-26T00:00:00Z' }

test('送信済みと処理結果不明を区別し、元の応答を変更しない', () => {
  assert.deepEqual(readInvitation(item), item)
  assert.equal(readInvitation({ ...item, status: 'DELIVERY_UNKNOWN' }).status, 'DELIVERY_UNKNOWN')
  assert.notEqual(readInvitation(item), item)
})
test('教員など招待できないロールや未知の送信状態を成功扱いしない', () => {
  for (const value of [{ ...item, role: 'TEACHER' }, { ...item, status: 'SUCCESS' }, null, []]) {
    assert.throws(() => readInvitation(value))
  }
})
test('生徒の誤った紐づけや保護者の欠けた対象を拒否する', () => {
  assert.throws(() => readInvitation({ ...item, studentId: 'student-1' }))
  assert.throws(() => readInvitation({ ...item, role: 'PARENT' }))
  assert.equal(readInvitation({ ...item, role: 'SUPPORT', studentId: 'student-1' }).studentId, 'student-1')
})
