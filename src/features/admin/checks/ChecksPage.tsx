import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { notificationApi } from '../notifications/api';
import { PageHeader } from '../common/PageHeader';
import {
  ApiBadge,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Icon,
  Pill,
} from '../../../shared/ui';
import {
  CHECK_ITEM_STATUS_LABEL,
  CHECK_ITEM_TYPE_LABEL,
  type CheckItemStatus,
  type CheckItemType,
} from '../../../shared/constants/status';
import { formatRelative } from '../../../shared/lib/format';

const FILTERS: Array<{ value: 'ALL' | CheckItemStatus; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'OPEN', label: CHECK_ITEM_STATUS_LABEL.OPEN },
  { value: 'IN_PROGRESS', label: CHECK_ITEM_STATUS_LABEL.IN_PROGRESS },
  { value: 'RESOLVED', label: CHECK_ITEM_STATUS_LABEL.RESOLVED },
];

const TYPE_FILTERS: Array<{ value: 'ALL' | CheckItemType; label: string }> = [
  { value: 'ALL', label: '전체 유형' },
  { value: 'UNVIEWED_RECIPIENT', label: CHECK_ITEM_TYPE_LABEL.UNVIEWED_RECIPIENT },
  { value: 'RESEND_REQUEST', label: CHECK_ITEM_TYPE_LABEL.RESEND_REQUEST },
  { value: 'FINAL_FAILED', label: CHECK_ITEM_TYPE_LABEL.FINAL_FAILED },
];

export function ChecksPage() {
  const [status, setStatus] = useState<'ALL' | CheckItemStatus>('OPEN');
  const [type, setType] = useState<'ALL' | CheckItemType>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['check-items', { status, type }],
    queryFn: () =>
      notificationApi.checkItems({
        status: status === 'ALL' ? undefined : status,
        itemType: type === 'ALL' ? undefined : type,
      }),
  });

  const items = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="확인 필요"
        description="후속 조치가 필요한 항목을 한곳에서 확인합니다."
        breadcrumbs={[{ label: '관리자' }, { label: '확인 필요' }]}
        apiBadges={
          <ApiBadge method="GET" path="/api/notifications/check-items" note="REQ-003 확인 큐" />
        }
      />

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <Pill items={FILTERS} value={status} onChange={setStatus} />
          <Pill items={TYPE_FILTERS} value={type} onChange={setType} />
        </CardBody>
        <div className="border-t border-border">
          {isLoading ? (
            <div className="px-6 py-10 text-center text-[12.5px] text-ink-4">불러오는 중…</div>
          ) : items.length === 0 ? (
            <EmptyState
              title="확인이 필요한 항목이 없습니다"
              description="새로운 알림이 발생하면 이 화면에서 즉시 처리할 수 있습니다."
              icon={<Icon.Inbox size={28} />}
            />
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.checkItemId} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[10.5px] uppercase tracking-[0.1em] text-ink-4">
                        <Badge
                          tone={
                            item.itemType === 'FINAL_FAILED'
                              ? 'danger'
                              : item.itemType === 'UNVIEWED_RECIPIENT'
                                ? 'warn'
                                : 'scheduled'
                          }
                          size="xs"
                        >
                          {CHECK_ITEM_TYPE_LABEL[item.itemType]}
                        </Badge>
                        <span>{formatRelative(item.createdAt)}</span>
                      </div>
                      <Link
                        to={`/admin/campaigns/${item.campaignId}`}
                        className="mt-1.5 block text-[14px] font-medium text-ink-1 hover:text-mint-700"
                      >
                        {item.campaignName}
                      </Link>
                      <div className="mt-1 text-[12px] text-ink-3">
                        {item.recipientName
                          ? `대상자: ${item.recipientName}`
                          : '캠페인 전체 항목'}
                        {item.relatedRequestId ? ` · 요청 ${item.relatedRequestId}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        tone={item.checkStatus === 'RESOLVED' ? 'success' : 'warn'}
                        size="xs"
                      >
                        {CHECK_ITEM_STATUS_LABEL[item.checkStatus]}
                      </Badge>
                      <Link
                        to={item.deepLink ?? `/admin/campaigns/${item.campaignId}`}
                      >
                        <Button size="sm" variant="ghost" iconRight={<Icon.ChevronRight size={12} />}>
                          캠페인 열기
                        </Button>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
