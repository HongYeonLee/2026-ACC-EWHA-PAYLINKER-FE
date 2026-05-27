/**
 * Lightweight in-browser mock server (BE /v3/api-docs 스펙 기반).
 *
 * VITE_USE_MOCK=true 일 때 main.tsx 가 installMockServer() 를 호출.
 * fetch 를 가로채 /api prefix 이후 path 만 매칭한다.
 */

import {
  MOCK_ADMINS,
  MOCK_CAMPAIGNS,
  MOCK_CHECK_ITEMS,
  MOCK_DOCUMENT_MATCHES,
  MOCK_HR_SYNC,
  MOCK_RECIPIENT_ROWS,
  MOCK_RESEND_REQUESTS,
  type MockRecipientRow,
} from './mock-data';
import type {
  CampaignCancelResponse,
  CampaignCreateRequest,
  CampaignCreateResponse,
  CampaignDetailResponse,
  CampaignFinalReviewResponse,
  CampaignListItem,
  CampaignListResponse,
  CampaignScheduleResponse,
  CampaignSendRequestResponse,
  CampaignUpdateRequest,
  CheckItemListResponse,
  CheckItemSummary,
  DashboardCampaignSummaryCard,
  DashboardFailedRecipientPreview,
  DashboardFailureResponse,
  DashboardSummaryResponse,
  DashboardUnviewedRecipientPreview,
  DashboardUnviewedResponse,
  DashboardViewTrendPoint,
  DashboardViewTrendResponse,
  DocumentMatchItem,
  DocumentMatchResultsResponse,
  DocumentUploadResponse,
  ManualResendRequest,
  ManualResendResponse,
  RecipientUploadResponse,
  RecipientValidationErrorItem,
  RecipientValidationResponse,
  ReminderRequest,
  ReminderResponse,
  ResendRequestActionRequest,
  ResendRequestActionResponse,
  ResendRequestItem,
  ResendRequestListResponse,
  ResendSubmitRequest,
  ResendSubmitResponse,
  SendFailureItem,
  SendFailureResponse,
  UserMeResponse,
  ViewedResponse,
  ViewHistoryFilter,
  ViewHistoryItem,
  ViewHistoryResponse,
  LinkSessionResponse,
  RecipientDocumentResponse,
} from './types';
import type { CampaignStatus } from '../constants/status';

/* ────────────────────────────────────────────────────────────────────────────
 * 라우터
 * ──────────────────────────────────────────────────────────────────────────── */
type Handler = (params: {
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
  request: Request;
}) => Promise<unknown> | unknown;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

const routes: Route[] = [];

function register(method: string, path: string, handler: Handler) {
  const keys: string[] = [];
  const pattern = new RegExp(
    `^${path.replace(/:[a-zA-Z_]+/g, (m) => {
      keys.push(m.slice(1));
      return '([^/]+)';
    })}$`,
  );
  routes.push({ method, pattern, keys, handler });
}

const get = (p: string, h: Handler) => register('GET', p, h);
const post = (p: string, h: Handler) => register('POST', p, h);
const patch = (p: string, h: Handler) => register('PATCH', p, h);

/* ────────────────────────────────────────────────────────────────────────────
 * In-memory DB (session-scoped mutation)
 * ──────────────────────────────────────────────────────────────────────────── */
interface UploadBatchMeta {
  uploadBatchId: string;
  campaignId: string;
  totalRowCount: number;
  validRowCount: number;
  errorRowCount: number;
  duplicateRowCount: number;
  errors: RecipientValidationErrorItem[];
}

