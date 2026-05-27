import { api } from '../../../shared/api/client';
import type {
  DashboardCampaignSummaryResponse,
  DashboardFailureResponse,
  DashboardSummaryResponse,
  DashboardUnviewedResponse,
  DashboardViewTrendResponse,
} from '../../../shared/api/types';

export const dashboardApi = {
  summary: () => api.get<DashboardSummaryResponse>('/dashboard/summary'),

  campaignSummary: (campaignId: string) =>
    api.get<DashboardCampaignSummaryResponse>(`/dashboard/campaigns/${campaignId}/summary`),

  viewTrend: (campaignId: string, params: { from?: string; to?: string } = {}) =>
    api.get<DashboardViewTrendResponse>(
      `/dashboard/campaigns/${campaignId}/view-trend`,
      { query: params },
    ),

  unviewed: (campaignId: string) =>
    api.get<DashboardUnviewedResponse>(
      `/dashboard/campaigns/${campaignId}/unviewed-recipients`,
    ),

  failures: (campaignId: string) =>
    api.get<DashboardFailureResponse>(
      `/dashboard/campaigns/${campaignId}/send-failures`,
    ),
};
