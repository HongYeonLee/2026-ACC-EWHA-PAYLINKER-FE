import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { campaignApi } from './api';
import { PageHeader } from '../common/PageHeader';
import {
  ApiBadge,
  ApiBadgeGroup,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Icon,
  Modal,
  Pagination,
  Pill,
  SkeletonRow,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  Tabs,
  toast,
} from '../../../shared/ui';
import { CampaignStatusBadge } from '../../../shared/ui/StatusBadge';
import {
  MATCH_STATUS_LABEL,
  SEND_FAILURE_REASON_LABEL,
  type CampaignStatus,
} from '../../../shared/constants/status';
import { formatDate, formatNumber, maskEmail } from '../../../shared/lib/format';
import { ApiError } from '../../../shared/api/client';
import type {
  CampaignDetailResponse,
  ViewHistoryFilter,
} from '../../../shared/api/types';

type Tab = 'overview' | 'recipients' | 'documents' | 'links' | 'actions';

const TABS: Array<{ value: Tab; label: string }> = [
  { value: 'overview', label: '개요' },
  { value: 'recipients', label: '수신자' },
  { value: 'documents', label: '명세서 / 매칭' },
  { value: 'links', label: '링크 / 열람' },
  { value: 'actions', label: '실패 / 재발송' },
];

const STATUS_NOT_EDITABLE: CampaignStatus[] = [
  'SENDING',
  'SENT',
  'PARTIAL_FAILED',
  'CANCELLED',
  'FAILED',
];

const PAGE_SIZE = 12;

