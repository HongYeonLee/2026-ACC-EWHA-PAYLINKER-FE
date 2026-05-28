import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiBadge, ApiBadgeGroup, Badge, Icon, Skeleton } from '../../../shared/ui';
import { CampaignStatusBadge } from '../../../shared/ui/StatusBadge';
import { dashboardApi } from './api';
import { campaignApi } from '../campaigns/api';
import { notificationApi } from '../notifications/api';
import { formatDate, formatNumber } from '../../../shared/lib/format';
import { useAuthStore } from '../../../shared/stores/auth.store';
import { CHECK_ITEM_TYPE_LABEL } from '../../../shared/constants/status';
import { cn } from '../../../shared/lib/cn';
import type { DashboardViewTrendPoint } from '../../../shared/api/types';

export function DashboardPage() {
  const profile = useAuthStore((s) => s.adminProfile);
  const navigate = useNavigate();

  const summaryQuery = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: dashboardApi.summary });
  const summary = summaryQuery.data;
  const firstCampaign = summary?.recentCampaigns[0];
  const focusId = firstCampaign?.campaignId;

  const campaignSummaryQuery = useQuery({
    queryKey: ['dashboard', 'campaign-summary', focusId],
    queryFn: () => dashboardApi.campaignSummary(focusId!),
    enabled: !!focusId,
  });
  const focusCampaign = campaignSummaryQuery.data ?? firstCampaign;

  const unviewedQuery = useQuery({
    queryKey: ['dashboard', 'unviewed', focusId],
    queryFn: () => dashboardApi.unviewed(focusId!),
    enabled: !!focusId,
  });
  const trendQuery = useQuery({
    queryKey: ['dashboard', 'trend', focusId],
    queryFn: () => dashboardApi.viewTrend(focusId!),
    enabled: !!focusId,
  });
  const checkItemsQuery = useQuery({
    queryKey: ['dashboard', 'check-items'],
    queryFn: () => notificationApi.checkItems({ status: 'OPEN', pageSize: 6 }),
    refetchInterval: 60_000,
  });
  const scheduledQuery = useQuery({
    queryKey: ['dashboard', 'scheduled'],
    queryFn: () => campaignApi.list({ status: 'SCHEDULED', sort: 'scheduledSendAt:asc', pageSize: 4 }),
  });

  const isLoading = summaryQuery.isLoading;
  const isEmpty = !isLoading && !summary?.recentCampaigns.length;
  const viewRate = focusCampaign ? Math.round((focusCampaign.viewRate ?? 0) * 100) : 0;
  const name = profile?.name ?? '운영자';

  return (
    <div className="space-y-5">
      {/* Greeting row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink-1">
            {isEmpty ? `환영해요, ${name}님` : `안녕하세요, ${name}님`}
          </h1>
          <p className="mt-1 text-[13px] text-ink-4">
            {isEmpty
              ? 'PayLinker 운영자 콘솔에 오신 걸 환영합니다. 첫 번째 발송을 시작해 보세요.'
              : '발송 현황과 확인이 필요한 항목을 한눈에 살펴보세요.'}
          </p>
        </div>
        <Link to="/admin/campaigns/new">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-navy-700 px-4 text-[12.5px] font-medium text-white shadow-sm transition hover:bg-navy-600"
          >
            <Icon.Plus size={14} />새 발송
          </button>
        </Link>
      </div>

      <ApiBadgeGroup>
        <ApiBadge method="GET" path="/api/dashboard/summary" note="STA-001" />
        <ApiBadge method="GET" path="/api/dashboard/campaigns/:id/summary" note="STA-002" />
        <ApiBadge method="GET" path="/api/dashboard/campaigns/:id/view-trend" note="STA-003" />
        <ApiBadge method="GET" path="/api/dashboard/campaigns/:id/unviewed-recipients" note="STA-004" />
        <ApiBadge method="GET" path="/notifications/check-items" note="REQ-003" />
      </ApiBadgeGroup>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <>
          {/* ── Campaign focus card ── */}
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="text-[15px] font-bold text-ink-1">{focusCampaign?.campaignName}</span>
                {focusCampaign && <CampaignStatusBadge status={focusCampaign.status} />}
              </div>
              {focusCampaign && (
                <Link
                  to={`/admin/campaigns/${focusCampaign.campaignId}`}
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-mint-700 hover:underline"
                >
                  상세 보기 <Icon.ChevronRight size={12} />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_260px]">
              {/* Left: stats + bar */}
              <div className="px-5 py-5">
                <div className="grid grid-cols-4 gap-3">
                  <CampaignMetric label="총 대상자" value={formatNumber(focusCampaign?.totalRecipientCount ?? 0)} />
                  <CampaignMetric label="발송 성공" value={formatNumber(focusCampaign?.sendSuccessCount ?? 0)} tone="success" />
                  <CampaignMetric label="발송 실패" value={formatNumber(focusCampaign?.sendFailedCount ?? 0)} tone="danger" />
                  <CampaignMetric label="미확인" value={formatNumber(focusCampaign?.unviewedCount ?? 0)} tone="warn" />
                </div>
                <div className="mt-5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11.5px] text-ink-3">
                    <span>열람률</span>
                    <span className="num font-semibold text-ink-1">{viewRate}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-sunken">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-mint-400 to-mint-600 transition-[width] duration-700"
                      style={{ width: `${viewRate}%` }}
                    />
                  </div>
                </div>
                {focusCampaign?.sendCompletedAt && (
                  <div className="mt-3 num text-[11px] text-ink-5">
                    발송 완료 {formatDate(focusCampaign.sendCompletedAt)}
                  </div>
                )}
              </div>
              {/* Right: trend chart */}
              <div className="border-t border-border bg-surface-sunken px-5 py-4 md:border-l md:border-t-0">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-4">확인 추이</span>
                  {trendQuery.data && (
                    <span className="num text-[11px] text-ink-4">
                      {Math.round((trendQuery.data.currentViewRate ?? 0) * 100)}%
                    </span>
                  )}
                </div>
                <TrendChart points={trendQuery.data?.points ?? []} />
              </div>
            </div>
          </div>

          {/* ── Bottom 2-col ── */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
            {/* Left col */}
            <div className="space-y-5">
              {/* Unviewed recipients */}
              <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                  <div>
                    <div className="text-[14px] font-bold text-ink-1">미확인 수신자 현황</div>
                    {(unviewedQuery.data?.maxElapsedHours ?? 0) > 0 && (
                      <div className="mt-0.5 text-[11px] text-ink-4">
                        최장 {unviewedQuery.data?.maxElapsedHours}시간 경과
                      </div>
                    )}
                  </div>
                  {focusCampaign && (
                    <Link
                      to={`/admin/campaigns/${focusCampaign.campaignId}?tab=recipients&filter=UNVIEWED`}
                      className="text-[12px] font-medium text-mint-700 hover:underline"
                    >
                      전체 보기
                    </Link>
                  )}
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="num text-[34px] font-bold leading-none text-warn-600">
                      {formatNumber(unviewedQuery.data?.totalUnviewedCount ?? 0)}
                    </span>
                    <span className="text-[13px] text-ink-4">명</span>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {(unviewedQuery.data?.previews ?? []).map((p) => (
                      <li
                        key={p.recipientId}
                        className="flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5 text-[12.5px]"
                      >
                        <span className="font-medium text-ink-1">{p.name}</span>
                        <span className="num text-ink-4">{p.employeeNo}</span>
                      </li>
                    ))}
                    {!(unviewedQuery.data?.previews ?? []).length && (
                      <li className="rounded-lg border border-dashed border-border px-4 py-4 text-center text-[12.5px] text-ink-4">
                        미확인 수신자가 없습니다.
                      </li>
                    )}
                  </ul>
                  <button
                    type="button"
                    onClick={() =>
                      focusCampaign &&
                      navigate(`/admin/campaigns/${focusCampaign.campaignId}?tab=actions&action=reminder`)
                    }
                    disabled={!focusCampaign}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border-strong px-4 py-2.5 text-[12.5px] font-medium text-ink-2 transition hover:bg-surface-sunken disabled:opacity-40"
                  >
                    <Icon.Mail size={13} /> 리마인드 발송 요청
                  </button>
                </div>
              </div>

              {/* Scheduled campaigns */}
              <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                  <div className="text-[14px] font-bold text-ink-1">다음 예약 발송</div>
                  <Link to="/admin/scheduled" className="text-[12px] font-medium text-mint-700 hover:underline">
                    전체 보기
                  </Link>
                </div>
                <ul className="divide-y divide-border">
                  {(scheduledQuery.data?.items ?? []).map((c) => (
                    <li key={c.campaignId}>
                      <Link
                        to={`/admin/campaigns/${c.campaignId}`}
                        className="flex items-center justify-between px-5 py-3.5 transition hover:bg-surface-sunken"
                      >
                        <div>
                          <div className="text-[13px] font-medium text-ink-1">{c.campaignName}</div>
                          <div className="mt-0.5 num text-[11px] text-ink-4">
                            <Icon.Calendar size={10} className="mr-1 inline" />
                            {c.scheduledSendAt ? formatDate(c.scheduledSendAt) : '—'}
                          </div>
                        </div>
                        <div className="num text-[12px] text-ink-3">
                          {formatNumber(c.totalRecipientCount)}명
                        </div>
                      </Link>
                    </li>
                  ))}
                  {!(scheduledQuery.data?.items ?? []).length && (
                    <li className="px-5 py-6 text-center text-[12.5px] text-ink-4">
                      예약된 발송이 없습니다.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Right col: check items */}
            <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <div>
                  <div className="text-[14px] font-bold text-ink-1">확인 필요 목록</div>
                  {(checkItemsQuery.data?.openCount ?? 0) > 0 && (
                    <div className="mt-0.5 text-[11px] text-ink-4">
                      {checkItemsQuery.data?.openCount}건 미처리
                    </div>
                  )}
                </div>
                <Link to="/admin/checks" className="text-[12px] font-medium text-mint-700 hover:underline">
                  전체 보기
                </Link>
              </div>
              {(checkItemsQuery.data?.items ?? []).length === 0 ? (
                <div className="flex flex-col items-center px-5 py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-mint-50 text-mint-600">
                    <Icon.Check size={20} />
                  </div>
                  <div className="mt-3 text-[13px] font-medium text-ink-2">모두 처리되었습니다</div>
                  <div className="mt-1 text-[12px] text-ink-4">새로운 확인 항목이 없습니다.</div>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {checkItemsQuery.data?.items.map((item) => (
                    <li key={item.checkItemId}>
                      <button
                        type="button"
                        onClick={() => navigate(item.deepLink ?? `/admin/campaigns/${item.campaignId}`)}
                        className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-surface-sunken"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium text-ink-1">
                            {item.campaignName}
                          </div>
                          {item.recipientName && (
                            <div className="mt-0.5 text-[11.5px] text-ink-3">{item.recipientName}</div>
                          )}
                          <div className="mt-1 num text-[10.5px] text-ink-5">
                            {formatDate(item.createdAt)}
                          </div>
                        </div>
                        <Badge tone="warn" size="xs" className="mt-0.5 shrink-0">
                          {CHECK_ITEM_TYPE_LABEL[item.itemType] ?? item.itemType}
                        </Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function CampaignMetric({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  tone?: 'success' | 'warn' | 'danger' | 'neutral';
}) {
  const color =
    tone === 'success'
      ? 'text-mint-700'
      : tone === 'warn'
        ? 'text-warn-600'
        : tone === 'danger'
          ? 'text-danger-600'
          : 'text-ink-1';
  return (
    <div>
      <div className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-ink-4">{label}</div>
      <div className={cn('mt-1.5 num text-[22px] font-bold leading-none', color)}>{value}</div>
    </div>
  );
}

function TrendChart({ points }: { points: DashboardViewTrendPoint[] }) {
  if (!points.length) {
    return (
      <div className="flex h-28 items-center justify-center text-[11.5px] text-ink-5">
        데이터 수집 중
      </div>
    );
  }
  const maxRate = Math.max(...points.map((p) => p.viewRate * 100), 10);
  const w = 100;
  const stepX = w / Math.max(points.length - 1, 1);
  const linePath = points
    .map((p, i) => {
      const x = i * stepX;
      const y = 100 - (p.viewRate * 100 / maxRate) * 85;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  const areaPath = `${linePath} L ${w} 100 L 0 100 Z`;

  return (
    <div className="relative h-28">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="dash-trend-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-mint-400)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-mint-400)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#dash-trend-grad)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-mint-500)"
          strokeWidth="1.8"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex justify-between px-0.5 text-[9px] text-ink-5">
        {points
          .filter((_, i) => i % Math.max(1, Math.ceil(points.length / 4)) === 0)
          .map((p) => (
            <span key={p.snapshotAt} className="num">
              {formatDate(p.snapshotAt, 'HH:mm')}
            </span>
          ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-border bg-white p-5">
        <Skeleton className="h-4 w-48" />
        <div className="mt-5 grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-2.5 w-14" />
              <Skeleton className="mt-2 h-6 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-5 h-2 w-full rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {[0, 1].map((i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-white p-5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-3 h-8 w-16" />
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="mt-2 h-11 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-white p-5">
          <Skeleton className="h-4 w-32" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mt-3 flex items-center justify-between gap-3">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2.5 w-3/4" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white px-8 py-16 text-center shadow-sm">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-mint-50">
        <Icon.Send size={26} className="text-mint-600" />
      </div>
      <h2 className="mt-5 text-[18px] font-bold tracking-tight text-ink-1">
        아직 발송 기록이 없어요
      </h2>
      <p className="mt-2 text-[13.5px] text-ink-4">
        첫 번째 캠페인을 만들고 수신자에게 명세서를 발송해 보세요.
      </p>

      <div className="mx-auto mt-10 grid max-w-lg grid-cols-3 gap-6">
        {[
          { icon: <Icon.User size={18} />, label: '수신자 등록', desc: 'CSV로 수신자 목록을 업로드' },
          { icon: <Icon.File size={18} />, label: '명세서 업로드', desc: '발송할 문서 파일 등록' },
          { icon: <Icon.Send size={18} />, label: '발송 요청', desc: '검토 후 발송 시작' },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-2 text-center">
            <div className="relative flex size-10 items-center justify-center rounded-full bg-mint-50 text-mint-600">
              {s.icon}
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-mint-500 num text-[9px] font-bold text-white">
                {i + 1}
              </span>
            </div>
            <div className="text-[13px] font-semibold text-ink-1">{s.label}</div>
            <div className="text-[11.5px] text-ink-4 leading-snug">{s.desc}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Link to="/admin/campaigns/new">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-mint-500 px-6 text-[13px] font-medium text-navy-900 shadow-sm transition hover:bg-mint-400"
          >
            <Icon.Plus size={14} />새 발송 시작하기
          </button>
        </Link>
        <Link to="/link/demo-valid" className="text-[12.5px] text-mint-700 hover:underline">
          샘플 데이터 확인하기 →
        </Link>
      </div>
    </div>
  );
}
