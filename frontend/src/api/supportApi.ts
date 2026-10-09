import { mockSupportReport } from '../features/support/mock/supportMockData';
import type { ApiMessageItem, ApiSupportReport, PostSupportMessageRequest } from '../types/api';
import { apiGet, apiPost } from './client';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export function getSupportReport(): Promise<ApiSupportReport> {
  if (USE_MOCK) return Promise.resolve(mockSupportReport);
  return apiGet<ApiSupportReport>('/support/me/report');
}

export function sendSupportMessage(payload: PostSupportMessageRequest): Promise<ApiMessageItem> {
  if (USE_MOCK) {
    return Promise.resolve({
      message_id: 'mock-message-new',
      student_id: mockSupportReport.studentId,
      sort_key: `${new Date().toISOString()}#mock-message-new`,
      sender_user_id: 'mock-support-1',
      sender_role: 'SUPPORT',
      body: payload.body,
      created_at: new Date().toISOString(),
    });
  }
  return apiPost<ApiMessageItem>('/support/me/messages', payload);
}
