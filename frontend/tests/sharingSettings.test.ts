import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSharing } from '../src/features/sharing/sharingContract.ts';

function legacy() {
  return {
    studentId: 'student-1', studentName: 'テスト生徒', version: 0, updatedAt: null,
    updatedByRole: null, isLegacyDefault: true, canSendMessage: true,
    settings: { parent: { studySummary: true, messages: true }, support: { studySummary: true, subjectProgress: true, messages: true } },
  };
}

test('未保存の初期共有と保存済みのOFFを区別し、元の応答を変更しない', () => {
  const raw = legacy();
  const parsed = parseSharing(raw, 'STUDENT');
  assert.notEqual(parsed.settings, raw.settings);
  assert.equal(parsed.isLegacyDefault, true);
  const saved = { ...raw, version: 1, updatedAt: '2026-10-24T12:00:00Z', updatedByRole: 'PARENT', isLegacyDefault: false, canSendMessage: false,
    settings: { ...raw.settings, parent: { studySummary: false, messages: false } } };
  assert.equal(parseSharing(saved, 'PARENT').settings.parent?.studySummary, false);
});

test('支援者には保護者の設定を含めない応答を受け付ける', () => {
  const raw = legacy();
  const support = { ...raw, settings: { support: raw.settings.support } };
  assert.deepEqual(parseSharing(support, 'SUPPORT').settings, support.settings);
  assert.throws(() => parseSharing(support, 'PARENT'));
});

test('対象が切り替わった古いタブでは別の生徒の保存応答を受け付けない', () => {
  assert.throws(() => parseSharing(legacy(), 'PARENT', 'student-2'));
});

test('欠けた項目や文字列のtrueを有効な共有設定として扱わない', () => {
  for (const bad of [null, [], {}, { ...legacy(), settings: {} },
    { ...legacy(), settings: { ...legacy().settings, support: { ...legacy().settings.support, messages: 'true' } } },
    { ...legacy(), settings: { ...legacy().settings, parent: { messages: true } } },
  ]) assert.throws(() => parseSharing(bad, 'STUDENT'));
});

test('整数以外のバージョンと不正な保存メタデータは拒否する', () => {
  for (const bad of [{ ...legacy(), version: -1 }, { ...legacy(), version: true }, { ...legacy(), version: 1.5 },
    { ...legacy(), version: Number.MAX_SAFE_INTEGER + 1 }, { ...legacy(), updatedAt: 'unknown' },
    { ...legacy(), updatedAt: '2026-10-24T12:00:00' }, { ...legacy(), updatedByRole: 'SUPPORT' },
    { ...legacy(), isLegacyDefault: false }, { ...legacy(), version: 1 },
  ]) assert.throws(() => parseSharing(bad, 'PARENT'));
});

test('受信OFF・送信OFFなのに送信可能とする矛盾した応答は拒否する', () => {
  for (const group of ['parent', 'support'] as const) {
    const raw = legacy();
    raw.settings[group].messages = false;
    assert.throws(() => parseSharing(raw, 'STUDENT'));
  }
});

test('支援者は自身の送信がONでも受信側の停止により送信できない場合がある', () => {
  const raw = legacy();
  assert.equal(parseSharing({ ...raw, settings: { support: raw.settings.support }, canSendMessage: false }, 'SUPPORT').canSendMessage, false);
});
