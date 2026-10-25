import { useId, useState } from 'react';
import type { ApiMessageItem } from '../../../types/api';
import { formatParentDate, newestMessages, senderLabel } from '../utils/parentDashboard';

export function MessageList({ messages }: { messages: ApiMessageItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const sorted = newestMessages(messages);
  const visible = expanded ? sorted : sorted.slice(0, 3);
  return <section className="parent-card parent-messages" aria-labelledby="parent-messages-title">
    <div className="parent-section-heading"><div><p className="parent-section-label">見守りのつながり</p><h2 id="parent-messages-title">届いているメッセージ</h2></div><span className="parent-message-count">{messages.length}件</span></div>
    <p className="parent-footnote parent-message-intro">最新20件までを表示しています。日時は日本時間です。</p>
    {messages.length === 0 ? <div className="parent-message-empty" role="status"><p>まだメッセージはありません。</p><p>支援者から届いた内容を、ここで確認できます。</p></div> : <>
      <ul id={listId} className="parent-message-list">{visible.map(message => <li key={message.message_id}>
        <div className="parent-message-meta"><span className="parent-sender">{senderLabel(message.sender_role)}</span><time>{formatParentDate(message.created_at)}{formatParentDate(message.created_at) === '日時不明' ? '' : '（日本時間）'}</time></div>
        <p className="parent-message-body">{message.body}</p>
      </li>)}</ul>
      {messages.length > 3 && <button type="button" className="parent-expand-button" aria-expanded={expanded} aria-controls={listId} onClick={() => setExpanded(value => !value)}>{expanded ? '表示を3件に戻す' : `メッセージをすべて見る（${messages.length}件）`}</button>}
    </>}
  </section>;
}
