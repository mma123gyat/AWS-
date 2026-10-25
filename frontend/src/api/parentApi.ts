import { readParentDashboard } from '../features/parent/utils/parentDashboard';
import { mockParentDashboard } from '../features/parent/mock/parentMockData';
import type { ApiParentDashboard } from '../types/api';
import { getMockSharing } from '../features/sharing/mockSharing';
import { apiGet } from './client';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export async function getParentDashboard(): Promise<ApiParentDashboard> {
  if (USE_MOCK) {
    const settings = getMockSharing('PARENT').settings.parent!;
    return readParentDashboard({ ...mockParentDashboard,
      weeklyStudyMinutes: settings.studySummary ? mockParentDashboard.weeklyStudyMinutes : null,
      studiedDays: settings.studySummary ? mockParentDashboard.studiedDays : null,
      recordCount: settings.studySummary ? mockParentDashboard.recordCount : null,
      badges: settings.studySummary ? mockParentDashboard.badges : null,
      messages: settings.messages ? structuredClone(mockParentDashboard.messages) : null,
    });
  }
  return readParentDashboard(await apiGet<unknown>('/parents/me/dashboard'));
}
