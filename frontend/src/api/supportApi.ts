import { mockSupportReport } from '../features/support/mock/supportMockData';
import type { ApiMessageItem, ApiSupportReport, PostSupportMessageRequest } from '../types/api';
import { getMockSharing } from '../features/sharing/mockSharing';
import { mockParentDashboard } from '../features/parent/mock/parentMockData';
import { ApiError, apiGet, apiPost } from './client';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export function getSupportReport(): Promise<ApiSupportReport> {
  if (USE_MOCK) {
    const snapshot = getMockSharing('SUPPORT');
    const settings = snapshot.settings.support;
    return Promise.resolve({ ...mockSupportReport,
      recentStudyMinutes: settings.studySummary ? mockSupportReport.recentStudyMinutes : null,
      recentRecordCount: settings.studySummary ? mockSupportReport.recentRecordCount : null,
      subjectProgresses: settings.subjectProgress ? mockSupportReport.subjectProgresses : null,
      supportNeededSubjects: settings.subjectProgress ? mockSupportReport.supportNeededSubjects?.map(subject => ({ ...subject, reasons: settings.studySummary ? subject.reasons : subject.reasons.filter(reason => reason !== '最近学習記録が少ない教科') })).filter(subject => subject.reasons.length > 0) ?? [] : null,
      canSendMessage: snapshot.canSendMessage,
    });
  }
  return apiGet<ApiSupportReport>('/support/me/report');
}

export function sendSupportMessage(payload: PostSupportMessageRequest): Promise<ApiMessageItem> {
  if (USE_MOCK) {
    if (!getMockSharing('SUPPORT').canSendMessage) return Promise.reject(new ApiError('FORBIDDEN', 'メッセージの共有が停止されています。', 403));
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const message: ApiMessageItem = {
      message_id: id,
      student_id: mockSupportReport.studentId,
      sort_key: `${createdAt}#${id}`,
      sender_user_id: 'mock-support-1',
      sender_role: 'SUPPORT',
      body: payload.body,
      created_at: createdAt,
    };
    mockParentDashboard.messages?.unshift(message);
    return Promise.resolve(message);
  }
  return apiPost<ApiMessageItem>('/support/me/messages', payload);
}
