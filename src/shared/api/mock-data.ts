import type {
  CampaignDetailResponse,
  CheckItemSummary,
  DocumentMatchItem,
  HrEmployee,
  HrSyncResponse,
  ResendRequestItem,
  UserMeResponse,
} from './types';

/* ────────────────────────────────────────────────────────────────────────────
 * HR 직원 시드 데이터
 * ──────────────────────────────────────────────────────────────────────────── */
const HR_DEPARTMENTS = [
  { name: '개발팀', count: 142 },
  { name: '마케팅팀', count: 87 },
  { name: '영업팀', count: 96 },
  { name: '디자인팀', count: 41 },
  { name: '인사팀', count: 18 },
  { name: '재무팀', count: 32 },
  { name: '운영팀', count: 64 },
  { name: '기획팀', count: 30 },
];

const HR_EMPLOYEE_SEEDS: Array<Omit<HrEmployee, 'employeeId'> & { active?: boolean }> = [
  { employeeNo: '001', name: '김지원', email: 'jiwon.kim@acme.co.kr', department: '마케팅팀', jobTitle: '매니저', isActive: true },
  { employeeNo: '002', name: '박서연', email: 'seoyeon.park@acme.co.kr', department: '개발팀', jobTitle: '시니어', isActive: true },
  { employeeNo: '003', name: '이도현', email: 'dohyun.lee@acme.co.kr', department: '영업팀', jobTitle: '대리', isActive: true },
  { employeeNo: '004', name: '최민준', email: 'minjun.choi@acme.co.kr', department: '디자인팀', jobTitle: '주임', isActive: true },
  { employeeNo: '005', name: '정하윤', email: 'hayoon.jung@acme.co.kr', department: '인사팀', jobTitle: '매니저', isActive: true },
  { employeeNo: '006', name: '조은우', email: 'eunwoo.jo@acme.co.kr', department: '재무팀', jobTitle: '대리', isActive: true },
  { employeeNo: '007', name: '한지호', email: 'jiho.han@acme.co.kr', department: '개발팀', jobTitle: '시니어', isActive: true },
  { employeeNo: '008', name: '황도윤', email: 'doyoon.hwang@acme.co.kr', department: '영업팀', jobTitle: '사원', isActive: true },
  { employeeNo: '009', name: '오승아', email: 'seungah.oh@acme.co.kr', department: '기획팀', jobTitle: '주임', isActive: true },
  { employeeNo: '010', name: '임채원', email: 'chaewon.lim@acme.co.kr', department: '운영팀', jobTitle: '대리', isActive: true },
  { employeeNo: '011', name: '강민서', email: 'minseo.kang@acme.co.kr', department: '개발팀', jobTitle: '주임', isActive: false },
  { employeeNo: '012', name: '유지안', email: '', department: '마케팅팀', jobTitle: '사원', isActive: true },
];

const generateHrEmployees = (): HrEmployee[] => {
  const base = HR_EMPLOYEE_SEEDS.map((s, i) => ({ ...s, employeeId: `emp_${String(i + 1).padStart(3, '0')}` }));
  // Fill up to ~510 active with generated rows
  const extra: HrEmployee[] = [];
  const depts = HR_DEPARTMENTS;
  let idx = base.length;
  for (const dept of depts) {
    const needed = Math.max(0, dept.count - base.filter((e) => e.department === dept.name).length);
    for (let k = 0; k < Math.min(needed, 10); k++) {
      idx++;
      extra.push({
        employeeId: `emp_${String(idx).padStart(3, '0')}`,
        employeeNo: String(idx).padStart(3, '0'),
        name: `직원${idx}`,
        email: `employee${idx}@acme.co.kr`,
        department: dept.name,
        jobTitle: '사원',
        isActive: true,
      });
    }
  }
  return [...base, ...extra];
};

export const MOCK_HR_EMPLOYEES: HrEmployee[] = generateHrEmployees();

export const MOCK_HR_SYNC: HrSyncResponse = {
  lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  totalCount: 512,
  activeCount: 510,
  inactiveCount: 2,
  noEmailCount: 0,
  departments: HR_DEPARTMENTS,
  employees: MOCK_HR_EMPLOYEES,
};

/* ────────────────────────────────────────────────────────────────────────────
 * 내부 시드 타입 (mock 전용 — 외부에 노출되는 응답 DTO 아님)
 * ──────────────────────────────────────────────────────────────────────────── */
