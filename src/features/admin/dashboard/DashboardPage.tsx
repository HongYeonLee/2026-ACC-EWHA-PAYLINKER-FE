import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiBadge, ApiBadgeGroup, Badge, Card, CardBody, CardHeader, Icon, Skeleton } from '../../../shared/ui';
import { CampaignStatusBadge } from '../../../shared/ui/StatusBadge';
import { PageHeader } from '../common/PageHeader';
import { dashboardApi } from './api';
import { formatDate, formatNumber, maskEmail } from '../../../shared/lib/format';
import { useAuthStore } from '../../../shared/stores/auth.store';
import { SEND_FAILURE_REASON_LABEL } from '../../../shared/constants/status';
import { cn } from '../../../shared/lib/cn';
import type { DashboardViewTrendPoint } from '../../../shared/api/types';

function StatCard({
  label,
  value,
  delta,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  delta?: string;
  tone?: 'success' | 'warn' | 'danger' | 'neutral';
}) {
  const toneText =
    tone === 'success'
      ? 'text-mint-700'
      : tone === 'warn'
        ? 'text-warn-600'
        : tone === 'danger'
          ? 'text-danger-600'
          : 'text-ink-2';
  return (
    <Card>
      <CardBody className="py-6">
        <div className="flex items-center justify-between text-[11px] font-medium tracking-[0.08em] uppercase text-ink-4">
          {label}
        </div>
        <div className={cn('mt-3 num text-[28px] font-medium tracking-tight', toneText)}>
          {value}
        </div>
        {delta ? <div className="mt-2 text-[12px] text-ink-4">{delta}</div> : null}
      </CardBody>
    </Card>
  );
}

