import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../notifications/api';
import { PageHeader } from '../common/PageHeader';
import {
  ApiBadge,
  ApiBadgeGroup,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Icon,
  Pill,
  SkeletonRow,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  toast,
} from '../../../shared/ui';
import {
  LINK_ERROR_LABEL,
  RESEND_REQUEST_STATUS_LABEL,
  type ResendRequestStatus,
} from '../../../shared/constants/status';
import type { ResendRequestAction } from '../../../shared/api/types';
import { formatDate, formatRelative } from '../../../shared/lib/format';

const FILTERS: Array<{ value: 'ALL' | ResendRequestStatus; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'REQUESTED', label: RESEND_REQUEST_STATUS_LABEL.REQUESTED },
  { value: 'COMPLETED', label: RESEND_REQUEST_STATUS_LABEL.COMPLETED },
  { value: 'REJECTED', label: RESEND_REQUEST_STATUS_LABEL.REJECTED },
];

export function ResendRequestsPage() {
  const [filter, setFilter] = useState<'ALL' | ResendRequestStatus>('REQUESTED');
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['resend-requests', filter],
    queryFn: () =>
      notificationApi.resendRequestList({
        status: filter === 'ALL' ? undefined : filter,
      }),
  });

  const actionMutation = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: ResendRequestAction }) =>
      notificationApi.resendRequestAction(requestId, { action }),
    onSuccess: (_res, vars) => {
      if (vars.action === 'APPROVE') {
        toast.success('재전송이 승인되었습니다.', '새 보안 링크가 발급되어 발송됩니다.');
      } else {
        toast.success('재전송 요청이 반려되었습니다.');
      }
      queryClient.invalidateQueries({ queryKey: ['resend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['check-items'] });
    },
  });

  const items = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="재전송 요청"
        description="수신자가 보낸 재전송 요청을 검토하고 처리합니다."
        breadcrumbs={[{ label: '관리자' }, { label: '재전송 요청' }]}
        apiBadges={
          <ApiBadgeGroup>
            <ApiBadge method="GET" path="/api/notifications/resend-requests" note="REQ-001 조회" />
            <ApiBadge
              method="PATCH"
              path="/api/notifications/resend-requests/:id"
              note="REQ-002 처리(APPROVE/REJECT)"
            />
          </ApiBadgeGroup>
        }
      />
      <Card>
        <CardBody>
          <Pill items={FILTERS} value={filter} onChange={setFilter} />
        </CardBody>
        <Table>
          <THead>
            <TR>
              <TH>요청 수신자</TH>
              <TH>캠페인</TH>
              <TH>사유</TH>
              <TH>요청 시각</TH>
              <TH>상태</TH>
              <TH className="text-right">처리</TH>
            </TR>
          </THead>
          <TBody>
            {isLoading ? (
              <>
                <SkeletonRow cols={6} />
                <SkeletonRow cols={6} />
              </>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    title="새 재전송 요청이 없습니다"
                    description="수신자가 새 링크를 요청하면 이 목록에서 처리할 수 있습니다."
                    icon={<Icon.Inbox size={28} />}
                  />
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <TR key={r.requestId}>
                  <TD>
                    <div className="font-medium text-ink-1">{r.recipientName}</div>
                    <div className="num text-[11px] text-ink-4">{r.email}</div>
                  </TD>
                  <TD>
                    <Link
                      to={`/admin/campaigns/${r.campaignId}`}
                      className="text-[12.5px] text-ink-2 hover:text-mint-700"
                    >
                      {r.campaignName}
                    </Link>
                  </TD>
                  <TD className="text-[12px] text-ink-3">
                    {LINK_ERROR_LABEL[r.resendReason]?.title ?? r.resendReason}
                  </TD>
                  <TD className="text-[11.5px] text-ink-3">
                    <div className="num">{formatDate(r.requestedAt)}</div>
                    <div className="text-ink-4">{formatRelative(r.requestedAt)}</div>
                  </TD>
                  <TD>
                    <Badge
                      tone={
                        r.status === 'COMPLETED'
                          ? 'success'
                          : r.status === 'REJECTED'
                            ? 'danger'
                            : 'warn'
                      }
                      size="xs"
                    >
                      {RESEND_REQUEST_STATUS_LABEL[r.status]}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    {r.status === 'REQUESTED' ? (
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            actionMutation.mutate({ requestId: r.requestId, action: 'REJECT' })
                          }
                        >
                          반려
                        </Button>
                        <Button
                          size="sm"
                          loading={
                            actionMutation.isPending &&
                            actionMutation.variables?.requestId === r.requestId
                          }
                          onClick={() =>
                            actionMutation.mutate({ requestId: r.requestId, action: 'APPROVE' })
                          }
                        >
                          재전송
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-ink-4">
                        {r.processedBy
                          ? `${r.processedBy} · ${r.processedAt ? formatDate(r.processedAt) : ''}`
                          : '-'}
                      </span>
                    )}
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