export interface MockRecipientRow {
  campaignRecipientId: string;
  campaignId: string;
  name: string;
  department: string;
  employeeNo: string;
  email: string;
  maskedEmail: string;
  validationStatus: 'VALID' | 'INVALID' | 'DUPLICATE' | 'NEEDS_REVIEW';
  documentMatchStatus: 'MATCHED' | 'UNMATCHED' | 'DUPLICATE_MATCH' | 'MISMATCHED' | null;
  sendStatus: 'REQUESTED' | 'QUEUED' | 'SENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING' | 'CANCELLED' | null;
  isViewed: boolean;
  firstViewedAt: string | null;
  viewCount: number;
  retryCount: number;
  failureReason: string | null;
  failedAt: string | null;
  reminderCount: number;
  lastReminderSentAt: string | null;
  resendRequestCount: number;
  linkStatus: 'ACTIVE' | 'USED' | 'EXPIRED' | 'INVALIDATED';
  linkExpiresAt: string;
  createdAt: string;
  lastSendJobId: string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * 시간 헬퍼
 * ──────────────────────────────────────────────────────────────────────────── */
const now = Date.now();
const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

/* ────────────────────────────────────────────────────────────────────────────
 * Admin (UserMeResponse)
 * ──────────────────────────────────────────────────────────────────────────── */
export const MOCK_ADMINS: UserMeResponse[] = [
  {
    adminId: 'adm_01',
    email: 'admin@paylinker.io',
    name: '김운영',
    role: 'OWNER',
    createdAt: iso(-365 * DAY),
  },
  {
    adminId: 'adm_02',
    email: 'hr.kim@paylinker.io',
    name: '박급여',
    role: 'ADMIN',
    createdAt: iso(-200 * DAY),
  },
];

/* ────────────────────────────────────────────────────────────────────────────
 * Campaign 시드
 * ──────────────────────────────────────────────────────────────────────────── */
const campaign = (
  partial: Partial<CampaignDetailResponse> &
    Pick<CampaignDetailResponse, 'campaignId' | 'campaignName' | 'status'>,
): CampaignDetailResponse => ({
  emailSubject: '[Paylinker] 2026년 5월 급여명세서가 발행되었습니다',
  emailDescription:
    '안녕하세요. 2026년 5월 급여명세서를 안내드립니다. 본인 명세서는 아래 보안 링크를 통해 확인하실 수 있습니다.',
  linkTtlHours: 48,
  allowOneTimeLink: true,
  allowResendRequest: true,
  resendRequestLimit: 1,
  maxRecipients: 100000,
  maxDailyCount: 100000,
  scheduledSendAt: null,
  sendStartedAt: null,
  sendCompletedAt: null,
  cancelledAt: null,
  totalRecipientCount: 0,
  sendSuccessCount: 0,
  sendFailedCount: 0,
  viewedCount: 0,
  unviewedCount: 0,
  createdAt: iso(-3 * DAY),
  ...partial,
});

export const MOCK_CAMPAIGNS: CampaignDetailResponse[] = [
  campaign({
    campaignId: 'cmp_2026_05',
    campaignName: '2026년 5월 급여명세서',
    status: 'PARTIAL_FAILED',
    sendStartedAt: iso(-2 * HOUR),
    sendCompletedAt: iso(-1.5 * HOUR),
    totalRecipientCount: 124,
    sendSuccessCount: 119,
    sendFailedCount: 5,
    viewedCount: 87,
    unviewedCount: 32,
    createdAt: iso(-1 * DAY),
  }),
  campaign({
    campaignId: 'cmp_2026_04',
    campaignName: '2026년 4월 급여명세서',
    status: 'SENT',
    sendStartedAt: iso(-30 * DAY),
    sendCompletedAt: iso(-30 * DAY + 30 * 60 * 1000),
    totalRecipientCount: 122,
    sendSuccessCount: 122,
    sendFailedCount: 0,
    viewedCount: 121,
    unviewedCount: 1,
    createdAt: iso(-32 * DAY),
  }),
  campaign({
    campaignId: 'cmp_q2_bonus',
    campaignName: '2분기 인센티브 정산서',
    status: 'SCHEDULED',
    scheduledSendAt: iso(2 * DAY + 9 * HOUR),
    totalRecipientCount: 38,
    createdAt: iso(-6 * HOUR),
  }),
  campaign({
    campaignId: 'cmp_2026_03',
    campaignName: '2026년 3월 급여명세서',
    status: 'SENT',
    sendStartedAt: iso(-60 * DAY),
    sendCompletedAt: iso(-60 * DAY + 25 * 60 * 1000),
    totalRecipientCount: 120,
    sendSuccessCount: 120,
    sendFailedCount: 0,
    viewedCount: 120,
    unviewedCount: 0,
    createdAt: iso(-62 * DAY),
  }),
  campaign({
    campaignId: 'cmp_yearend_bonus',
    campaignName: '2025년 결산 보너스 정산서',
    status: 'DRAFT',
    totalRecipientCount: 0,
    createdAt: iso(-2 * HOUR),
  }),
  campaign({
    campaignId: 'cmp_2026_02',
    campaignName: '2026년 2월 급여명세서',
    status: 'SENT',
    sendStartedAt: iso(-90 * DAY),
    sendCompletedAt: iso(-90 * DAY + 35 * 60 * 1000),
    totalRecipientCount: 118,
    sendSuccessCount: 116,
    sendFailedCount: 2,
    viewedCount: 116,
    unviewedCount: 0,
    createdAt: iso(-92 * DAY),
  }),
];

/* ────────────────────────────────────────────────────────────────────────────
 * Recipient 시드
 * ──────────────────────────────────────────────────────────────────────────── */
const DEPARTMENTS = ['인사팀', '재무팀', '개발팀', '디자인팀', '운영팀', '마케팅팀', '영업팀'];
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
  '신라온',
  '문수아',
  '권태오',
  '배지윤',
  '송재현',
  '안수빈',
];

