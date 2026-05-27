import type {
  CampaignStatus,
  CheckItemStatus,
  LinkStatus,
  ResendRequestStatus,
  SendJobStatus,
} from '../constants/status';

/* ────────────────────────────────────────────────────────────────────────────
 * Pagination — BE 공통 응답 컨벤션과 1:1 매칭.
 * ──────────────────────────────────────────────────────────────────────────── */
export interface PagedResponse<T> {
  totalCount: number;
  page: number;
  pageSize: number;
  items: T[];
}

/* ────────────────────────────────────────────────────────────────────────────
 * User
 * ──────────────────────────────────────────────────────────────────────────── */
export interface UserMeResponse {
  adminId: string;
  email: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | string;
  createdAt: string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Campaign — Detail / List / Create
 * ──────────────────────────────────────────────────────────────────────────── */
export interface CampaignDetailResponse {
  campaignId: string;
  campaignName: string;
  status: CampaignStatus;
  emailSubject: string;
  emailDescription: string;
  linkTtlHours: number;
  allowOneTimeLink: boolean;
  allowResendRequest: boolean;
  resendRequestLimit: number;
  maxRecipients: number;
  maxDailyCount: number;
  scheduledSendAt: string | null;
  sendStartedAt: string | null;
  sendCompletedAt: string | null;
  cancelledAt: string | null;
  totalRecipientCount: number;
  sendSuccessCount: number;
  sendFailedCount: number;
  viewedCount: number;
  unviewedCount: number;
  createdAt: string;
}

export interface CampaignListItem {
  campaignId: string;
  campaignName: string;
  status: CampaignStatus;
  scheduledSendAt: string | null;
  sendCompletedAt: string | null;
  totalRecipientCount: number;
  sendSuccessCount: number;
  sendFailedCount: number;
  viewedCount: number;
  createdAt: string;
}

export type CampaignListResponse = PagedResponse<CampaignListItem>;

export interface CampaignCreateRequest {
  campaignName: string;
  emailSubject: string;
  emailDescription?: string;
  linkTtlHours?: number;
  allowOneTimeLink?: boolean;
  allowResendRequest?: boolean;
  resendRequestLimit?: number;
  maxRecipients?: number;
  maxDailyCount?: number;
  scheduledSendAt?: string;
}

export interface CampaignCreateResponse {
  campaignId: string;
  campaignName: string;
  status: CampaignStatus;
  createdAt: string;
}

export type CampaignUpdateRequest = Omit<Partial<CampaignCreateRequest>, 'scheduledSendAt'>;

export interface CampaignScheduleRequest {
  scheduledSendAt: string;
}

export interface CampaignScheduleResponse {
  campaignId: string;
  status: CampaignStatus;
  scheduledSendAt: string;
}

export interface CampaignCancelResponse {
  campaignId: string;
  status: CampaignStatus;
  cancelledAt: string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Reminders / Manual resend
 * ──────────────────────────────────────────────────────────────────────────── */
export type ReminderTarget = 'ALL_UNVIEWED' | 'SELECTED';

export interface ReminderRequest {
  target: ReminderTarget;
  campaignRecipientIds?: string[];
}

export interface ReminderResponse {
  campaignId: string;
  queuedCount: number;
  skippedExpiredCount: number;
  requestedAt: string;
}

export type ManualResendTarget = 'ALL_FAILED' | 'SELECTED';

export interface ManualResendRequest {
  target: ManualResendTarget;
  campaignRecipientIds?: string[];
  excludeFailureReasons?: string[];
}

export interface ManualResendResponse {
  campaignId: string;
  queuedCount: number;
  skippedPermanentFailureCount: number;
  requestedAt: string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Recipient upload / validation
 * ──────────────────────────────────────────────────────────────────────────── */
export type RecipientUploadType = 'FULL_REPLACE' | 'APPEND';

export interface RecipientUploadResponse {
  uploadBatchId: string;
  campaignId: string;
  totalRowCount: number;
  validRowCount: number;
  errorRowCount: number;
  duplicateRowCount: number;
}

export interface RecipientValidationErrorItem {
  rowNumber: number;
  column: string;
  errorType: string;
  rawValue: string;
  message: string;
}

export interface RecipientValidationResponse {
  uploadBatchId: string;
  campaignId: string;
  totalRowCount: number;
  validRowCount: number;
  errorRowCount: number;
  duplicateRowCount: number;
  canProceed: boolean;
  errors: RecipientValidationErrorItem[];
}

/* ────────────────────────────────────────────────────────────────────────────
 * Document upload / match-results
 * ──────────────────────────────────────────────────────────────────────────── */
export interface DocumentUploadResponse {
  uploadBatchId: string;
  campaignId: string;
  totalDocumentCount: number;
  matchedCount: number;
  unmatchedDocumentCount: number;
  unmatchedRecipientCount: number;
  duplicateMatchCount: number;
}

export type DocumentMatchStatus = 'MATCHED' | 'UNMATCHED' | 'DUPLICATE_MATCH' | 'MISMATCHED';

export interface DocumentMatchItem {
  campaignRecipientId: string;
  recipientName: string;
  employeeNo: string;
  email: string;
  matchStatus: DocumentMatchStatus;
  matchKey: string;
  documentId: string | null;
}

export interface DocumentMatchResultsResponse {
  campaignId: string;
  totalRecipientCount: number;
  totalDocumentCount: number;
  matchedCount: number;
  unmatchedRecipientCount: number;
  duplicateMatchCount: number;
  canProceed: boolean;
  items: DocumentMatchItem[];
}

/* ────────────────────────────────────────────────────────────────────────────
 * Final review
 * ──────────────────────────────────────────────────────────────────────────── */
export interface CampaignFinalReviewResponse {
  campaignId: string;
  campaignName: string;
  emailSubject: string;
  emailDescription: string;
  linkTtlHours: number;
  totalRecipientCount: number;
  matchedDocumentCount: number;
  unmatchedRecipientCount: number;
  duplicateMatchCount: number;
  scheduledSendAt: string | null;
  canSend: boolean;
  blockingIssues: string[];
}

/* ────────────────────────────────────────────────────────────────────────────
 * Send failures / View history
 * ──────────────────────────────────────────────────────────────────────────── */
export interface SendFailureItem {
  campaignRecipientId: string;
  name: string;
  department: string;
  email: string;
  failureReason: string;
  failedAt: string;
  retryCount: number;
  currentStatus: SendJobStatus | string;
  lastSendJobId: string | null;
}

export interface SendFailureResponse {
  campaignId: string;
  totalCount: number;
  page: number;
  pageSize: number;
  items: SendFailureItem[];
}

export type ViewHistoryFilter = 'ALL' | 'VIEWED' | 'UNVIEWED';

export interface ViewHistoryItem {
  campaignRecipientId: string;
  name: string;
  employeeNo: string;
  email: string;
  isViewed: boolean;
  firstViewedAt: string | null;
  viewCount: number;
  linkStatus: LinkStatus | string;
  linkExpiresAt: string | null;
}

export interface ViewHistoryResponse {
  campaignId: string;
  totalCount: number;
  viewedCount: number;
  unviewedCount: number;
  page: number;
  pageSize: number;
  items: ViewHistoryItem[];
}

/* ────────────────────────────────────────────────────────────────────────────
 * Dashboard
 * ──────────────────────────────────────────────────────────────────────────── */
export interface DashboardCampaignSummaryCard {
  campaignId: string;
  campaignName: string;
  status: CampaignStatus;
  sendCompletedAt: string | null;
  totalRecipientCount: number;
  sendSuccessCount: number;
  sendFailedCount: number;
  viewedCount: number;
  unviewedCount: number;
  viewRate: number;
}

export interface DashboardSummaryResponse {
  totalUnviewedCount: number;
  totalFailedCount: number;
  attentionRequiredCount: number;
  recentCampaigns: DashboardCampaignSummaryCard[];
}

export type DashboardCampaignSummaryResponse = DashboardCampaignSummaryCard;

export interface DashboardViewTrendPoint {
  snapshotAt: string;
  viewedCount: number;
  viewRate: number;
}

export interface DashboardViewTrendResponse {
  campaignId: string;
  campaignName: string;
  currentViewRate: number;
  totalRecipientCount: number;
  points: DashboardViewTrendPoint[];
}

export interface DashboardUnviewedRecipientPreview {
  recipientId: string;
  name: string;
  employeeNo: string;
  elapsedHours: number;
}

export interface DashboardUnviewedResponse {
  campaignId: string;
  totalUnviewedCount: number;
  maxElapsedHours: number;
  previews: DashboardUnviewedRecipientPreview[];
}

export interface DashboardFailedRecipientPreview {
  campaignRecipientId: string;
  name: string;
  department: string;
  email: string;
  failureReason: string;
}

export interface DashboardFailureResponse {
  campaignId: string;
  totalFailedCount: number;
  previews: DashboardFailedRecipientPreview[];
}

/* ────────────────────────────────────────────────────────────────────────────
 * Notifications — resend-requests / check-items
 * ──────────────────────────────────────────────────────────────────────────── */
export interface ResendRequestItem {
  requestId: string;
  campaignId: string;
  campaignName: string;
  recipientName: string;
  employeeNo: string;
  email: string;
  resendReason: string;
  status: ResendRequestStatus;
  requestedAt: string;
  processedAt: string | null;
  processedBy: string | null;
}

export interface ResendRequestListResponse {
  totalCount: number;
  pendingCount: number;
  page: number;
  pageSize: number;
  items: ResendRequestItem[];
}

export type ResendRequestAction = 'APPROVE' | 'REJECT';

export interface ResendRequestActionRequest {
  action: ResendRequestAction;
  reason?: string;
}

export interface ResendRequestActionResponse {
  requestId: string;
  status: ResendRequestStatus;
  processedAt: string;
  newSendJobId: string | null;
  newLinkExpiresAt: string | null;
}

export type CheckItemType = 'RESEND_REQUEST' | 'FINAL_FAILED' | 'UNVIEWED_RECIPIENT';

export interface CheckItemSummary {
  checkItemId: string;
  itemType: CheckItemType;
  checkStatus: CheckItemStatus;
  campaignId: string;
  campaignName: string;
  recipientName: string | null;
  relatedRequestId: string | null;
  createdAt: string;
  deepLink: string | null;
}

export interface CheckItemListResponse {
  totalCount: number;
  openCount: number;
  inProgressCount: number;
  page: number;
  pageSize: number;
  items: CheckItemSummary[];
}

/* ────────────────────────────────────────────────────────────────────────────
 * Campaign send request — SND-004
 * ──────────────────────────────────────────────────────────────────────────── */
export interface CampaignSendRequestResponse {
  campaignId: string;
  status: CampaignStatus;
  sendStartedAt: string;
  queuedJobCount: number;
}

/* ────────────────────────────────────────────────────────────────────────────
 * HR 시스템 연동
 * ──────────────────────────────────────────────────────────────────────────── */
export type HrTargetGroup = 'ALL' | 'DEPARTMENT' | 'SELECTED';

export interface HrDepartment {
  name: string;
  count: number;
}

export interface HrEmployee {
  employeeId: string;
  employeeNo: string;
  name: string;
  email: string;
  department: string;
  jobTitle: string;
  isActive: boolean;
}

export interface HrSyncResponse {
  lastSyncAt: string;
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  noEmailCount: number;
  departments: HrDepartment[];
  employees: HrEmployee[];
}

/* ────────────────────────────────────────────────────────────────────────────
 * Recipient secure-link flow
 * ──────────────────────────────────────────────────────────────────────────── */
/* ────────────────────────────────────────────────────────────────────────────
 * ERR-003 수신자 재전송 요청
 * ──────────────────────────────────────────────────────────────────────────── */
export type ResendReason = 'EXPIRED' | 'REUSED' | 'INVALID_LINK' | 'UNAUTHORIZED' | 'UNKNOWN';

export const RESEND_REASON_LABEL: Record<ResendReason, string> = {
  EXPIRED: '링크가 만료되었습니다',
  REUSED: '이미 사용된 링크입니다',
  INVALID_LINK: '링크 주소가 잘못되었습니다',
  UNAUTHORIZED: '잘못된 수신자에게 발송되었습니다',
  UNKNOWN: '기타',
};

export interface ResendSubmitRequest {
  token: string;
  reason: ResendReason;
}

export interface ResendSubmitResponse {
  requestId: string;
  status: string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * DOC-102 수신자 확인 처리
 * ──────────────────────────────────────────────────────────────────────────── */
export interface ViewedResponse {
  viewedAt: string;
}

export interface LinkSessionResponse {
  linkSessionToken: string;
  campaignRecipientId: string;
  campaignId: string;
  campaignName: string;
  recipientName: string;
  documentCount: number;
  issuedAt: string;
  expiresAt: string;
}

export interface RecipientDocumentResponse {
  campaignName: string;
  emailSubject: string;
  emailDescription: string;
  recipientName: string;
  documents: Array<{
    documentId: string;
    filename: string;
    documentType: 'PDF' | 'HTML' | 'JSON';
    inlineHtml?: string;
    downloadUrl?: string;
    fileSizeBytes: number;
  }>;
  viewedAt: string | null;
  expiresAt: string;
  allowResendRequest: boolean;
}
