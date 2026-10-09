import type { ApiMessageItem } from '../../../types/api';

const SENDER_LABELS: Record<string, string> = {
  SUPPORT: '支援担当者',
  TEACHER: '先生',
};

export function MessageList({ messages }: { messages: ApiMessageItem[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <p className="text-sm font-medium text-gray-700">最近のメッセージ</p>
      {messages.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">まだメッセージはありません。</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {messages.map((message) => (
            <li key={message.message_id} className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0">
              <p className="text-xs font-medium text-gray-500">
                {SENDER_LABELS[message.sender_role] ?? message.sender_role}
              </p>
              <p className="mt-1 text-sm text-gray-700">{message.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