const FAILURE_REASONS = ['INVALID_EMAIL', 'BOUNCED', 'BLOCKED', 'TEMPORARY_FAILURE'];

function makeRecipients(campaignId: string, count: number, baseSeed = 0): MockRecipientRow[] {
  const items: MockRecipientRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const seed = baseSeed + i;
    const name = NAMES[seed % NAMES.length];
    const department = DEPARTMENTS[seed % DEPARTMENTS.length];
    const employeeNo = `E${(20240000 + seed * 7).toString()}`;
    const rawLocal = `${name.toLowerCase().replace(/[^a-z]/g, '')}${(seed % 99) + 1}`;
    const localPart = rawLocal.length > 0 ? rawLocal : `user${seed}`;
    const email = `${localPart}@paylinker.io`;
    const maskedEmail = `${localPart.slice(0, 2)}${'*'.repeat(Math.max(localPart.length - 2, 1))}@paylinker.io`;
    const sendStatus: MockRecipientRow['sendStatus'] =
      seed % 23 === 0 ? 'FAILED' : seed % 9 === 0 ? 'RETRYING' : 'SUCCESS';
    const isViewed = sendStatus === 'SUCCESS' && seed % 5 !== 0;
    const failureReason = sendStatus === 'FAILED' ? FAILURE_REASONS[seed % FAILURE_REASONS.length] : null;
    const failedAt = sendStatus === 'FAILED' ? iso(-Math.floor((seed + 1) * 30 * 60 * 1000)) : null;
    items.push({
      campaignRecipientId: `cr_${campaignId}_${seed}`,
      campaignId,
      name,
      department,
      employeeNo,
      email,
      maskedEmail,
      validationStatus: seed % 47 === 0 ? 'DUPLICATE' : 'VALID',
      documentMatchStatus: seed % 31 === 0 ? 'UNMATCHED' : 'MATCHED',
      sendStatus,
      isViewed,
      firstViewedAt: isViewed ? iso(-Math.floor(seed * 12) * 60 * 1000) : null,
      viewCount: isViewed ? 1 + (seed % 3) : 0,
      retryCount: sendStatus === 'FAILED' ? 3 : sendStatus === 'RETRYING' ? 2 : 0,
      failureReason,
      failedAt,
      reminderCount: !isViewed && seed % 4 === 0 ? 1 : 0,
      lastReminderSentAt: !isViewed && seed % 4 === 0 ? iso(-3 * HOUR) : null,
      resendRequestCount: seed % 37 === 0 ? 1 : 0,
      linkStatus: isViewed ? 'USED' : 'ACTIVE',
      linkExpiresAt: iso(48 * HOUR - seed * 1000),
      createdAt: iso(-Math.floor(seed * 60_000)),
      lastSendJobId: `sj_${campaignId}_${seed}`,
    });
  }
  return items;
}

export const MOCK_RECIPIENT_ROWS: MockRecipientRow[] = [
  ...makeRecipients('cmp_2026_05', 124, 0),
  ...makeRecipients('cmp_2026_04', 122, 200),
  ...makeRecipients('cmp_q2_bonus', 38, 400),
  ...makeRecipients('cmp_2026_03', 120, 500),
];