export function CampaignDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const initialTab = (searchParams.get('tab') as Tab) ?? 'overview';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmReminder, setConfirmReminder] = useState(false);
  const [confirmResend, setConfirmResend] = useState(false);

  const detailQuery = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignApi.detail(id),
  });
  const c = detailQuery.data;

  function changeTab(next: Tab) {
    setTab(next);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', next);
      return p;
    });
  }

  const cancelMutation = useMutation({
    mutationFn: () => campaignApi.cancel(id),
    onSuccess: () => {
      toast.success('캠페인이 취소되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (err: unknown) => {
      const m = err instanceof ApiError ? err.message : '취소에 실패했습니다.';
      toast.error('취소 실패', m);
    },
  });
  const reminderMutation = useMutation({
    mutationFn: () => campaignApi.reminders(id, { target: 'ALL_UNVIEWED' }),
    onSuccess: (res) => {
      toast.success(
        '리마인드 발송이 요청되었습니다.',
        `${res.queuedCount}명에게 안내 메일을 보냈습니다.`,
      );
      setConfirmReminder(false);
    },
  });
  const resendMutation = useMutation({
    mutationFn: () => campaignApi.manualResend(id, { target: 'ALL_FAILED' }),
    onSuccess: (res) => {
      toast.success(
        '실패 대상자 재발송 요청 완료',
        `${res.queuedCount}명을 발송 큐에 추가했습니다.`,
      );
      setConfirmResend(false);
      queryClient.invalidateQueries({ queryKey: ['campaign-send-failures', id] });
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
  });

  if (!detailQuery.isPending && !c) {
    return (
      <EmptyState
        title="캠페인을 찾을 수 없습니다"
        description="삭제되었거나 권한이 없는 캠페인일 수 있습니다."
        action={<Link to="/admin/campaigns"><Button size="sm">발송 이력으로</Button></Link>}
      />
    );
  }

  const editable = c && !STATUS_NOT_EDITABLE.includes(c.status);

  return (
    <div>
      <PageHeader
        title={c?.campaignName ?? '캠페인 상세'}
        description={c ? `생성: ${formatDate(c.createdAt)}` : undefined}
        breadcrumbs={[
          { label: '관리자' },
          { label: '발송 이력', to: '/admin/campaigns' },
          { label: c?.campaignName ?? '상세' },
        ]}
        apiBadges={
          <ApiBadgeGroup>
            <ApiBadge method="GET" path="/api/campaigns/:id" note="CAM-005 상세" />
            <ApiBadge method="PATCH" path="/api/campaigns/:id/cancel" note="CAM-004" />
            <ApiBadge method="POST" path="/api/campaigns/:id/reminders" note="SND-001 리마인드" />
            <ApiBadge method="POST" path="/api/campaigns/:id/resends" note="SND-002 재발송" />
          </ApiBadgeGroup>
        }
        actions={
          c ? (
            <div className="flex items-center gap-2">
              {c.status === 'DRAFT' || c.status === 'READY' ? (
                <Link to={`/admin/campaigns/new?campaignId=${c.campaignId}`}>
                  <Button variant="secondary" iconLeft={<Icon.Edit size={14} />}>
                    수정
                  </Button>
                </Link>
              ) : null}
              {editable ? (
                <Button
                  variant="ghost"
                  iconLeft={<Icon.X size={14} />}
                  onClick={() => setConfirmCancel(true)}
                >
                  취소
                </Button>
              ) : null}
              {c.status === 'PARTIAL_FAILED' ? (
                <Button onClick={() => setConfirmResend(true)} iconLeft={<Icon.Refresh size={14} />}>
                  실패 일괄 재발송
                </Button>
              ) : null}
              {(c.status === 'SENT' || c.status === 'PARTIAL_FAILED') && c.unviewedCount > 0 ? (
                <Button
                  variant="secondary"
                  iconLeft={<Icon.Mail size={14} />}
                  onClick={() => setConfirmReminder(true)}
                >
                  리마인드 발송
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />

      {c ? (
        <Card className="mb-5">
          <CardBody className="grid grid-cols-2 gap-3 md:grid-cols-6">
            <Metric label="상태" value={<CampaignStatusBadge status={c.status} />} />
            <Metric label="총 대상자" value={<span className="num">{formatNumber(c.totalRecipientCount)}</span>} />
            <Metric label="발송 성공" value={<span className="num text-mint-700">{formatNumber(c.sendSuccessCount)}</span>} />
            <Metric label="발송 실패" value={<span className={`num ${c.sendFailedCount > 0 ? 'text-danger-600' : 'text-ink-3'}`}>{formatNumber(c.sendFailedCount)}</span>} />
            <Metric label="확인 완료" value={<span className="num text-ink-2">{formatNumber(c.viewedCount)}</span>} />
            <Metric label="미확인" value={<span className={`num ${c.unviewedCount > 0 ? 'text-warn-600' : 'text-ink-4'}`}>{formatNumber(c.unviewedCount)}</span>} />
          </CardBody>
        </Card>
      ) : null}

      <Tabs items={TABS} value={tab} onChange={changeTab} className="mb-4" />

      {tab === 'overview' && c ? <OverviewPanel campaign={c} /> : null}
      {tab === 'recipients' && c ? (
        <RecipientsPanel
          campaignId={c.campaignId}
          initialFilter={(searchParams.get('filter') as ViewFilter) ?? 'ALL'}
        />
      ) : null}
      {tab === 'documents' && c ? <DocumentsPanel campaignId={c.campaignId} /> : null}
      {tab === 'links' && c ? <LinksPanel campaignId={c.campaignId} /> : null}
      {tab === 'actions' && c ? (
        <ActionsPanel
          campaign={c}
          onReminder={() => setConfirmReminder(true)}
          onResend={() => setConfirmResend(true)}
          reminderPending={reminderMutation.isPending}
          resendPending={resendMutation.isPending}
        />
      ) : null}

      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="캠페인을 취소할까요?"
        description="이미 발송이 시작되었다면 취소되지 않습니다."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmCancel(false)}>닫기</Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmCancel(false);
                cancelMutation.mutate();
              }}
              loading={cancelMutation.isPending}
            >
              취소 처리
            </Button>
          </>
        }
      >
        <div className="rounded-md border border-border bg-surface-sunken px-4 py-3 text-[12.5px] text-ink-3">
          취소된 캠페인은 새 발송으로 복제할 수 있지만 동일한 캠페인은 복구되지 않습니다.
        </div>
      </Modal>

      <Modal
        open={confirmReminder}
        onClose={() => setConfirmReminder(false)}
        title="미확인 수신자에게 리마인드를 보낼까요?"
        description={`현재 미확인 ${formatNumber(c?.unviewedCount ?? 0)}명에게 안내 이메일을 발송합니다.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReminder(false)}>닫기</Button>
            <Button onClick={() => reminderMutation.mutate()} loading={reminderMutation.isPending}>
              리마인드 발송
            </Button>
          </>
        }
      >
        <div className="rounded-md border border-border bg-surface-sunken px-4 py-3 text-[12.5px] text-ink-3">
          리마인드는 기존 보안 링크를 그대로 안내합니다.
        </div>
      </Modal>

      <Modal
        open={confirmResend}
        onClose={() => setConfirmResend(false)}
        title="실패 대상자에게 일괄 재발송할까요?"
        description={`현재 발송 실패 ${formatNumber(c?.sendFailedCount ?? 0)}명에 대해 재발송을 요청합니다.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmResend(false)}>닫기</Button>
            <Button onClick={() => resendMutation.mutate()} loading={resendMutation.isPending}>
              재발송 요청
            </Button>
          </>
        }
      >
        <div className="rounded-md border border-border bg-surface-sunken px-4 py-3 text-[12.5px] text-ink-3">
          영구 실패(이메일 형식 오류, 차단, 스팸 신고)는 자동 제외됩니다.
        </div>
      </Modal>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-4">{label}</div>
      <div className="mt-1 text-[14px] font-medium text-ink-1">{value}</div>
    </div>
  );
}

