import { mockParentDashboard } from '../features/parent/mock/parentMockData';
import type { ApiParentDashboard } from '../types/api';
import { apiGet } from './client';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export function getParentDashboard(): Promise<ApiParentDashboard> {
  if (USE_MOCK) return Promise.resolve(mockParentDashboard);
  return apiGet<ApiParentDashboard>('/parents/me/dashboard');
}
