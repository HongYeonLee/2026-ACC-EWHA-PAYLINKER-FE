import { api } from '../../../shared/api/client';
import type {
  CheckItemListResponse,
  CheckItemType,
  ResendRequestActionRequest,
  ResendRequestActionResponse,
  ResendRequestListResponse,
} from '../../../shared/api/types';
import type {
  CheckItemStatus,
  ResendRequestStatus,
} from '../../../shared/constants/status';

export interface ResendRequestListQuery {
  status?: ResendRequestStatus;
  campaignId?: string;
  page?: number;
  pageSize?: number;
}

export interface CheckItemListQuery {
  itemType?: CheckItemType;
  status?: CheckItemStatus;
  campaignId?: string;
  page?: number;
  pageSize?: number;
}

export const notificationApi = {
  resendRequestList: (params: ResendRequestListQuery = {}) =>
    api.get<ResendRequestListResponse>('/notifications/resend-requests', {
      query: { ...params },
    }),

  resendRequestAction: (requestId: string, body: ResendRequestActionRequest) =>
    api.patch<ResendRequestActionResponse>(
      `/notifications/resend-requests/${requestId}`,
      body,
    ),

  checkItems: (params: CheckItemListQuery = {}) =>
    api.get<CheckItemListResponse>('/notifications/check-items', { query: { ...params } }),
};
