import { api } from '../../../shared/api/client';
import type {
  CampaignCancelResponse,
  CampaignCreateRequest,
  CampaignCreateResponse,
  CampaignDetailResponse,
  CampaignFinalReviewResponse,
  CampaignListResponse,
  CampaignScheduleResponse,
  CampaignSendRequestResponse,
  CampaignUpdateRequest,
  DocumentMatchResultsResponse,
  DocumentUploadResponse,
  ManualResendRequest,
  ManualResendResponse,
  RecipientUploadResponse,
  RecipientUploadType,
  RecipientValidationResponse,
  ReminderRequest,
  ReminderResponse,
  SendFailureResponse,
  ViewHistoryFilter,
  ViewHistoryResponse,
} from '../../../shared/api/types';

export interface CampaignListQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  keyword?: string;
  sort?: string;
}

function multipart(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  return fd;
}

export const campaignApi = {
  list: (params: CampaignListQuery = {}) =>
    api.get<CampaignListResponse>('/campaigns', { query: { ...params } }),

  detail: (id: string) => api.get<CampaignDetailResponse>(`/campaigns/${id}`),

  create: (body: CampaignCreateRequest) =>
    api.post<CampaignCreateResponse>('/campaigns', body),

  update: (id: string, body: CampaignUpdateRequest) =>
    api.patch<CampaignDetailResponse>(`/campaigns/${id}`, body),

  schedule: (id: string, scheduledSendAt: string) =>
    api.patch<CampaignScheduleResponse>(`/campaigns/${id}/schedule`, { scheduledSendAt }),

  cancel: (id: string) =>
    api.patch<CampaignCancelResponse>(`/campaigns/${id}/cancel`, undefined),

  /** SND-004 — 즉시 발송 요청 */
  send: (id: string) => api.post<CampaignSendRequestResponse>(`/campaigns/${id}/send`, undefined),

  reminders: (id: string, body: ReminderRequest) =>
    api.post<ReminderResponse>(`/campaigns/${id}/reminders`, body),

  manualResend: (id: string, body: ManualResendRequest) =>
    api.post<ManualResendResponse>(`/campaigns/${id}/resends`, body),

  uploadRecipients: (id: string, file: File, uploadType: RecipientUploadType) =>
    api.post<RecipientUploadResponse>(
      `/campaigns/${id}/recipients/upload`,
      multipart(file),
      { query: { uploadType } },
    ),

  validateUpload: (id: string, uploadBatchId: string) =>
    api.get<RecipientValidationResponse>(
      `/campaigns/${id}/recipients/upload/${uploadBatchId}/validation`,
    ),

  uploadDocuments: (id: string, file: File, documentType: string, matchKey: string) =>
    api.post<DocumentUploadResponse>(
      `/campaigns/${id}/documents/upload`,
      multipart(file),
      { query: { documentType, matchKey } },
    ),

  documentMatches: (id: string, filter?: string) =>
    api.get<DocumentMatchResultsResponse>(`/campaigns/${id}/documents/match-results`, {
      query: { filter },
    }),

  finalReview: (id: string) =>
    api.get<CampaignFinalReviewResponse>(`/campaigns/${id}/final-review`),

  sendFailures: (
    id: string,
    params: { failureReason?: string; page?: number; pageSize?: number } = {},
  ) => api.get<SendFailureResponse>(`/campaigns/${id}/send-failures`, { query: params }),

  viewHistory: (
    id: string,
    params: { filter?: ViewHistoryFilter; page?: number; pageSize?: number } = {},
  ) => api.get<ViewHistoryResponse>(`/campaigns/${id}/view-history`, { query: params }),
};