const db = {
  admins: structuredClone(MOCK_ADMINS) as UserMeResponse[],
  campaigns: structuredClone(MOCK_CAMPAIGNS) as CampaignDetailResponse[],
  recipients: structuredClone(MOCK_RECIPIENT_ROWS) as MockRecipientRow[],
  documentMatches: structuredClone(MOCK_DOCUMENT_MATCHES) as DocumentMatchItem[],
  resendRequests: structuredClone(MOCK_RESEND_REQUESTS) as ResendRequestItem[],
  checkItems: structuredClone(MOCK_CHECK_ITEMS) as CheckItemSummary[],
  recipientUploadBatches: new Map<string, UploadBatchMeta>(),
  documentUploadBatches: new Map<string, { campaignId: string }>(),
  linkSessions: new Map<string, { campaignRecipientId: string; expiresAt: number }>(),
};

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────────────────────── */
function fail(code: string, message: string, status = 400) {
  return new Response(JSON.stringify({ success: false, code, message, data: null }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function ok<T>(data: T, message = '요청이 정상 처리되었습니다.') {
  return new Response(JSON.stringify({ success: true, code: '200', message, data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function intParam(value: string | null | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function shortId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function toListItem(c: CampaignDetailResponse): CampaignListItem {
  return {
    campaignId: c.campaignId,
    campaignName: c.campaignName,
    status: c.status,
    scheduledSendAt: c.scheduledSendAt,
    sendCompletedAt: c.sendCompletedAt,
    totalRecipientCount: c.totalRecipientCount,
    sendSuccessCount: c.sendSuccessCount,
    sendFailedCount: c.sendFailedCount,
    viewedCount: c.viewedCount,
    createdAt: c.createdAt,
  };
}

function toCampaignSummary(c: CampaignDetailResponse): DashboardCampaignSummaryCard {
  const viewRate =
    c.totalRecipientCount > 0
      ? Math.round((c.viewedCount / c.totalRecipientCount) * 100) / 100
      : 0;
  return {
    campaignId: c.campaignId,
    campaignName: c.campaignName,
    status: c.status,
    sendCompletedAt: c.sendCompletedAt,
    totalRecipientCount: c.totalRecipientCount,
    sendSuccessCount: c.sendSuccessCount,
    sendFailedCount: c.sendFailedCount,
    viewedCount: c.viewedCount,
    unviewedCount: c.unviewedCount,
    viewRate,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Auth (BE 자리표시자)
 * ──────────────────────────────────────────────────────────────────────────── */
post('/auth/admin/login', async ({ body }) => {
  const { email, password } = (body ?? {}) as { email?: string; password?: string };
  if (!email || !password) {
    return fail('AUT_INVALID_INPUT', '이메일과 비밀번호를 입력해 주세요.', 400);
  }
  const admin = db.admins.find((a) => a.email === email);
  if (!admin || password !== 'paylinker!1') {
    return fail('AUT_INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.', 401);
  }
  const token = `mock.${btoa(admin.adminId)}.${Date.now()}`;
  return ok({ token, admin });
});

post('/auth/admin/logout', async () => ok({}));

/* ────────────────────────────────────────────────────────────────────────────
 * User
 * ──────────────────────────────────────────────────────────────────────────── */
get('/users/me', async ({ request }) => {
  const auth = request.headers.get('Authorization') ?? '';
  const match = auth.match(/Bearer mock\.([^.]+)\./);
  if (!match) return fail('AUT_REQUIRED', '로그인이 필요합니다.', 401);
  let adminId: string;
  try {
    adminId = atob(match[1]);
  } catch {
    return fail('AUT_INVALID_TOKEN', '세션이 만료되었습니다. 다시 로그인해 주세요.', 401);
  }
  const admin = db.admins.find((a) => a.adminId === adminId);
  if (!admin) return fail('USR_NOT_FOUND', '사용자 정보를 찾을 수 없습니다.', 404);
  return ok<UserMeResponse>(admin);
});

/* ────────────────────────────────────────────────────────────────────────────
 * Dashboard
 * ──────────────────────────────────────────────────────────────────────────── */
get('/dashboard/summary', async () => {
  const totals = db.campaigns.reduce(
    (acc, c) => {
      acc.totalUnviewed += c.unviewedCount;
      acc.totalFailed += c.sendFailedCount;
      return acc;
    },
    { totalUnviewed: 0, totalFailed: 0 },
  );
  const attentionRequiredCount = db.checkItems.filter((ci) => ci.checkStatus === 'OPEN').length;
  const recent = db.campaigns
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 6)
    .map(toCampaignSummary);

  return ok<DashboardSummaryResponse>({
    totalUnviewedCount: totals.totalUnviewed,
    totalFailedCount: totals.totalFailed,
    attentionRequiredCount,
    recentCampaigns: recent,
  });
});

get('/dashboard/campaigns/:campaignId/summary', async ({ params }) => {
  const c = db.campaigns.find((it) => it.campaignId === params.campaignId);
  if (!c) return fail('CAM_NOT_FOUND', '캠페인을 찾을 수 없습니다.', 404);
  return ok<DashboardCampaignSummaryCard>(toCampaignSummary(c));
});

get('/dashboard/campaigns/:campaignId/view-trend', async ({ params }) => {
  const c = db.campaigns.find((it) => it.campaignId === params.campaignId);
  if (!c) return fail('CAM_NOT_FOUND', '캠페인을 찾을 수 없습니다.', 404);

  const points: DashboardViewTrendPoint[] = [];
  const startedAt = c.sendStartedAt ? new Date(c.sendStartedAt).getTime() : Date.now();
  let cumulativeViewed = 0;
  for (let i = 0; i < 12; i += 1) {
    const bucketTs = startedAt + i * 2 * 60 * 60 * 1000;
    if (bucketTs > Date.now()) break;
    const increment = Math.max(0, Math.round(c.totalRecipientCount / (15 + i * 0.7)));
    cumulativeViewed = Math.min(c.viewedCount, cumulativeViewed + increment);
    const rate =
      c.totalRecipientCount > 0
        ? Math.round((cumulativeViewed / c.totalRecipientCount) * 100) / 100
        : 0;
    points.push({
      snapshotAt: new Date(bucketTs).toISOString(),
      viewedCount: cumulativeViewed,
      viewRate: rate,
    });
  }
  const currentRate =
    c.totalRecipientCount > 0
      ? Math.round((c.viewedCount / c.totalRecipientCount) * 100) / 100
      : 0;
  return ok<DashboardViewTrendResponse>({
    campaignId: c.campaignId,
    campaignName: c.campaignName,
    currentViewRate: currentRate,
    totalRecipientCount: c.totalRecipientCount,
    points,
  });
});

get('/dashboard/campaigns/:campaignId/unviewed-recipients', async ({ params }) => {
  const c = db.campaigns.find((it) => it.campaignId === params.campaignId);
  if (!c) return fail('CAM_NOT_FOUND', '캠페인을 찾을 수 없습니다.', 404);
  const sendStartedTs = c.sendStartedAt
    ? new Date(c.sendStartedAt).getTime()
    : Date.now() - 1 * 60 * 60 * 1000;
  const unviewed = db.recipients
    .filter((r) => r.campaignId === c.campaignId && !r.isViewed && r.sendStatus === 'SUCCESS')
    .slice(0, 4);
  const previews: DashboardUnviewedRecipientPreview[] = unviewed.map((r) => {
    const elapsedHours = Math.max(0, Math.floor((Date.now() - sendStartedTs) / (60 * 60 * 1000)));
    return {
      recipientId: r.campaignRecipientId,
      name: r.name,
      employeeNo: r.employeeNo,
      elapsedHours,
    };
  });
  const maxElapsedHours = previews.reduce((m, p) => Math.max(m, p.elapsedHours), 0);
  return ok<DashboardUnviewedResponse>({
    campaignId: c.campaignId,
    totalUnviewedCount: c.unviewedCount,
    maxElapsedHours,
    previews,
  });
});

get('/dashboard/campaigns/:campaignId/send-failures', async ({ params }) => {
  const c = db.campaigns.find((it) => it.campaignId === params.campaignId);
  if (!c) return fail('CAM_NOT_FOUND', '캠페인을 찾을 수 없습니다.', 404);
  const failed = db.recipients
    .filter((r) => r.campaignId === c.campaignId && r.sendStatus === 'FAILED')
    .slice(0, 4);
  const previews: DashboardFailedRecipientPreview[] = failed.map((r) => ({
    campaignRecipientId: r.campaignRecipientId,
    name: r.name,
    department: r.department,
    email: r.maskedEmail,
    failureReason: r.failureReason ?? 'UNKNOWN',
  }));
  return ok<DashboardFailureResponse>({
    campaignId: c.campaignId,
    totalFailedCount: c.sendFailedCount,
    previews,
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Campaigns — CRUD
 * ──────────────────────────────────────────────────────────────────────────── */
get('/campaigns', async ({ query }) => {
  const page = intParam(query.get('page'), 1);
  const pageSize = intParam(query.get('pageSize'), 20);
  const status = query.get('status');
  const keyword = query.get('keyword')?.toLowerCase() ?? '';

  let items = db.campaigns.slice();
  if (status) items = items.filter((c) => c.status === status);
  if (keyword) items = items.filter((c) => c.campaignName.toLowerCase().includes(keyword));
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const totalCount = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize).map(toListItem);
  return ok<CampaignListResponse>({
    totalCount,
    page,
    pageSize,
    items: paged,
  });
});

get('/campaigns/:id', async ({ params }) => {
  const c = db.campaigns.find((it) => it.campaignId === params.id);
  if (!c) return fail('CAM_NOT_FOUND', '캠페인을 찾을 수 없습니다.', 404);
  return ok<CampaignDetailResponse>(c);
});

post('/campaigns', async ({ body }) => {
  const input = (body ?? {}) as CampaignCreateRequest;
  if (
    !input.campaignName ||
    input.campaignName.length < 1 ||
    input.campaignName.length > 20
  ) {
    return fail('CAM_INVALID_INPUT', '캠페인명은 1~20자여야 합니다.', 400);
  }
  const created: CampaignDetailResponse = {
    campaignId: shortId('cmp'),
    campaignName: input.campaignName,
    status: 'DRAFT',
    emailSubject: input.emailSubject ?? '',
    emailDescription: input.emailDescription ?? '',
    linkTtlHours: input.linkTtlHours ?? 48,
    allowOneTimeLink: input.allowOneTimeLink ?? true,
    allowResendRequest: input.allowResendRequest ?? true,
    resendRequestLimit: input.resendRequestLimit ?? 1,
    maxRecipients: input.maxRecipients ?? 100000,
    maxDailyCount: input.maxDailyCount ?? 100000,
    scheduledSendAt: input.scheduledSendAt ?? null,
    sendStartedAt: null,
    sendCompletedAt: null,
    cancelledAt: null,
    totalRecipientCount: 0,
    sendSuccessCount: 0,
    sendFailedCount: 0,
    viewedCount: 0,
    unviewedCount: 0,
    createdAt: new Date().toISOString(),
  };
  db.campaigns.unshift(created);
  return ok<CampaignCreateResponse>({
    campaignId: created.campaignId,
    campaignName: created.campaignName,
    status: created.status,
    createdAt: created.createdAt,
  });
});

patch('/campaigns/:id', async ({ params, body }) => {
  const idx = db.campaigns.findIndex((c) => c.campaignId === params.id);
  if (idx === -1) return fail('CAM_NOT_FOUND', '캠페인을 찾을 수 없습니다.', 404);
  const current = db.campaigns[idx];
  if (!(['DRAFT', 'READY', 'SCHEDULED'] as CampaignStatus[]).includes(current.status)) {
    return fail('CAM_NOT_EDITABLE', '발송이 시작된 캠페인은 수정할 수 없습니다.', 409);
  }
  const input = (body ?? {}) as CampaignUpdateRequest;
  if (
    input.campaignName !== undefined &&
    (input.campaignName.length < 1 || input.campaignName.length > 20)
  ) {
    return fail('CAM_INVALID_INPUT', '캠페인명은 1~20자여야 합니다.', 400);
  }
  db.campaigns[idx] = { ...current, ...input };
  return ok<CampaignDetailResponse>(db.campaigns[idx]);
});

patch('/campaigns/:id/schedule', async ({ params, body }) => {
  const idx = db.campaigns.findIndex((c) => c.campaignId === params.id);
  if (idx === -1) return fail('CAM_NOT_FOUND', '캠페인을 찾을 수 없습니다.', 404);
  const { scheduledSendAt } = (body ?? {}) as { scheduledSendAt?: string };
  if (!scheduledSendAt) return fail('RSV_INVALID_INPUT', '예약 시각을 입력해 주세요.', 400);
  const scheduled = new Date(scheduledSendAt);
  if (Number.isNaN(scheduled.getTime()) || scheduled.getTime() < Date.now() + 5 * 60 * 1000) {
    return fail('RSV_INVALID_TIME', '예약 시각은 현재로부터 최소 5분 후여야 합니다.', 400);
  }
  db.campaigns[idx] = { ...db.campaigns[idx], status: 'SCHEDULED', scheduledSendAt };
  return ok<CampaignScheduleResponse>({
    campaignId: db.campaigns[idx].campaignId,
    status: db.campaigns[idx].status,
    scheduledSendAt,
  });
});

patch('/campaigns/:id/cancel', async ({ params }) => {
  const idx = db.campaigns.findIndex((c) => c.campaignId === params.id);
  if (idx === -1) return fail('CAM_NOT_FOUND', '캠페인을 찾을 수 없습니다.', 404);
  const current = db.campaigns[idx];
  if (!(['DRAFT', 'READY', 'SCHEDULED'] as CampaignStatus[]).includes(current.status)) {
    return fail('CAM_NOT_CANCELLABLE', '발송이 시작된 캠페인은 취소할 수 없습니다.', 409);
  }
  const cancelledAt = new Date().toISOString();
  db.campaigns[idx] = { ...current, status: 'CANCELLED', cancelledAt };
  return ok<CampaignCancelResponse>({
    campaignId: current.campaignId,
    status: 'CANCELLED',
    cancelledAt,
  });
});

post('/campaigns/:id/send', async ({ params }) => {
  const idx = db.campaigns.findIndex((c) => c.campaignId === params.id);
  if (idx === -1) return fail('CAM_NOT_FOUND', '캠페인을 찾을 수 없습니다.', 404);
  const current = db.campaigns[idx];
  if (!(['READY', 'DRAFT', 'SCHEDULED'] as CampaignStatus[]).includes(current.status)) {
    return fail('CAM_NOT_SENDABLE', '발송 가능한 상태가 아닙니다.', 409);
  }
  const sendStartedAt = new Date().toISOString();
  db.campaigns[idx] = { ...current, status: 'SENDING', sendStartedAt };
  const recipients = db.recipients.filter((r) => r.campaignId === current.campaignId);
  const queuedJobCount = recipients.length;
  setTimeout(() => {
    const total = recipients.length;
    const failed = Math.floor(total * 0.05);
    const success = total - failed;
    db.campaigns[idx] = {
      ...db.campaigns[idx],
      status: 'SENT',
      sendCompletedAt: new Date().toISOString(),
      totalRecipientCount: total,
      sendSuccessCount: success,
      sendFailedCount: failed,
      viewedCount: 0,
      unviewedCount: success,
    };
  }, 2000);
  return ok<CampaignSendRequestResponse>({
    campaignId: current.campaignId,
    status: 'SENDING',
    sendStartedAt,
    queuedJobCount,
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Reminders / Manual resend
 * ──────────────────────────────────────────────────────────────────────────── */
post('/campaigns/:id/reminders', async ({ params, body }) => {
  const input = (body ?? {}) as ReminderRequest;
  if (!input.target) {
    return fail('SND_INVALID_INPUT', '리마인더 대상을 지정해 주세요.', 400);
  }
  const idSet =
    input.target === 'SELECTED' && input.campaignRecipientIds
      ? new Set(input.campaignRecipientIds)
      : null;
  if (input.target === 'SELECTED' && (!idSet || idSet.size === 0)) {
    return fail('SND_INVALID_INPUT', '선택된 수신자가 없습니다.', 400);
  }
  const targets = db.recipients.filter(
    (r) =>
      r.campaignId === params.id &&
      !r.isViewed &&
      r.sendStatus === 'SUCCESS' &&
      (idSet ? idSet.has(r.campaignRecipientId) : true),
  );
  const sentAt = new Date().toISOString();
  targets.forEach((r) => {
    r.reminderCount += 1;
    r.lastReminderSentAt = sentAt;
  });
  return ok<ReminderResponse>({
    campaignId: params.id,
    queuedCount: targets.length,
    skippedExpiredCount: 0,
    requestedAt: sentAt,
  });
});

post('/campaigns/:id/resends', async ({ params, body }) => {
  const input = (body ?? {}) as ManualResendRequest;
  if (!input.target) {
    return fail('SND_INVALID_INPUT', '재발송 대상을 지정해 주세요.', 400);
  }
  const idSet =
    input.target === 'SELECTED' && input.campaignRecipientIds
      ? new Set(input.campaignRecipientIds)
      : null;
  if (input.target === 'SELECTED' && (!idSet || idSet.size === 0)) {
    return fail('SND_INVALID_INPUT', '선택된 수신자가 없습니다.', 400);
  }
  const excludeReasons = new Set(
    input.excludeFailureReasons ?? ['INVALID_EMAIL', 'BLOCKED', 'COMPLAINT'],
  );
  const allFailed = db.recipients.filter(
    (r) =>
      r.campaignId === params.id &&
      r.sendStatus === 'FAILED' &&
      (idSet ? idSet.has(r.campaignRecipientId) : true),
  );
  const skipped = allFailed.filter((r) => r.failureReason && excludeReasons.has(r.failureReason));
  const targets = allFailed.filter(
    (r) => !r.failureReason || !excludeReasons.has(r.failureReason),
  );
  targets.forEach((r) => {
    r.sendStatus = 'QUEUED';
    r.retryCount += 1;
  });
  return ok<ManualResendResponse>({
    campaignId: params.id,
    queuedCount: targets.length,
    skippedPermanentFailureCount: skipped.length,
    requestedAt: new Date().toISOString(),
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Recipient upload + validation
 * ──────────────────────────────────────────────────────────────────────────── */
post('/campaigns/:id/recipients/upload', async ({ params, query, body }) => {
  const uploadType = (query.get('uploadType') ?? 'FULL_REPLACE') as 'FULL_REPLACE' | 'APPEND';
  let filename = 'recipients.csv';
  if (body instanceof FormData) {
    const file = body.get('file');
    if (file instanceof File) filename = file.name;
  }
  const totalRowCount = 120 + Math.floor(Math.random() * 11);
  const errorRowCount = 2;
  const duplicateRowCount = 1;
  const validRowCount = totalRowCount - errorRowCount - duplicateRowCount;

  const baseSeed =
    uploadType === 'APPEND'
      ? db.recipients.filter((r) => r.campaignId === params.id).length
      : 0;
  const newRecipients = makeMockRecipientsForUpload(params.id, validRowCount, baseSeed);

  if (uploadType === 'FULL_REPLACE') {
    db.recipients = db.recipients.filter((r) => r.campaignId !== params.id);
  }
  db.recipients.push(...newRecipients);

  const uploadBatchId = shortId('ub');
  db.recipientUploadBatches.set(uploadBatchId, {
    uploadBatchId,
    campaignId: params.id,
    totalRowCount,
    validRowCount,
    errorRowCount,
    duplicateRowCount,
    errors: [
      {
        rowNumber: 47,
        column: 'email',
        errorType: 'INVALID_FORMAT',
        rawValue: 'not-an-email',
        message: '이메일 형식이 올바르지 않습니다 (예: user@example.com)',
      },
      {
        rowNumber: 88,
        column: 'employeeNo',
        errorType: 'DUPLICATE',
        rawValue: 'E20240234',
        message: '사번이 중복됩니다 (E20240234)',
      },
    ],
  });

  // bump campaign counts
  const cIdx = db.campaigns.findIndex((c) => c.campaignId === params.id);
  if (cIdx !== -1) {
    const newTotal = db.recipients.filter((r) => r.campaignId === params.id).length;
    const status = db.campaigns[cIdx].status === 'DRAFT' ? 'READY' : db.campaigns[cIdx].status;
    db.campaigns[cIdx] = {
      ...db.campaigns[cIdx],
      totalRecipientCount: newTotal,
      status,
    };
  }
  // keep filename in scope to avoid TS unused warning
  void filename;

  return ok<RecipientUploadResponse>({
    uploadBatchId,
    campaignId: params.id,
    totalRowCount,
    validRowCount,
    errorRowCount,
    duplicateRowCount,
  });
});

get('/campaigns/:id/recipients/upload/:uploadBatchId/validation', async ({ params }) => {
  const batch = db.recipientUploadBatches.get(params.uploadBatchId);
  if (!batch || batch.campaignId !== params.id) {
    return fail('UPB_NOT_FOUND', '업로드 배치를 찾을 수 없습니다.', 404);
  }
  return ok<RecipientValidationResponse>({
    uploadBatchId: batch.uploadBatchId,
    campaignId: batch.campaignId,
    totalRowCount: batch.totalRowCount,
    validRowCount: batch.validRowCount,
    errorRowCount: batch.errorRowCount,
    duplicateRowCount: batch.duplicateRowCount,
    canProceed: batch.errorRowCount === 0 && batch.validRowCount > 0,
    errors: batch.errors,
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Document upload + match results
 * ──────────────────────────────────────────────────────────────────────────── */
post('/campaigns/:id/documents/upload', async ({ params, body }) => {
  let filename = 'documents.zip';
  if (body instanceof FormData) {
    const file = body.get('file');
    if (file instanceof File) filename = file.name;
  }
  void filename;

  const recipients = db.recipients.filter((r) => r.campaignId === params.id);
  // 25명에 1명꼴로 UNMATCHED
  recipients.forEach((r, i) => {
    r.documentMatchStatus = i % 25 === 0 ? 'UNMATCHED' : 'MATCHED';
  });
  // 매치 결과 재구성
  db.documentMatches = db.documentMatches.filter((m) => {
    const r = db.recipients.find((rr) => rr.campaignRecipientId === m.campaignRecipientId);
    return r?.campaignId !== params.id;
  });
  const newMatches: DocumentMatchItem[] = recipients.map((r) => ({
    campaignRecipientId: r.campaignRecipientId,
    recipientName: r.name,
    employeeNo: r.employeeNo,
    email: r.email,
    matchStatus: r.documentMatchStatus ?? 'UNMATCHED',
    matchKey: r.employeeNo,
    documentId: r.documentMatchStatus === 'MATCHED' ? `doc_${r.campaignRecipientId}` : null,
  }));
  db.documentMatches.push(...newMatches);

  const matchedCount = newMatches.filter((m) => m.matchStatus === 'MATCHED').length;
  const unmatchedRecipientCount = newMatches.filter((m) => m.matchStatus === 'UNMATCHED').length;
  const totalDocumentCount = matchedCount; // 1:1 매칭 가정
  const unmatchedDocumentCount = 0;
  const duplicateMatchCount = 0;

  const uploadBatchId = shortId('ub');
  db.documentUploadBatches.set(uploadBatchId, { campaignId: params.id });

  return ok<DocumentUploadResponse>({
    uploadBatchId,
    campaignId: params.id,
    totalDocumentCount,
    matchedCount,
    unmatchedDocumentCount,
    unmatchedRecipientCount,
    duplicateMatchCount,
  });
});

get('/campaigns/:id/documents/match-results', async ({ params, query }) => {
  const filter = query.get('filter');
  let items = db.documentMatches.filter((m) => {
    const r = db.recipients.find((rr) => rr.campaignRecipientId === m.campaignRecipientId);
    return r?.campaignId === params.id;
  });
  if (filter === 'UNMATCHED') items = items.filter((m) => m.matchStatus === 'UNMATCHED');
  if (filter === 'DUPLICATE_MATCH') items = items.filter((m) => m.matchStatus === 'DUPLICATE_MATCH');
  if (filter === 'MISMATCHED') items = items.filter((m) => m.matchStatus === 'MISMATCHED');

  const totalRecipientCount = db.recipients.filter((r) => r.campaignId === params.id).length;
  const matchedCount = items.filter((m) => m.matchStatus === 'MATCHED').length;
  const unmatchedRecipientCount = db.documentMatches.filter((m) => {
    const r = db.recipients.find((rr) => rr.campaignRecipientId === m.campaignRecipientId);
    return r?.campaignId === params.id && m.matchStatus === 'UNMATCHED';
  }).length;
  const duplicateMatchCount = db.documentMatches.filter((m) => {
    const r = db.recipients.find((rr) => rr.campaignRecipientId === m.campaignRecipientId);
    return r?.campaignId === params.id && m.matchStatus === 'DUPLICATE_MATCH';
  }).length;
  const totalDocumentCount = matchedCount;

  return ok<DocumentMatchResultsResponse>({
    campaignId: params.id,
    totalRecipientCount,
    totalDocumentCount,
    matchedCount,
    unmatchedRecipientCount,
    duplicateMatchCount,
    canProceed: unmatchedRecipientCount === 0 && duplicateMatchCount === 0,
    items,
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Final review
 * ──────────────────────────────────────────────────────────────────────────── */
get('/campaigns/:id/final-review', async ({ params }) => {
  const c = db.campaigns.find((it) => it.campaignId === params.id);
  if (!c) return fail('CAM_NOT_FOUND', '캠페인을 찾을 수 없습니다.', 404);

  const matches = db.documentMatches.filter((m) => {
    const r = db.recipients.find((rr) => rr.campaignRecipientId === m.campaignRecipientId);
    return r?.campaignId === params.id;
  });
  const matchedDocumentCount = matches.filter((m) => m.matchStatus === 'MATCHED').length;
  const unmatchedRecipientCount = matches.filter((m) => m.matchStatus === 'UNMATCHED').length;
  const duplicateMatchCount = matches.filter((m) => m.matchStatus === 'DUPLICATE_MATCH').length;

  const blockingIssues: string[] = [];
  if (c.totalRecipientCount === 0) blockingIssues.push('수신자가 업로드되지 않았습니다.');
  if (unmatchedRecipientCount > 0)
    blockingIssues.push(`명세서가 매칭되지 않은 수신자 ${unmatchedRecipientCount}명이 있습니다.`);
  if (duplicateMatchCount > 0)
    blockingIssues.push(`중복 매칭된 수신자 ${duplicateMatchCount}명이 있습니다.`);

  const canSend =
    c.totalRecipientCount > 0 && unmatchedRecipientCount === 0 && duplicateMatchCount === 0;

  return ok<CampaignFinalReviewResponse>({
    campaignId: c.campaignId,
    campaignName: c.campaignName,
    emailSubject: c.emailSubject,
    emailDescription: c.emailDescription,
    linkTtlHours: c.linkTtlHours,
    totalRecipientCount: c.totalRecipientCount,
    matchedDocumentCount,
    unmatchedRecipientCount,
    duplicateMatchCount,
    scheduledSendAt: c.scheduledSendAt,
    canSend,
    blockingIssues,
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Send failures
 * ──────────────────────────────────────────────────────────────────────────── */
get('/campaigns/:id/send-failures', async ({ params, query }) => {
  const page = intParam(query.get('page'), 1);
  const pageSize = intParam(query.get('pageSize'), 20);
  const failureReason = query.get('failureReason');
  let items = db.recipients.filter(
    (r) => r.campaignId === params.id && r.sendStatus === 'FAILED',
  );
  if (failureReason) items = items.filter((r) => r.failureReason === failureReason);

  const totalCount = items.length;
  const start = (page - 1) * pageSize;
  const paged: SendFailureItem[] = items.slice(start, start + pageSize).map((r) => ({
    campaignRecipientId: r.campaignRecipientId,
    name: r.name,
    department: r.department,
    email: r.maskedEmail,
    failureReason: r.failureReason ?? 'UNKNOWN',
    failedAt: r.failedAt ?? new Date().toISOString(),
    retryCount: r.retryCount,
    currentStatus: r.sendStatus ?? 'FAILED',
    lastSendJobId: r.lastSendJobId,
  }));
  return ok<SendFailureResponse>({
    campaignId: params.id,
    totalCount,
    page,
    pageSize,
    items: paged,
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * View history
 * ──────────────────────────────────────────────────────────────────────────── */
get('/campaigns/:id/view-history', async ({ params, query }) => {
  const page = intParam(query.get('page'), 1);
  const pageSize = intParam(query.get('pageSize'), 20);
  const filter = (query.get('filter') ?? 'ALL') as ViewHistoryFilter;

  let items = db.recipients.filter(
    (r) => r.campaignId === params.id && r.sendStatus === 'SUCCESS',
  );
  if (filter === 'VIEWED') items = items.filter((r) => r.isViewed);
  if (filter === 'UNVIEWED') items = items.filter((r) => !r.isViewed);

  const totalCount = items.length;
  const viewedCount = items.filter((r) => r.isViewed).length;
  const unviewedCount = totalCount - viewedCount;
  const start = (page - 1) * pageSize;
  const paged: ViewHistoryItem[] = items.slice(start, start + pageSize).map((r) => ({
    campaignRecipientId: r.campaignRecipientId,
    name: r.name,
    employeeNo: r.employeeNo,
    email: r.maskedEmail,
    isViewed: r.isViewed,
    firstViewedAt: r.firstViewedAt,
    viewCount: r.viewCount,
    linkStatus: r.linkStatus,
    linkExpiresAt: r.linkExpiresAt,
  }));
  return ok<ViewHistoryResponse>({
    campaignId: params.id,
    totalCount,
    viewedCount,
    unviewedCount,
    page,
    pageSize,
    items: paged,
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Notifications — resend-requests / check-items
 * ──────────────────────────────────────────────────────────────────────────── */
get('/notifications/resend-requests', async ({ query }) => {
  const page = intParam(query.get('page'), 1);
  const pageSize = intParam(query.get('pageSize'), 20);
  const status = query.get('status');
  const campaignId = query.get('campaignId');
  let items = db.resendRequests.slice();
  if (status) items = items.filter((r) => r.status === status);
  if (campaignId) items = items.filter((r) => r.campaignId === campaignId);

  const totalCount = items.length;
  const pendingCount = db.resendRequests.filter((r) => r.status === 'REQUESTED').length;
  const start = (page - 1) * pageSize;
  return ok<ResendRequestListResponse>({
    totalCount,
    pendingCount,
    page,
    pageSize,
    items: items.slice(start, start + pageSize),
  });
});

patch('/notifications/resend-requests/:requestId', async ({ params, body }) => {
  const idx = db.resendRequests.findIndex((r) => r.requestId === params.requestId);
  if (idx === -1) return fail('REQ_NOT_FOUND', '재전송 요청을 찾을 수 없습니다.', 404);
  const input = (body ?? {}) as ResendRequestActionRequest;
  if (input.action !== 'APPROVE' && input.action !== 'REJECT') {
    return fail('REQ_INVALID_INPUT', '처리 액션이 잘못되었습니다.', 400);
  }
  const processedAt = new Date().toISOString();
  const newStatus = input.action === 'APPROVE' ? 'COMPLETED' : 'REJECTED';
  db.resendRequests[idx] = {
    ...db.resendRequests[idx],
    status: newStatus,
    processedAt,
    processedBy: '김운영',
  };
  const newSendJobId = input.action === 'APPROVE' ? shortId('sj') : null;
  const newLinkExpiresAt =
    input.action === 'APPROVE' ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() : null;
  return ok<ResendRequestActionResponse>({
    requestId: params.requestId,
    status: newStatus,
    processedAt,
    newSendJobId,
    newLinkExpiresAt,
  });
});

get('/notifications/check-items', async ({ query }) => {
  const page = intParam(query.get('page'), 1);
  const pageSize = intParam(query.get('pageSize'), 20);
  const itemType = query.get('itemType');
  const status = query.get('status');
  const campaignId = query.get('campaignId');
  let items = db.checkItems.slice();
  if (itemType) items = items.filter((c) => c.itemType === itemType);
  if (status) items = items.filter((c) => c.checkStatus === status);
  if (campaignId) items = items.filter((c) => c.campaignId === campaignId);

  const totalCount = items.length;
  const openCount = db.checkItems.filter((c) => c.checkStatus === 'OPEN').length;
  const inProgressCount = db.checkItems.filter((c) => c.checkStatus === 'IN_PROGRESS').length;
  const start = (page - 1) * pageSize;
  return ok<CheckItemListResponse>({
    totalCount,
    openCount,
    inProgressCount,
    page,
    pageSize,
    items: items.slice(start, start + pageSize),
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * HR 시스템 연동
 * ──────────────────────────────────────────────────────────────────────────── */
get('/hr/employees', async ({ query }) => {
  const dept = query.get('department');
  const sync = structuredClone(MOCK_HR_SYNC);
  if (dept) {
    sync.employees = sync.employees.filter((e) => e.department === dept);
    sync.activeCount = sync.employees.filter((e) => e.isActive).length;
    sync.totalCount = sync.employees.length;
  }
  return ok(sync);
});

/* ────────────────────────────────────────────────────────────────────────────
 * Recipient secure-link flow (BE 자리표시자, 유지)
 * ──────────────────────────────────────────────────────────────────────────── */
post('/secure-links/validate', async ({ body }) => {
  const { token } = (body ?? {}) as { token?: string };
  if (!token) return fail('LNK_INVALID_INPUT', '토큰이 없습니다.', 400);

  const DEMO: Record<string, string> = {
    'demo-valid': 'cr_cmp_2026_05_2',
    'demo-expired': 'EXPIRED',
    'demo-used': 'REUSED',
    'demo-invalid': 'INVALID_LINK',
    'demo-unauth': 'UNAUTHORIZED',
  };
  const target = DEMO[token] ?? 'INVALID_LINK';
  if (target === 'EXPIRED') return fail('LNK_EXPIRED', '링크가 만료되었습니다.', 410);
  if (target === 'REUSED') return fail('LNK_REUSED', '이미 사용된 링크입니다.', 409);
  if (target === 'INVALID_LINK') return fail('LNK_INVALID', '잘못된 링크입니다.', 404);
  if (target === 'UNAUTHORIZED') return fail('LNK_UNAUTHORIZED', '접근 권한이 없습니다.', 403);

  const cr = db.recipients.find((r) => r.campaignRecipientId === target);
  if (!cr) return fail('LNK_INVALID', '잘못된 링크입니다.', 404);
  const campaign = db.campaigns.find((c) => c.campaignId === cr.campaignId);
  if (!campaign) return fail('LNK_INVALID', '잘못된 링크입니다.', 404);

  const sessionToken = `ls_${btoa(`${cr.campaignRecipientId}|${Date.now()}`)}`;
  const expiresAtMs = Date.now() + 15 * 60 * 1000;
  db.linkSessions.set(sessionToken, {
    campaignRecipientId: cr.campaignRecipientId,
    expiresAt: expiresAtMs,
  });
  return ok<LinkSessionResponse>({
    linkSessionToken: sessionToken,
    campaignRecipientId: cr.campaignRecipientId,
    campaignId: cr.campaignId,
    campaignName: campaign.campaignName,
    recipientName: cr.name,
    documentCount: 1,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(expiresAtMs).toISOString(),
  });
});

get('/documents/me', async ({ request }) => {
  const auth = request.headers.get('Authorization') ?? '';
  const match = auth.match(/Bearer (ls_[A-Za-z0-9+/=]+)/);
  if (!match) return fail('LNK_REQUIRED', '링크 세션이 필요합니다.', 401);
  const session = db.linkSessions.get(match[1]);
  if (!session || session.expiresAt < Date.now()) {
    return fail('LNK_EXPIRED', '세션이 만료되었습니다.', 401);
  }
  const cr = db.recipients.find((r) => r.campaignRecipientId === session.campaignRecipientId);
  if (!cr) return fail('DOC_NOT_FOUND', '명세서를 찾을 수 없습니다.', 404);
  const campaign = db.campaigns.find((c) => c.campaignId === cr.campaignId);
  if (!campaign) return fail('DOC_NOT_FOUND', '명세서를 찾을 수 없습니다.', 404);

  return ok<RecipientDocumentResponse>({
    campaignName: campaign.campaignName,
    emailSubject: campaign.emailSubject,
    emailDescription: campaign.emailDescription,
    recipientName: cr.name,
    documents: [
      {
        documentId: `doc_${cr.campaignRecipientId}`,
        filename: `paystub_${cr.employeeNo}.pdf`,
        documentType: 'PDF',
        fileSizeBytes: 184_000,
        inlineHtml: buildPaystubHtml(cr.name, cr.department, cr.employeeNo, campaign.campaignName),
      },
    ],
    viewedAt: cr.firstViewedAt,
    expiresAt: new Date(session.expiresAt).toISOString(),
    allowResendRequest: campaign.allowResendRequest,
  });
});

post('/documents/me/viewed', async ({ request }) => {
  const auth = request.headers.get('Authorization') ?? '';
  const match = auth.match(/Bearer (ls_[A-Za-z0-9+/=]+)/);
  if (!match) return fail('LNK_REQUIRED', '링크 세션이 필요합니다.', 401);
  const session = db.linkSessions.get(match[1]);
  if (!session) return fail('LNK_EXPIRED', '세션이 만료되었습니다.', 401);
  const cr = db.recipients.find((r) => r.campaignRecipientId === session.campaignRecipientId);
  if (cr) {
    const campaign = db.campaigns.find((c) => c.campaignId === cr.campaignId);
    const isFirstView = !cr.isViewed;
    cr.viewCount += 1;
    if (isFirstView) {
      cr.isViewed = true;
      cr.firstViewedAt = new Date().toISOString();
      const idx = db.campaigns.findIndex((c) => c.campaignId === cr.campaignId);
      if (idx !== -1) {
        db.campaigns[idx] = {
          ...db.campaigns[idx],
          viewedCount: db.campaigns[idx].viewedCount + 1,
          unviewedCount: Math.max(0, db.campaigns[idx].unviewedCount - 1),
        };
      }
    }
    if (campaign?.allowOneTimeLink) {
      cr.linkStatus = 'USED';
    }
  }
  return ok<ViewedResponse>({ viewedAt: cr?.firstViewedAt ?? new Date().toISOString() });
});

post('/secure-links/resend-request', async ({ body }) => {
  const { token, reason } = (body ?? {}) as ResendSubmitRequest;
  if (!token) return fail('LNK_INVALID_INPUT', '토큰이 없습니다.', 400);
  if (!reason) return fail('LNK_INVALID_INPUT', '재전송 사유를 선택해 주세요.', 400);
  const newRequest: ResendRequestItem = {
    requestId: shortId('rr'),
    campaignId: 'cmp_2026_05',
    campaignName: '2026년 5월 급여명세서',
    recipientName: '수신자',
    employeeNo: `E${token.slice(0, 6).toUpperCase()}`,
    email: '****@paylinker.io',
    resendReason: reason,
    status: 'REQUESTED',
    requestedAt: new Date().toISOString(),
    processedAt: null,
    processedBy: null,
  };
  db.resendRequests.unshift(newRequest);
  return ok<ResendSubmitResponse>({ requestId: newRequest.requestId, status: 'REQUESTED' });
});

/* ────────────────────────────────────────────────────────────────────────────
 * Helpers — mock recipient row generator + paystub html
 * ──────────────────────────────────────────────────────────────────────────── */
function makeMockRecipientsForUpload(
  campaignId: string,
  count: number,
  baseSeed = 0,
): MockRecipientRow[] {
  const NAMES = [
    '김민준',
    '이서연',
    '박지호',
    '최예린',
    '정우진',
    '한지민',
    '강도윤',
    '윤서아',
    '임유준',
    '오하은',
    '조시현',
    '서지안',
  ];
  const DEPS = ['인사팀', '재무팀', '개발팀', '디자인팀', '운영팀'];
  const items: MockRecipientRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const seed = baseSeed + i;
    const name = NAMES[seed % NAMES.length];
    const department = DEPS[seed % DEPS.length];
    const employeeNo = `E${(20240000 + seed * 7).toString()}`;
    const rawLocal = `${name.toLowerCase().replace(/[^a-z]/g, '')}${(seed % 99) + 1}`;
    const local = rawLocal.length > 0 ? rawLocal : `user${seed}`;
    items.push({
      campaignRecipientId: `cr_${campaignId}_${seed}_${Math.random().toString(36).slice(2, 6)}`,
      campaignId,
      name,
      department,
      employeeNo,
      email: `${local}@paylinker.io`,
      maskedEmail: `${local.slice(0, 2)}${'*'.repeat(Math.max(local.length - 2, 1))}@paylinker.io`,
      validationStatus: 'VALID',
      documentMatchStatus: null,
      sendStatus: null,
      isViewed: false,
      firstViewedAt: null,
      viewCount: 0,
      retryCount: 0,
      failureReason: null,
      failedAt: null,
      reminderCount: 0,
      lastReminderSentAt: null,
      resendRequestCount: 0,
      linkStatus: 'ACTIVE',
      linkExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      lastSendJobId: `sj_${campaignId}_${seed}`,
    });
  }
  return items;
}

function buildPaystubHtml(name: string, dept: string, empNo: string, campaignName: string) {
  return `
<div style="font-family: 'Noto Sans KR', sans-serif; color: #0f1f3d;">
  <h2 style="margin: 0 0 16px; font-size: 20px;">${campaignName}</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
    <tbody>
      <tr><td style="padding: 8px; background: #f6f8fb; width: 32%;">성명</td><td style="padding: 8px;">${name}</td></tr>
      <tr><td style="padding: 8px; background: #f6f8fb;">부서</td><td style="padding: 8px;">${dept}</td></tr>
      <tr><td style="padding: 8px; background: #f6f8fb;">사번</td><td style="padding: 8px;">${empNo}</td></tr>
    </tbody>
  </table>
  <table style="width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px;">
    <thead style="background: #0f1f3d; color: #fff;">
      <tr><th style="text-align: left; padding: 10px;">항목</th><th style="text-align: right; padding: 10px;">금액(원)</th></tr>
    </thead>
    <tbody>
      <tr><td style="padding: 10px; border-bottom: 1px solid #eceff4;">기본급</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #eceff4; font-family: 'JetBrains Mono', monospace;">3,800,000</td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #eceff4;">식대</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #eceff4; font-family: 'JetBrains Mono', monospace;">200,000</td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #eceff4;">국민연금</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #eceff4; color: #b72a30; font-family: 'JetBrains Mono', monospace;">-180,000</td></tr>
      <tr><td style="padding: 10px; border-bottom: 1px solid #eceff4;">건강보험</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #eceff4; color: #b72a30; font-family: 'JetBrains Mono', monospace;">-140,000</td></tr>
      <tr><td style="padding: 10px;">소득세</td><td style="padding: 10px; text-align: right; color: #b72a30; font-family: 'JetBrains Mono', monospace;">-220,000</td></tr>
    </tbody>
    <tfoot>
      <tr style="background: #f6f8fb;"><td style="padding: 12px; font-weight: 700;">실수령액</td><td style="padding: 12px; text-align: right; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: #00b894;">3,460,000</td></tr>
    </tfoot>
  </table>
  <p style="margin-top: 24px; font-size: 11px; color: #67748d;">본 명세서는 ${campaignName} 발송 시 자동 생성된 데모 데이터입니다.</p>
</div>`;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Fetch interceptor
 * ──────────────────────────────────────────────────────────────────────────── */
let initialised = false;
let originalFetch: typeof fetch;

function matchRoute(method: string, pathname: string) {
  for (const route of routes) {
    if (route.method !== method) continue;
    const m = pathname.match(route.pattern);
    if (m) {
      const params: Record<string, string> = {};
      route.keys.forEach((key, idx) => {
        params[key] = decodeURIComponent(m[idx + 1]);
      });
      return { route, params };
    }
  }
  return null;
}

export function installMockServer() {
  if (initialised) return;
  initialised = true;
  originalFetch = window.fetch.bind(window);
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
  const basePath = apiBase.startsWith('http') ? new URL(apiBase).pathname : apiBase;

  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : (input as Request).url;
    const request = input instanceof Request ? input : new Request(input, init);
    const u = new URL(url, window.location.origin);
    if (!u.pathname.startsWith(basePath)) {
      return originalFetch(input, init);
    }
    const apiPath = u.pathname.slice(basePath.length) || '/';
    const matched = matchRoute(request.method.toUpperCase(), apiPath);
    if (!matched) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'NOT_FOUND',
          message: `Mock 라우트를 찾을 수 없습니다: ${request.method} ${apiPath}`,
          data: null,
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }
    let body: unknown = undefined;
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      try {
        body = await request.clone().json();
      } catch {
        body = undefined;
      }
    } else if (contentType.includes('multipart/form-data')) {
      body = await request.clone().formData();
    }

    await new Promise((r) => setTimeout(r, 120 + Math.floor(Math.random() * 180)));

    try {
      const result = await matched.route.handler({
        params: matched.params,
        query: u.searchParams,
        body,
        request,
      });
      if (result instanceof Response) return result;
      return ok(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : '서버 처리 중 오류가 발생했습니다.';
      return fail('INTERNAL_ERROR', message, 500);
    }
  };
}
