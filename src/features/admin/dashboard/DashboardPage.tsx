import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiBadge, ApiBadgeGroup, Icon, Skeleton } from '../../../shared/ui';
import { dashboardApi } from './api';
import { campaignApi } from '../campaigns/api';
import { formatDate, formatNumber } from '../../../shared/lib/format';
import { useAuthStore } from '../../../shared/stores/auth.store';
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
  const failuresQuery = useQuery({
    queryKey: ['dashboard', 'failures', focusId],
    queryFn: () => dashboardApi.failures(focusId!),
    enabled: !!focusId,
  });
  const trendQuery = useQuery({
    queryKey: ['dashboard', 'trend', focusId],
    queryFn: () => dashboardApi.viewTrend(focusId!),
    enabled: !!focusId,
  });
  const scheduledQuery = useQuery({
    queryKey: ['dashboard', 'scheduled'],
    queryFn: () => campaignApi.list({ status: 'SCHEDULED', sort: 'scheduledSendAt:asc', pageSize: 4 }),
  });
  const isLoading = summaryQuery.isLoading;
  const isEmpty = !isLoading && !summary?.recentCampaigns.length;
  const name = profile?.name ?? '운영자';

  // Campaign stats
  const total = focusCampaign?.totalRecipientCount ?? 0;
  const viewed = focusCampaign?.viewedCount ?? 0;
  const unviewed = focusCampaign?.unviewedCount ?? 0;
  const failed = focusCampaign?.sendFailedCount ?? 0;
  const sent = focusCampaign?.sendSuccessCount ?? 0;

  const viewedPct = total > 0 ? ((viewed / total) * 100).toFixed(1) : '0.0';
  const sentPct = total > 0 ? ((sent / total) * 100).toFixed(1) : '0.0';
  const barViewed = total > 0 ? (viewed / total) * 100 : 0;
  const barUnviewed = total > 0 ? (unviewed / total) * 100 : 0;
  const barFailed = total > 0 ? (failed / total) * 100 : 0;

  // Campaign header
  const sendCompleted = focusCampaign?.sendCompletedAt;
  const sendDate = sendCompleted ? new Date(sendCompleted) : null;
  const nowDate = new Date();
  const isThisMonth =
    sendDate &&
    sendDate.getMonth() === nowDate.getMonth() &&
    sendDate.getFullYear() === nowDate.getFullYear();
  const campaignBadgeLabel = isThisMonth
    ? '이번 달 발송'
    : sendDate
      ? `${sendDate.getMonth() + 1}월 발송`
      : null;
  const sendTimeText = sendCompleted
    ? `${formatDate(sendCompleted, 'M월 d일 (EEE) a h:mm')} 발송 완료`
    : '';

  // Subtitle
  const subtitle = focusCampaign
    ? unviewed > 0
      ? `${focusCampaign.campaignName} 발송이 완료되었습니다. 미열람자 ${formatNumber(unviewed)}명에게 안내가 필요해요.`
      : `${focusCampaign.campaignName} 발송이 완료되었습니다. 모든 수신자가 명세서를 확인했어요.`
    : '';

  // Trend chart
  const trendPoints = trendQuery.data?.points ?? [];
  const firstHourCount = trendPoints[0]?.viewedCount ?? 0;
  const currentViewRate = Math.round((trendQuery.data?.currentViewRate ?? 0) * 100);

  // Unviewed elapsed text
  const maxElapsed = unviewedQuery.data?.maxElapsedHours ?? 0;
  const elapsedDays = Math.floor(maxElapsed / 24);
  const elapsedText =
    elapsedDays > 0
      ? `발송 후 ${elapsedDays}일이 지났습니다. 리마인드 메일을 보내거나 따로 안내해 주세요.`
      : '아직 확인하지 않은 수신자가 있습니다.';

  return (
    <div className="space-y-6">
      {/* ── Greeting row ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink-1">
            안녕하세요, {name}님
          </h1>
          <p className="mt-1 text-[13px] text-ink-3">
            {isEmpty
              ? 'PayLinker 운영자 콘솔에 오신 걸 환영합니다. 첫 번째 발송을 시작해 보세요.'
              : subtitle}
          </p>
        </div>
        <Link to="/admin/campaigns/new" className="shrink-0">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-navy-700 px-4 text-[12.5px] font-medium text-white shadow-sm transition hover:bg-navy-600"
          >
            <Icon.Plus size={14} />새 발송
          </button>
        </Link>
      </div>

      <ApiBadgeGroup>
        <ApiBadge method="GET" path="/dashboard/summary" note="STA-001" />
        <ApiBadge method="GET" path="/dashboard/campaigns/:id/summary" note="STA-002" />
        <ApiBadge method="GET" path="/dashboard/campaigns/:id/view-trend" note="STA-003" />
        <ApiBadge method="GET" path="/dashboard/campaigns/:id/unviewed-recipients" note="STA-004" />
        <ApiBadge method="GET" path="/dashboard/campaigns/:id/send-failures" note="STA-005" />
      </ApiBadgeGroup>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <>
          {/* ── Campaign focus card ── */}
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            {/* Header: badge + send time */}
            <div className="flex items-center gap-3 border-b border-border px-6 py-3.5">
              {campaignBadgeLabel && (
                <span className="inline-flex items-center rounded-full bg-mint-500 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  {campaignBadgeLabel}
                </span>
              )}
              {sendTimeText && (
                <span className="text-[12.5px] text-ink-3">{sendTimeText}</span>
              )}
              {focusCampaign && (
                <Link
                  to={`/admin/campaigns/${focusCampaign.campaignId}`}
                  className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-mint-700 hover:underline"
                >
                  상세 보기 <Icon.ChevronRight size={12} />
                </Link>
              )}
            </div>

            {/* Campaign name */}
            <div className="px-6 pt-4 pb-0">
              <h2 className="text-[17px] font-bold text-ink-1">{focusCampaign?.campaignName}</h2>
            </div>

            {/* Body: stats + trend chart */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">
              {/* Left: 4 stat boxes + progress bar */}
              <div className="px-6 py-5">
                <div className="grid grid-cols-4 gap-3">
                  <StatBox label="대상자" value={formatNumber(total)} unit="명" />
                  <StatBox
                    label="발송 완료"
                    value={formatNumber(sent)}
                    unit="명"
                    sub={`${sentPct}%`}
                    subSuccess
                  />
                  <StatBox
                    label="확인 완료"
                    value={formatNumber(viewed)}
                    unit="명"
                    sub={`${viewedPct}%`}
                    subSuccess
                  />
                  <StatBox label="아직 확인 전" value={formatNumber(unviewed)} unit="명" />
                </div>

                {/* Multi-segment progress bar */}
                <div className="mt-5">
                  <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
                    {barViewed > 0 && (
                      <div
                        className="h-full bg-mint-500 transition-[width] duration-700"
                        style={{ width: `${barViewed}%` }}
                      />
                    )}
                    {barUnviewed > 0 && (
                      <div
                        className="h-full bg-gray-300 transition-[width] duration-700"
                        style={{ width: `${barUnviewed}%` }}
                      />
                    )}
                    {barFailed > 0 && (
                      <div
                        className="h-full bg-danger-400 transition-[width] duration-700"
                        style={{ width: `${barFailed}%` }}
                      />
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-3">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block size-2 rounded-full bg-mint-500" />
                      확인함 {formatNumber(viewed)}명
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block size-2 rounded-full bg-gray-300" />
                      미확인 {formatNumber(unviewed)}명
                    </span>
                    {failed > 0 && (
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block size-2 rounded-full bg-danger-400" />
                        발송 실패 {formatNumber(failed)}명
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: trend chart */}
              <div className="border-t border-border px-6 py-5 md:border-l md:border-t-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-4">
                  발송 후 30일간 확인 추이
                </div>
                <TrendChart points={trendPoints} />
                {firstHourCount > 0 && (
                  <p className="mt-2 text-[11.5px] leading-relaxed text-ink-4">
                    발송 직후 1시간 안에{' '}
                    <strong className="text-ink-2">{formatNumber(firstHourCount)}명</strong>이
                    확인했고, 현재{' '}
                    <strong className="text-ink-2">{currentViewRate}%</strong>가 본인 명세서를
                    열람했습니다.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── "지금 확인이 필요한 일" ── */}
          <div>
            <h2 className="mb-4 text-[15px] font-bold text-ink-1">지금 확인이 필요한 일</h2>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Unviewed card */}
              <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                  <span className="text-[13.5px] font-semibold text-ink-1">
                    아직 확인하지 않은 직원
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      focusCampaign &&
                      navigate(
                        `/admin/campaigns/${focusCampaign.campaignId}?tab=actions&action=reminder`,
                      )
                    }
                    disabled={!focusCampaign}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-navy-700 px-3 py-1.5 text-[11.5px] font-medium text-white transition hover:bg-navy-600 disabled:opacity-40"
                  >
                    <Icon.Mail size={12} />
                    리마인드 보내기
                  </button>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="num text-[32px] font-bold leading-none text-warn-600">
                      {formatNumber(unviewedQuery.data?.totalUnviewedCount ?? 0)}
                    </span>
                    <span className="text-[13px] text-ink-4">명</span>
                  </div>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-ink-4">{elapsedText}</p>
                  {(unviewedQuery.data?.previews ?? []).length > 0 && (
                    <div className="mt-3 rounded-lg border border-border px-3.5 py-3">
                      <div className="mb-2 text-[11px] font-medium text-ink-5">미리보기</div>
                      <ul className="space-y-1.5">
                        {unviewedQuery.data!.previews.slice(0, 3).map((p) => (
                          <li key={p.recipientId} className="text-[12.5px] text-ink-2">
                            · {p.name} ({p.employeeNo})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Failed card */}
              <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                  <span className="text-[13.5px] font-semibold text-ink-1">
                    발송이 실패한 직원
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      focusCampaign &&
                      navigate(
                        `/admin/campaigns/${focusCampaign.campaignId}?tab=failures`,
                      )
                    }
                    disabled={!focusCampaign}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-navy-700 px-3 py-1.5 text-[11.5px] font-medium text-white transition hover:bg-navy-600 disabled:opacity-40"
                  >
                    <Icon.Eye size={12} />
                    실패 건 보기
                  </button>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="num text-[32px] font-bold leading-none text-danger-600">
                      {formatNumber(failuresQuery.data?.totalFailedCount ?? 0)}
                    </span>
                    <span className="text-[13px] text-ink-4">명</span>
                  </div>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-ink-4">
                    이메일 주소가 잘못되었거나 일시적인 오류입니다. 정보를 확인하고 다시
                    보내주세요.
                  </p>
                  {(failuresQuery.data?.previews ?? []).length > 0 && (
                    <div className="mt-3 rounded-lg border border-border px-3.5 py-3">
                      <div className="mb-2 text-[11px] font-medium text-ink-5">미리보기</div>
                      <ul className="space-y-1.5">
                        {failuresQuery.data!.previews.slice(0, 2).map((p) => (
                          <li key={p.campaignRecipientId} className="text-[12.5px] text-ink-2">
                            · {p.name} ({p.department}) — {p.email}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Scheduled campaigns */}
              <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                  <span className="text-[13.5px] font-semibold text-ink-1">다음 발송 예정</span>
                  <Link
                    to="/admin/scheduled"
                    className="text-[12px] font-medium text-mint-700 hover:underline"
                  >
                    예약 관리 ›
                  </Link>
                </div>
                <ul className="divide-y divide-border">
                  {(scheduledQuery.data?.items ?? []).slice(0, 3).map((c) => (
                    <li key={c.campaignId}>
                      <Link
                        to={`/admin/campaigns/${c.campaignId}`}
                        className="flex items-start gap-3.5 px-5 py-4 transition hover:bg-surface-sunken"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-sunken text-ink-3">
                          <Icon.Calendar size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium text-ink-1">
                            {c.campaignName}
                          </div>
                          <div className="mt-0.5 num text-[11.5px] text-ink-4">
                            {c.scheduledSendAt
                              ? formatDate(c.scheduledSendAt, 'yyyy년 M월 d일 (EEE) a h:mm')
                              : '—'}
                          </div>
                        </div>
                        <div className="num shrink-0 text-[12px] text-ink-3">
                          {formatNumber(c.totalRecipientCount)}명
                        </div>
                      </Link>
                    </li>
                  ))}
                  {!(scheduledQuery.data?.items ?? []).length && (
                    <li className="px-5 py-8 text-center text-[12.5px] text-ink-4">
                      예약된 발송이 없습니다.
                    </li>
                  )}
                </ul>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function StatBox({
  label,
  value,
  unit,
  sub,
  subSuccess,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  subSuccess?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border p-3.5">
      <div className="text-[11px] text-ink-4">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="num text-[22px] font-bold leading-none text-ink-1">{value}</span>
        {unit && <span className="text-[13px] text-ink-3">{unit}</span>}
      </div>
      {sub && (
        <div
          className={cn(
            'mt-1 num text-[11.5px] font-medium',
            subSuccess ? 'text-mint-700' : 'text-ink-4',
          )}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function TrendChart({ points }: { points: DashboardViewTrendPoint[] }) {
  if (!points.length) {
    return (
      <div className="flex h-32 items-center justify-center text-[11.5px] text-ink-5">
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
      const y = 100 - (((p.viewRate * 100) / maxRate) * 85 + 5);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  const areaPath = `${linePath} L ${w} 100 L 0 100 Z`;

  return (
    <div className="relative h-32 mt-2">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="trend-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-mint-400)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-mint-400)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#trend-grad)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-navy-700)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {/* Last point dot */}
        {points.length > 0 && (() => {
          const last = points[points.length - 1];
          const x = (points.length - 1) * stepX;
          const y = 100 - (((last.viewRate * 100) / maxRate) * 85 + 5);
          return (
            <circle
              cx={x.toFixed(1)}
              cy={y.toFixed(1)}
              r="2.5"
              fill="var(--color-mint-500)"
              stroke="white"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          );
        })()}
      </svg>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-border bg-white p-6">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="mt-3 h-5 w-52" />
        <div className="mt-5 grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-3.5">
              <Skeleton className="h-2.5 w-14" />
              <Skeleton className="mt-2 h-7 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-5 h-3 w-full rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-white p-5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-4 h-16 w-full rounded-lg" />
          </div>
        ))}
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
            <div className="text-[11.5px] leading-snug text-ink-4">{s.desc}</div>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-col items-center gap-3">
        <Link to="/admin/campaigns/new">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-navy-700 px-6 text-[13px] font-medium text-white shadow-sm transition hover:bg-navy-600"
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
