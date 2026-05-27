import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { campaignApi } from '../campaigns/api';
import { notificationApi } from '../notifications/api';
import { PageHeader } from '../common/PageHeader';
import {
  Button,
  Card,
  CampaignStatusBadge,
  Icon,
  Tabs,
  toast,
} from '../../../shared/ui';
import { formatDate, formatNumber } from '../../../shared/lib/format';
import type { CampaignListItem } from '../../../shared/api/types';

type FilterTab = 'ALL' | 'UNVIEWED' | 'FAILED' | 'RESEND';

function StatItem({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[12px] text-ink-4">{label}</span>
      <span className={`text-[13px] font-semibold ${colorClass ?? 'text-ink-1'}`}>
        {formatNumber(value)}
      </span>
    </div>
  );
}

function CampaignCheckCard({
  campaign,
  resendCount,
  onRemind,
  onResend,
  isReminding,
  isResending,
}: {
  campaign: CampaignListItem;
  resendCount: number;
  onRemind: () => void;
  onResend: () => void;
  isReminding: boolean;
  isResending: boolean;
}) {
  const unviewedCount = Math.max(0, campaign.sendSuccessCount - campaign.viewedCount);
  const viewRate =
    campaign.totalRecipientCount > 0
      ? Math.round((campaign.viewedCount / campaign.totalRecipientCount) * 100)
      : 0;

  return (
    <div className="px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={`/admin/campaigns/${campaign.campaignId}`}
            className="text-[15px] font-bold text-ink-1 hover:text-mint-700 transition-colors"
          >
            {campaign.campaignName}
          </Link>
          <CampaignStatusBadge status={campaign.status} />
        </div>

        <div className="flex items-center gap-2">
          {unviewedCount > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onRemind}
              loading={isReminding}
              iconLeft={<Icon.Bell size={13} />}
            >
              미확인 {formatNumber(unviewedCount)}명에게 리마인드
            </Button>
          )}
          {campaign.sendFailedCount > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onResend}
              loading={isResending}
              iconLeft={<Icon.Refresh size={13} />}
            >
              실패 {formatNumber(campaign.sendFailedCount)}명 재발송
            </Button>
          )}
        </div>
      </div>

      <div className="mt-1.5 text-[12px] text-ink-4">
        {campaign.sendCompletedAt
          ? `발송 완료 ${formatDate(campaign.sendCompletedAt)}`
          : campaign.scheduledSendAt
            ? `예약 발송 ${formatDate(campaign.scheduledSendAt)}`
            : '발송 전'}
        {' · '}총 {formatNumber(campaign.totalRecipientCount)}명
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        <StatItem label="확인완료" value={campaign.viewedCount} colorClass="text-ink-1" />
        {unviewedCount > 0 && (
          <StatItem label="미확인" value={unviewedCount} colorClass="text-[var(--color-warn-text)]" />
        )}
        {campaign.sendFailedCount > 0 && (
          <StatItem label="발송실패" value={campaign.sendFailedCount} colorClass="text-[var(--color-danger-text)]" />
        )}
        {resendCount > 0 && (
          <StatItem label="재요청" value={resendCount} colorClass="text-[var(--color-scheduled-text)]" />
        )}

        <div className="ml-auto flex items-center gap-2.5">
          <span className="text-[12px] text-ink-4">확인률</span>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-mint-500 transition-all"
              style={{ width: `${viewRate}%` }}
            />
          </div>
          <span className="min-w-[32px] text-right text-[12px] font-medium text-ink-2">
            {viewRate}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function ChecksPage() {
  const [tab, setTab] = useState<FilterTab>('ALL');
  const queryClient = useQueryClient();

  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns', { pageSize: 100 }],
    queryFn: () => campaignApi.list({ pageSize: 100 }),
  });

  const { data: resendData } = useQuery({
    queryKey: ['resend-requests', { status: 'REQUESTED', pageSize: 100 }],
    queryFn: () => notificationApi.resendRequestList({ status: 'REQUESTED', pageSize: 100 }),
  });

  const campaigns = campaignsData?.items ?? [];
  const resendRequests = resendData?.items ?? [];

  const resendCountByCampaign = resendRequests.reduce<Record<string, number>>((acc, req) => {
    acc[req.campaignId] = (acc[req.campaignId] ?? 0) + 1;
    return acc;
  }, {});

  const needsAttention = (c: CampaignListItem) => {
    const unviewed = Math.max(0, c.sendSuccessCount - c.viewedCount);
    return unviewed > 0 || c.sendFailedCount > 0 || (resendCountByCampaign[c.campaignId] ?? 0) > 0;
  };

  const issueCampaigns = campaigns.filter(needsAttention);
  const resolvedCount = campaigns.length - issueCampaigns.length;

  const unviewedTabCount = issueCampaigns.filter(
    (c) => Math.max(0, c.sendSuccessCount - c.viewedCount) > 0,
  ).length;
  const failedTabCount = issueCampaigns.filter((c) => c.sendFailedCount > 0).length;
  const resendTabCount = issueCampaigns.filter(
    (c) => (resendCountByCampaign[c.campaignId] ?? 0) > 0,
  ).length;

  const TABS: Array<{ value: FilterTab; label: string; count: number }> = [
    { value: 'ALL', label: '전체', count: issueCampaigns.length },
    { value: 'UNVIEWED', label: '미확인', count: unviewedTabCount },
    { value: 'FAILED', label: '발송 실패', count: failedTabCount },
    { value: 'RESEND', label: '재요청', count: resendTabCount },
  ];

  const filtered = issueCampaigns.filter((c) => {
    if (tab === 'UNVIEWED') return Math.max(0, c.sendSuccessCount - c.viewedCount) > 0;
    if (tab === 'FAILED') return c.sendFailedCount > 0;
    if (tab === 'RESEND') return (resendCountByCampaign[c.campaignId] ?? 0) > 0;
    return true;
  });

  const remindMutation = useMutation({
    mutationFn: (campaignId: string) =>
      campaignApi.reminders(campaignId, { target: 'ALL_UNVIEWED' }),
    onSuccess: (data) => {
      toast.success(`${data.queuedCount}명에게 리마인드 이메일을 발송했습니다.`);
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: () => {
      toast.error('리마인드 발송에 실패했습니다.');
    },
  });

  const resendMutation = useMutation({
    mutationFn: (campaignId: string) =>
      campaignApi.manualResend(campaignId, { target: 'ALL_FAILED' }),
    onSuccess: (data) => {
      toast.success(`${data.queuedCount}명에게 재발송을 시작했습니다.`);
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: () => {
      toast.error('재발송 요청에 실패했습니다.');
    },
  });

  return (
    <div>
      <PageHeader
        title="확인 필요"
        description="아직 확인 안 한 직원, 발송 실패한 직원, 재발송 요청한 직원을 캠페인별로 모았어요."
        breadcrumbs={[{ label: '관리자' }, { label: '확인 필요' }]}
      />

      <Card>
        <Tabs
          items={TABS}
          value={tab}
          onChange={setTab}
          className="px-4"
        />

        <div className="divide-y divide-border">
          {campaignsLoading ? (
            <div className="px-6 py-12 text-center text-[13px] text-ink-4">불러오는 중…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14">
              <div className="flex size-12 items-center justify-center rounded-full bg-surface-sunken text-ink-4">
                <Icon.Check size={22} />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-medium text-ink-1">모두 확인됐어요</p>
                <p className="mt-1 text-[12.5px] text-ink-4">
                  {tab === 'ALL'
                    ? '현재 후속 조치가 필요한 캠페인이 없습니다.'
                    : '해당 유형의 확인 필요 캠페인이 없습니다.'}
                </p>
              </div>
            </div>
          ) : (
            filtered.map((campaign) => (
              <CampaignCheckCard
                key={campaign.campaignId}
                campaign={campaign}
                resendCount={resendCountByCampaign[campaign.campaignId] ?? 0}
                onRemind={() => remindMutation.mutate(campaign.campaignId)}
                onResend={() => resendMutation.mutate(campaign.campaignId)}
                isReminding={
                  remindMutation.isPending && remindMutation.variables === campaign.campaignId
                }
                isResending={
                  resendMutation.isPending && resendMutation.variables === campaign.campaignId
                }
              />
            ))
          )}
        </div>

        {tab === 'ALL' && resolvedCount > 0 && filtered.length > 0 && (
          <div className="border-t border-border px-6 py-4 text-center text-[12.5px] text-ink-4">
            나머지 {resolvedCount}개 캠페인은 모두 확인됐어요.
          </div>
        )}
      </Card>
    </div>
  );
}