function OverviewPanel({ campaign }: { campaign: CampaignDetailResponse }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="이메일 내용" subtitle="수신자에게 노출되는 본문입니다." />
        <CardBody>
          <div className="rounded-md border border-border bg-surface-sunken px-4 py-3 text-[12px] text-ink-1">
            <div className="font-medium">{campaign.emailSubject}</div>
            <div className="mt-2 text-[11.5px] leading-relaxed text-ink-3 whitespace-pre-wrap">
              {campaign.emailDescription || '본문이 입력되지 않았습니다.'}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
            <SpecPair k="링크 TTL" v={`${campaign.linkTtlHours}시간`} />
            <SpecPair
              k="일회용 링크"
              v={campaign.allowOneTimeLink ? '사용' : '미사용'}
            />
            <SpecPair
              k="재전송 요청"
              v={campaign.allowResendRequest ? `허용 (${campaign.resendRequestLimit}회)` : '불가'}
            />
            <SpecPair
              k="예약 발송"
              v={campaign.scheduledSendAt ? formatDate(campaign.scheduledSendAt) : '없음'}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="발송 타임라인" />
        <CardBody>
          <ul className="space-y-3">
            <Timeline label="생성" ts={campaign.createdAt} done />
            <Timeline
              label="예약"
              ts={campaign.scheduledSendAt}
              done={!!campaign.scheduledSendAt}
            />
            <Timeline label="발송 시작" ts={campaign.sendStartedAt} done={!!campaign.sendStartedAt} />
            <Timeline label="발송 완료" ts={campaign.sendCompletedAt} done={!!campaign.sendCompletedAt} />
            <Timeline label="취소" ts={campaign.cancelledAt} done={!!campaign.cancelledAt} />
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function Timeline({ label, ts, done }: { label: string; ts: string | null; done: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <div
        className={`mt-1 flex size-3 shrink-0 items-center justify-center rounded-full ${
          done ? 'bg-mint-500' : 'border border-border-ink bg-white'
        }`}
      />
      <div className="flex-1">
        <div className="text-[12.5px] font-medium text-ink-2">{label}</div>
        <div className="num text-[11px] text-ink-4">
          {ts ? formatDate(ts) : '대기 중'}
        </div>
      </div>
    </li>
  );
}

function SpecPair({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-white px-3.5 py-2.5">
      <div className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-4">{k}</div>
      <div className="mt-0.5 text-[12.5px] font-medium text-ink-1">{v}</div>
    </div>
  );
}

type ViewFilter = ViewHistoryFilter | 'FAILED';

const VIEW_FILTERS: Array<{ value: ViewFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'VIEWED', label: '확인 완료' },
  { value: 'UNVIEWED', label: '미확인' },
  { value: 'FAILED', label: '발송 실패' },
];

