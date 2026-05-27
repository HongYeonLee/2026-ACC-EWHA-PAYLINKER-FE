import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { campaignApi } from './api';
import { PageHeader } from '../common/PageHeader';
import { ApiBadge, Card, CardBody, EmptyState, Icon } from '../../../shared/ui';
import { CampaignStatusBadge } from '../../../shared/ui/StatusBadge';
import { formatDate, formatNumber } from '../../../shared/lib/format';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export function ScheduledPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', 'scheduled'],
    queryFn: () => campaignApi.list({ status: 'SCHEDULED', pageSize: 50 }),
  });

  const items = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="예약 발송"
        description="예약된 캠페인의 발송 시점을 한눈에 확인합니다."
        breadcrumbs={[{ label: '관리자' }, { label: '예약 발송' }]}
        apiBadges={<ApiBadge method="GET" path="/api/campaigns?status=SCHEDULED" note="RSV-001 목록" />}
      />

      {items.length === 0 && !isLoading ? (
        <Card>
          <CardBody>
            <EmptyState
              title="예약된 캠페인이 없습니다"
              description="새 발송에서 예약 시각을 지정해 캠페인을 등록할 수 있습니다."
              icon={<Icon.Calendar size={28} />}
              action={
                <Link
                  to="/admin/campaigns/new"
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-mint-500 px-3 text-[12.5px] font-medium text-navy-900"
                >
                  <Icon.Plus size={12} /> 새 발송 만들기
                </Link>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((c) => {
            const due = c.scheduledSendAt ? parseISO(c.scheduledSendAt) : null;
            const dueLabel = due
              ? formatDistanceToNowStrict(due, { addSuffix: true, locale: ko })
              : '';
            return (
              <Card key={c.campaignId}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/admin/campaigns/${c.campaignId}`}
                        className="text-[14px] font-medium text-ink-1 hover:text-mint-700"
                      >
                        {c.campaignName}
                      </Link>
                      <div className="mt-1 text-[11.5px] text-ink-4">
                        생성 {formatDate(c.createdAt)}
                      </div>
                    </div>
                    <CampaignStatusBadge status={c.status} />
                  </div>
                  <div className="mt-4 rounded-md border border-border bg-surface-sunken px-4 py-3">
                    <div className="text-[10.5px] font-medium tracking-[0.1em] uppercase text-ink-4">
                      예약 시각
                    </div>
                    <div className="mt-1 num text-[18px] font-medium text-ink-1">
                      {c.scheduledSendAt ? formatDate(c.scheduledSendAt, 'yyyy-MM-dd HH:mm') : '-'}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-mint-700">{dueLabel}</div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                    <Pair label="대상자" value={formatNumber(c.totalRecipientCount)} />
                    <Pair label="확인" value={formatNumber(c.viewedCount)} />
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-white px-3.5 py-2.5">
      <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-4">{label}</div>
      <div className="mt-0.5 num text-[12.5px] text-ink-1">{value}</div>
    </div>
  );
}