export function DashboardPage() {
  const profile = useAuthStore((s) => s.adminProfile);
  const navigate = useNavigate();

  const summaryQuery = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: dashboardApi.summary });
  const summary = summaryQuery.data;
  const firstCampaign = summary?.recentCampaigns[0];
  const focusId = firstCampaign?.campaignId;

  // STA-002: 단일 캠페인 정확한 수치
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

  const viewRate = focusCampaign ? Math.round((focusCampaign.viewRate ?? 0) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="대시보드"
        description={
          profile
            ? `${profile.name}님, 발송 현황과 확인이 필요한 항목을 한눈에 살펴보세요.`
            : '발송 현황과 확인이 필요한 항목을 한눈에 살펴보세요.'
        }
        apiBadges={
          <ApiBadgeGroup>
            <ApiBadge method="GET" path="/api/dashboard/summary" note="STA-001 발송 요약" />
            <ApiBadge
              method="GET"
              path="/api/dashboard/campaigns/:id/unviewed-recipients"
              note="STA-004 미확인"
            />
            <ApiBadge
              method="GET"
              path="/api/dashboard/campaigns/:id/send-failures"
              note="STA-005 실패"
            />
            <ApiBadge
              method="GET"
              path="/api/dashboard/campaigns/:id/view-trend"
              note="STA-003 확인 추이"
            />
          </ApiBadgeGroup>
        }
        actions={
          <Link to="/admin/campaigns/new">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-mint-500 px-3 text-[12.5px] font-medium text-navy-900 shadow-sm transition hover:bg-mint-400"
            >
              <Icon.Plus size={14} />새 발송
            </button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {summaryQuery.isLoading ? (
          [...Array(4).keys()].map((i) => (
            <Card key={i}>
              <CardBody>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-3 h-7 w-24" />
              </CardBody>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="진행 캠페인"
              value={formatNumber(summary?.recentCampaigns.length ?? 0)}
            />
            <StatCard
              label="미확인"
              value={formatNumber(summary?.totalUnviewedCount ?? 0)}
              tone="warn"
            />
            <StatCard
              label="발송 실패"
              value={formatNumber(summary?.totalFailedCount ?? 0)}
              tone="danger"
            />
            <StatCard
              label="확인 필요"
              value={formatNumber(summary?.attentionRequiredCount ?? 0)}
              tone="warn"
            />
          </>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* Focus campaign */}
          <Card>
            <CardHeader
              title="최근 발송 캠페인"
              subtitle={focusCampaign?.campaignName ?? '진행 중인 캠페인이 없습니다.'}
              apiBadge={
                focusId ? (
                  <ApiBadge
                    method="GET"
                    path="/api/dashboard/campaigns/:id/summary"
                    note="STA-002 단일 캠페인"
                  />
                ) : null
              }
              actions={
                focusCampaign ? (
                  <Link
                    to={`/admin/campaigns/${focusCampaign.campaignId}`}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-mint-700 hover:underline"
                  >
                    상세 보기
                    <Icon.ChevronRight size={12} />
                  </Link>
                ) : null
              }
            />
            <CardBody>
              {focusCampaign ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Metric label="총 대상자" value={formatNumber(focusCampaign.totalRecipientCount)} />
                  <Metric
                    label="발송 성공"
                    value={formatNumber(focusCampaign.sendSuccessCount)}
                    tone="success"
                  />
                  <Metric
                    label="발송 실패"
                    value={formatNumber(focusCampaign.sendFailedCount)}
                    tone="danger"
                  />
                  <Metric
                    label="미확인"
                    value={formatNumber(focusCampaign.unviewedCount)}
                    tone="warn"
                  />
                </div>
              ) : null}

              {focusCampaign ? (
                <div className="mt-5 rounded-lg border border-border bg-surface-sunken px-4 py-3">
                  <div className="flex items-center justify-between text-[11.5px] text-ink-3">
                    <span>열람률</span>
                    <span className="num font-medium text-ink-1">{viewRate}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full bg-gradient-to-r from-mint-400 to-mint-600 transition-all"
                      style={{ width: `${viewRate}%` }}
                    />
                  </div>
                  <SparklineMini points={trendQuery.data?.points ?? []} />
                </div>
              ) : null}
            </CardBody>
          </Card>

          {/* View Trend (STA-003) */}
          <Card>
            <CardHeader
              title="명세서 확인 추이"
              subtitle="발송 후 2시간 간격 확인 추이"
              actions={
                trendQuery.data ? (
                  <span className="text-[12px] text-ink-4">
                    현재 확인율{' '}
                    <span className="num font-medium text-ink-1">
                      {Math.round((trendQuery.data.currentViewRate ?? 0) * 100)}%
                    </span>
                  </span>
                ) : null
              }
            />
            <CardBody>
              <TrendChart points={trendQuery.data?.points ?? []} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          {/* Unviewed (STA-004) */}
          <Card>
            <CardHeader
              title="미확인 수신자"
              subtitle={`경과 ${unviewedQuery.data?.maxElapsedHours ?? 0}시간`}
              actions={
                focusCampaign ? (
                  <Link
                    to={`/admin/campaigns/${focusCampaign.campaignId}?tab=recipients&filter=UNVIEWED`}
                    className="text-[12px] font-medium text-mint-700 hover:underline"
                  >
                    전체 보기
                  </Link>
                ) : null
              }
            />
            <CardBody>
              <div className="flex items-baseline gap-2">
                <div className="num text-[26px] font-medium text-warn-600">
                  {formatNumber(unviewedQuery.data?.totalUnviewedCount ?? 0)}
                </div>
                <div className="text-[12px] text-ink-4">명</div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {(unviewedQuery.data?.previews ?? []).map((p) => (
                  <li
                    key={p.recipientId}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-[12.5px]"
                  >
                    <span className="text-ink-2">{p.name}</span>
                    <span className="num text-ink-4">{p.employeeNo}</span>
                  </li>
                ))}
                {(unviewedQuery.data?.previews ?? []).length === 0 && !unviewedQuery.isLoading ? (
                  <li className="rounded-md border border-dashed border-border px-3 py-3 text-center text-[12px] text-ink-4">
                    미확인 수신자가 없습니다.
                  </li>
                ) : null}
              </ul>
              <button
                type="button"
                onClick={() =>
                  focusCampaign &&
                  navigate(
                    `/admin/campaigns/${focusCampaign.campaignId}?tab=actions&action=reminder`,
                  )
                }
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border-strong px-3.5 py-2.5 text-[12.5px] font-medium text-ink-2 transition hover:bg-surface-sunken"
              >
                <Icon.Mail size={13} /> 리마인드 발송 요청
              </button>
            </CardBody>
          </Card>

          {/* Failures (STA-005) */}
          <Card>
            <CardHeader
              title="발송 실패 대상자"
              actions={
                focusCampaign ? (
                  <Link
                    to={`/admin/campaigns/${focusCampaign.campaignId}?tab=actions`}
                    className="text-[12px] font-medium text-mint-700 hover:underline"
                  >
                    실패 건 보기
                  </Link>
                ) : null
              }
            />
            <CardBody>
              <div className="flex items-baseline gap-2">
                <div className="num text-[26px] font-medium text-danger-600">
                  {formatNumber(failuresQuery.data?.totalFailedCount ?? 0)}
                </div>
                <div className="text-[12px] text-ink-4">명</div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {(failuresQuery.data?.previews ?? []).map((p) => (
                  <li
                    key={p.campaignRecipientId}
                    className="rounded-md border border-border px-3 py-2 text-[12.5px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink-2">{p.name}</span>
                      <Badge tone="danger" size="xs">
                        {SEND_FAILURE_REASON_LABEL[p.failureReason] ?? p.failureReason}
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-4">
                      <span>{p.department}</span>
                      <span className="num">{maskEmail(p.email)}</span>
                    </div>
                  </li>
                ))}
                {(failuresQuery.data?.previews ?? []).length === 0 && !failuresQuery.isLoading ? (
                  <li className="rounded-md border border-dashed border-border px-3 py-3 text-center text-[12px] text-ink-4">
                    실패한 발송이 없습니다.
                  </li>
                ) : null}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Recent campaigns list */}
      <Card className="mt-5">
        <CardHeader
          title="최근 캠페인"
          actions={
            <Link
              to="/admin/campaigns"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-mint-700 hover:underline"
            >
              전체 발송 이력
              <Icon.ChevronRight size={12} />
            </Link>
          }
        />
        <CardBody className="px-0 py-0">
          <ul className="divide-y divide-border">
            {(summary?.recentCampaigns ?? []).map((c) => {
              const rate = Math.round((c.viewRate ?? 0) * 100);
              return (
                <li key={c.campaignId}>
                  <Link
                    to={`/admin/campaigns/${c.campaignId}`}
                    className="grid grid-cols-2 items-center gap-3 px-5 py-3 transition hover:bg-surface-sunken md:grid-cols-[1.5fr_0.7fr_0.7fr_0.6fr_1fr] md:gap-4"
                  >
                    <div>
                      <div className="text-[13px] font-medium text-ink-1">{c.campaignName}</div>
                      <div className="mt-0.5 text-[11px] text-ink-4">
                        {c.sendCompletedAt
                          ? `발송 ${formatDate(c.sendCompletedAt)}`
                          : '발송 전'}
                      </div>
                    </div>
                    <div className="text-[12px] text-ink-3 md:text-left">
                      <CampaignStatusBadge status={c.status} />
                    </div>
                    <div className="num text-[12.5px] text-ink-2">
                      {formatNumber(c.viewedCount)} / {formatNumber(c.totalRecipientCount)}
                    </div>
                    <div className="hidden text-[11.5px] text-ink-4 md:block">
                      열람률{' '}
                      <span className="num font-medium text-ink-2">{rate}%</span>
                    </div>
                    <div className="hidden h-1.5 overflow-hidden rounded-full bg-surface-sunken md:block">
                      <div
                        className="h-full bg-gradient-to-r from-mint-400 to-mint-600"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
            {(summary?.recentCampaigns ?? []).length === 0 && !summaryQuery.isLoading ? (
              <li className="px-5 py-8 text-center text-[12.5px] text-ink-4">
                진행 중인 캠페인이 없습니다.
              </li>
            ) : null}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  tone?: 'success' | 'warn' | 'danger' | 'neutral';
}) {
  const toneText =
    tone === 'success'
      ? 'text-mint-700'
      : tone === 'warn'
        ? 'text-warn-600'
        : tone === 'danger'
          ? 'text-danger-600'
          : 'text-ink-2';
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-4">{label}</div>
      <div className={cn('mt-1 num text-[20px] font-medium', toneText)}>{value}</div>
    </div>
  );
}

function SparklineMini({ points }: { points: DashboardViewTrendPoint[] }) {
  if (!points.length) return null;
  const values = points.map((p) => Math.round(p.viewRate * 100));
  const max = Math.max(...values, 1);
  return (
    <div className="mt-3 flex h-10 items-end gap-0.5">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-gradient-to-t from-mint-200 to-mint-500"
          style={{ height: `${Math.max(10, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function TrendChart({ points }: { points: DashboardViewTrendPoint[] }) {
  if (!points.length) {
    return (
      <div className="flex h-44 items-center justify-center text-[12.5px] text-ink-4">
        추이 데이터가 아직 충분하지 않습니다.
      </div>
    );
  }
  const maxRate = Math.max(...points.map((p) => p.viewRate * 100), 10);
  const width = 100;
  const stepX = width / (points.length - 1 || 1);
  const linePath = points
    .map((p, i) => {
      const x = i * stepX;
      const y = 100 - (p.viewRate * 100) / maxRate * 90;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
  const areaPath = `${linePath} L ${width} 100 L 0 100 Z`;

  return (
    <div className="relative h-44">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="trend-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-mint-400)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--color-mint-400)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#trend-grad)" />
        <path d={linePath} fill="none" stroke="var(--color-mint-500)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex justify-between px-1 text-[10px] text-ink-4">
        {points
          .filter((_, i) => i % Math.ceil(points.length / 4) === 0)
          .map((p) => (
            <span key={p.snapshotAt} className="num">
              {formatDate(p.snapshotAt, 'HH:mm')}
            </span>
          ))}
      </div>
    </div>
  );
}