function RecipientsPanel({
  campaignId,
  initialFilter,
}: {
  campaignId: string;
  initialFilter: ViewFilter;
}) {
  const [filter, setFilter] = useState<ViewFilter>(initialFilter);
  const [page, setPage] = useState(1);

  const viewQuery = useQuery({
    queryKey: ['campaign-view-history', campaignId, { filter, page }],
    queryFn: () =>
      campaignApi.viewHistory(campaignId, {
        filter: filter === 'FAILED' ? undefined : (filter as ViewHistoryFilter),
        page,
        pageSize: PAGE_SIZE,
      }),
    enabled: filter !== 'FAILED',
  });
  const failureQuery = useQuery({
    queryKey: ['campaign-send-failures', campaignId, { page }],
    queryFn: () => campaignApi.sendFailures(campaignId, { page, pageSize: PAGE_SIZE }),
    enabled: filter === 'FAILED',
  });

  const isLoading = filter === 'FAILED' ? failureQuery.isLoading : viewQuery.isLoading;
  const totalCount =
    filter === 'FAILED'
      ? (failureQuery.data?.totalCount ?? 0)
      : (viewQuery.data?.totalCount ?? 0);
  const pageSize =
    filter === 'FAILED'
      ? (failureQuery.data?.pageSize ?? PAGE_SIZE)
      : (viewQuery.data?.pageSize ?? PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <Card>
      <CardHeader
        title="수신자 목록"
        apiBadge={
          filter === 'FAILED' ? (
            <ApiBadge method="GET" path="/api/campaigns/:id/send-failures" note="RST-001" />
          ) : (
            <ApiBadge method="GET" path="/api/campaigns/:id/view-history" note="RST-002" />
          )
        }
      />
      <CardBody className="pb-2">
        <Pill
          items={VIEW_FILTERS}
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setPage(1);
          }}
        />
      </CardBody>
      {filter === 'FAILED' ? (
        <Table>
          <THead>
            <TR>
              <TH>수신자</TH>
              <TH>부서</TH>
              <TH>이메일</TH>
              <TH>실패 사유</TH>
              <TH className="text-right">재시도</TH>
              <TH>실패 시각</TH>
            </TR>
          </THead>
          <TBody>
            {isLoading ? (
              <>
                <SkeletonRow cols={6} />
                <SkeletonRow cols={6} />
              </>
            ) : (failureQuery.data?.items ?? []).length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    title="발송 실패 건이 없습니다"
                    description="모든 수신자에게 정상 발송되었습니다."
                    icon={<Icon.Check size={26} />}
                  />
                </td>
              </tr>
            ) : (
              failureQuery.data?.items.map((r) => (
                <TR key={r.campaignRecipientId}>
                  <TD>
                    <div className="font-medium text-ink-1">{r.name}</div>
                  </TD>
                  <TD className="text-[11.5px] text-ink-3">{r.department}</TD>
                  <TD className="num text-[11.5px] text-ink-3">{maskEmail(r.email)}</TD>
                  <TD>
                    <Badge tone="danger" size="xs">
                      {SEND_FAILURE_REASON_LABEL[r.failureReason] ?? r.failureReason}
                    </Badge>
                  </TD>
                  <TD className="num text-right">{r.retryCount}</TD>
                  <TD className="num text-[11.5px] text-ink-3">{formatDate(r.failedAt)}</TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>수신자</TH>
              <TH>사번</TH>
              <TH>이메일</TH>
              <TH>열람</TH>
              <TH className="text-right">조회수</TH>
              <TH>최초 열람</TH>
            </TR>
          </THead>
          <TBody>
            {isLoading ? (
              <>
                <SkeletonRow cols={6} />
                <SkeletonRow cols={6} />
              </>
            ) : (viewQuery.data?.items ?? []).length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    title="조회된 수신자가 없습니다"
                    description="필터 조건을 다시 확인해 주세요."
                    icon={<Icon.User size={26} />}
                  />
                </td>
              </tr>
            ) : (
              viewQuery.data?.items.map((r) => (
                <TR key={r.campaignRecipientId}>
                  <TD>
                    <div className="font-medium text-ink-1">{r.name}</div>
                  </TD>
                  <TD className="num text-[11.5px] text-ink-3">{r.employeeNo}</TD>
                  <TD className="num text-[11.5px] text-ink-3">{maskEmail(r.email)}</TD>
                  <TD>
                    {r.isViewed ? (
                      <Badge tone="success" size="xs">확인 완료</Badge>
                    ) : (
                      <Badge tone="warn" size="xs">미확인</Badge>
                    )}
                  </TD>
                  <TD className="num text-right">{r.viewCount}</TD>
                  <TD className="num text-[11.5px] text-ink-3">
                    {r.firstViewedAt ? formatDate(r.firstViewedAt) : '-'}
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      )}
      {totalCount > 0 ? (
        <div className="border-t border-border px-4 py-2">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      ) : null}
    </Card>
  );
}

function DocumentsPanel({ campaignId }: { campaignId: string }) {
  const matchesQuery = useQuery({
    queryKey: ['campaign-matches', campaignId, 'all'],
    queryFn: () => campaignApi.documentMatches(campaignId),
  });

  const data = matchesQuery.data;
  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader
        title="매칭 결과"
        subtitle={
          data
            ? `전체 ${data.totalRecipientCount}건 · 매칭 완료 ${data.matchedCount}건 · 매칭 오류 ${data.unmatchedRecipientCount}건 · 중복 매칭 ${data.duplicateMatchCount}건`
            : '명세서 매칭 결과를 불러오는 중…'
        }
        apiBadge={
          <ApiBadge method="GET" path="/api/campaigns/:id/documents/match-results" note="DOC-002" />
        }
      />
      <Table>
        <THead>
          <TR>
            <TH>수신자</TH>
            <TH>사번</TH>
            <TH>이메일</TH>
            <TH>매칭 키</TH>
            <TH>매칭 상태</TH>
            <TH>문서 ID</TH>
          </TR>
        </THead>
        <TBody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState
                  title="매칭 데이터가 없습니다"
                  description="명세서 업로드가 필요합니다."
                  icon={<Icon.File size={26} />}
                />
              </td>
            </tr>
          ) : (
            items.slice(0, 50).map((m) => (
              <TR key={m.campaignRecipientId}>
                <TD>{m.recipientName}</TD>
                <TD className="num text-[11.5px] text-ink-3">{m.employeeNo}</TD>
                <TD className="num text-[11.5px] text-ink-3">{maskEmail(m.email)}</TD>
                <TD className="num text-[11.5px] text-ink-3">{m.matchKey}</TD>
                <TD>
                  <Badge
                    tone={
                      m.matchStatus === 'MATCHED'
                        ? 'success'
                        : m.matchStatus === 'DUPLICATE_MATCH'
                          ? 'warn'
                          : 'danger'
                    }
                    size="xs"
                  >
                    {MATCH_STATUS_LABEL[m.matchStatus] ?? m.matchStatus}
                  </Badge>
                </TD>
                <TD className="num text-[11px] text-ink-4">{m.documentId ?? '-'}</TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </Card>
  );
}

function LinksPanel({ campaignId }: { campaignId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['campaign-view-history-links', campaignId, page],
    queryFn: () => campaignApi.viewHistory(campaignId, { filter: 'ALL', page, pageSize: PAGE_SIZE }),
  });
  const items = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <Card>
      <CardHeader
        title="보안 링크 / 열람 이력"
        subtitle="수신자별 링크 상태와 열람 시각을 확인합니다."
        apiBadge={
          <ApiBadge method="GET" path="/api/campaigns/:id/view-history" note="RST-002" />
        }
      />
      <Table>
        <THead>
          <TR>
            <TH>수신자</TH>
            <TH>사번</TH>
            <TH>이메일</TH>
            <TH>링크 상태</TH>
            <TH>최초 열람</TH>
            <TH className="text-right">조회수</TH>
            <TH>만료 시각</TH>
          </TR>
        </THead>
        <TBody>
          {isLoading ? (
            <>
              <SkeletonRow cols={7} />
              <SkeletonRow cols={7} />
            </>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState
                  title="발송된 링크가 없습니다"
                  description="발송 시작 후 이 영역에서 링크 상태를 모니터링할 수 있습니다."
                  icon={<Icon.Mail size={26} />}
                />
              </td>
            </tr>
          ) : (
            items.map((l) => (
              <TR key={l.campaignRecipientId}>
                <TD>
                  <div className="text-[12.5px] font-medium text-ink-1">{l.name}</div>
                </TD>
                <TD className="num text-[11.5px] text-ink-3">{l.employeeNo}</TD>
                <TD className="num text-[11.5px] text-ink-3">{maskEmail(l.email)}</TD>
                <TD>
                  <Badge
                    size="xs"
                    tone={
                      l.linkStatus === 'ACTIVE'
                        ? 'success'
                        : l.linkStatus === 'USED'
                          ? 'neutral'
                          : l.linkStatus === 'EXPIRED'
                            ? 'warn'
                            : 'danger'
                    }
                  >
                    {l.linkStatus}
                  </Badge>
                </TD>
                <TD className="num text-[11.5px] text-ink-3">
                  {l.firstViewedAt ? formatDate(l.firstViewedAt) : '-'}
                </TD>
                <TD className="num text-right text-[12px] text-ink-2">{l.viewCount}</TD>
                <TD className="num text-[11.5px] text-ink-4">{formatDate(l.linkExpiresAt)}</TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
      {data && data.totalCount > 0 ? (
        <div className="border-t border-border px-4 py-2">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      ) : null}
    </Card>
  );
}

function ActionsPanel({
  campaign,
  onReminder,
  onResend,
  reminderPending,
  resendPending,
}: {
  campaign: CampaignDetailResponse;
  onReminder: () => void;
  onResend: () => void;
  reminderPending: boolean;
  resendPending: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader
          title="미확인 수신자 후속 조치"
          subtitle="확인이 늦은 수신자에게 안내 메일을 다시 발송합니다."
          apiBadge={<ApiBadge method="POST" path="/api/campaigns/:id/reminders" note="SND-001" />}
        />
        <CardBody>
          <div className="flex items-baseline gap-2">
            <div className="num text-[26px] font-medium text-warn-600">
              {formatNumber(campaign.unviewedCount)}
            </div>
            <div className="text-[12px] text-ink-4">명</div>
          </div>
          <Button
            className="mt-3 w-full"
            variant="secondary"
            onClick={onReminder}
            loading={reminderPending}
            iconLeft={<Icon.Mail size={14} />}
            disabled={campaign.unviewedCount === 0}
          >
            리마인드 발송
          </Button>
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          title="발송 실패 수동 재발송"
          subtitle="복구 가능한 실패 사유에 대해 다시 발송 요청을 진행합니다."
          apiBadge={<ApiBadge method="POST" path="/api/campaigns/:id/resends" note="SND-002" />}
        />
        <CardBody>
          <div className="flex items-baseline gap-2">
            <div className="num text-[26px] font-medium text-danger-600">
              {formatNumber(campaign.sendFailedCount)}
            </div>
            <div className="text-[12px] text-ink-4">명</div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              to={`/admin/campaigns/${campaign.campaignId}?tab=recipients&filter=FAILED`}
            >
              <Button variant="secondary" className="w-full">
                실패 목록 보기
              </Button>
            </Link>
            <Button
              onClick={onResend}
              loading={resendPending}
              disabled={campaign.sendFailedCount === 0}
              iconLeft={<Icon.Refresh size={14} />}
            >
              일괄 재발송
            </Button>
          </div>
          <div className="mt-3 text-[11px] text-ink-4">
            영구 실패(INVALID_EMAIL/BLOCKED/COMPLAINT)는 자동 제외됩니다.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