/* ────────────────────────────────────────────────────────────────────────────
 * Document matches — cmp_2026_05 기준
 * ──────────────────────────────────────────────────────────────────────────── */
export const MOCK_DOCUMENT_MATCHES: DocumentMatchItem[] = MOCK_RECIPIENT_ROWS.filter(
  (r) => r.campaignId === 'cmp_2026_05',
).map((r) => ({
  campaignRecipientId: r.campaignRecipientId,
  recipientName: r.name,
  employeeNo: r.employeeNo,
  email: r.email,
  matchStatus: r.documentMatchStatus ?? 'UNMATCHED',
  matchKey: r.employeeNo,
  documentId: r.documentMatchStatus === 'MATCHED' ? `doc_${r.campaignRecipientId}` : null,
}));

/* ────────────────────────────────────────────────────────────────────────────
 * Resend Requests
 * ──────────────────────────────────────────────────────────────────────────── */
export const MOCK_RESEND_REQUESTS: ResendRequestItem[] = [
  {
    requestId: 'rr_001',
    campaignId: 'cmp_2026_05',
    campaignName: '2026년 5월 급여명세서',
    recipientName: '이서연',
    employeeNo: 'E20240007',
    email: 'le****@paylinker.io',
    resendReason: 'EXPIRED',
    status: 'REQUESTED',
    requestedAt: iso(-1 * HOUR),
    processedAt: null,
    processedBy: null,
  },
  {
    requestId: 'rr_002',
    campaignId: 'cmp_2026_05',
    campaignName: '2026년 5월 급여명세서',
    recipientName: '박지호',
    employeeNo: 'E20240014',
    email: 'pa****@paylinker.io',
    resendReason: 'REUSED',
    status: 'REQUESTED',
    requestedAt: iso(-3 * HOUR),
    processedAt: null,
    processedBy: null,
  },
  {
    requestId: 'rr_003',
    campaignId: 'cmp_2026_04',
    campaignName: '2026년 4월 급여명세서',
    recipientName: '문수아',
    employeeNo: 'E20240091',
    email: 'mo****@paylinker.io',
    resendReason: 'EXPIRED',
    status: 'COMPLETED',
    requestedAt: iso(-2 * DAY),
    processedAt: iso(-2 * DAY + 30 * 60 * 1000),
    processedBy: '김운영',
  },
];

/* ────────────────────────────────────────────────────────────────────────────
 * Check Items
 * ──────────────────────────────────────────────────────────────────────────── */
export const MOCK_CHECK_ITEMS: CheckItemSummary[] = [
  {
    checkItemId: 'ci_001',
    itemType: 'RESEND_REQUEST',
    checkStatus: 'OPEN',
    campaignId: 'cmp_2026_05',
    campaignName: '2026년 5월 급여명세서',
    recipientName: '이서연',
    relatedRequestId: 'rr_001',
    createdAt: iso(-1 * HOUR),
    deepLink: '/admin/notifications/resend-requests?requestId=rr_001',
  },
  {
    checkItemId: 'ci_002',
    itemType: 'UNVIEWED_RECIPIENT',
    checkStatus: 'OPEN',
    campaignId: 'cmp_2026_05',
    campaignName: '2026년 5월 급여명세서',
    recipientName: null,
    relatedRequestId: null,
    createdAt: iso(-2 * HOUR),
    deepLink: '/admin/campaigns/cmp_2026_05/view-history?filter=UNVIEWED',
  },
  {
    checkItemId: 'ci_003',
    itemType: 'FINAL_FAILED',
    checkStatus: 'OPEN',
    campaignId: 'cmp_2026_05',
    campaignName: '2026년 5월 급여명세서',
    recipientName: null,
    relatedRequestId: null,
    createdAt: iso(-5 * HOUR),
    deepLink: '/admin/campaigns/cmp_2026_05/send-failures',
  },
  {
    checkItemId: 'ci_004',
    itemType: 'UNVIEWED_RECIPIENT',
    checkStatus: 'RESOLVED',
    campaignId: 'cmp_2026_04',
    campaignName: '2026년 4월 급여명세서',
    recipientName: null,
    relatedRequestId: null,
    createdAt: iso(-30 * DAY),
    deepLink: '/admin/campaigns/cmp_2026_04/view-history?filter=UNVIEWED',
  },
];
