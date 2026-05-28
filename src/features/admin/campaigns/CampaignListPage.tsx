import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { campaignApi } from './api';
import { PageHeader } from '../common/PageHeader';
import {
  ApiBadge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Icon,
  Input,
  Pagination,
  Pill,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  SkeletonRow,
} from '../../../shared/ui';
import { CampaignStatusBadge } from '../../../shared/ui/StatusBadge';
import { CAMPAIGN_STATUS_LABEL, type CampaignStatus } from '../../../shared/constants/status';
import { formatDate, formatNumber } from '../../../shared/lib/format';

const PAGE_SIZE = 10;

const STATUS_FILTERS: Array<{ value: 'ALL' | CampaignStatus; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'DRAFT', label: CAMPAIGN_STATUS_LABEL.DRAFT },
  { value: 'READY', label: CAMPAIGN_STATUS_LABEL.READY },
  { value: 'SCHEDULED', label: CAMPAIGN_STATUS_LABEL.SCHEDULED },
  { value: 'SENDING', label: CAMPAIGN_STATUS_LABEL.SENDING },
  { value: 'SENT', label: CAMPAIGN_STATUS_LABEL.SENT },
  { value: 'PARTIAL_FAILED', label: CAMPAIGN_STATUS_LABEL.PARTIAL_FAILED },
  { value: 'FAILED', label: CAMPAIGN_STATUS_LABEL.FAILED },
  { value: 'CANCELLED', label: CAMPAIGN_STATUS_LABEL.CANCELLED },
];

export function CampaignListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'ALL' | CampaignStatus>('ALL');
  const [keyword, setKeyword] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', { page, status, keyword }],
    queryFn: () =>
      campaignApi.list({
        page,
        pageSize: PAGE_SIZE,
        status: status === 'ALL' ? undefined : status,
        keyword: keyword || undefined,
      }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <div>
      <PageHeader
        title="발송 이력"
        description="진행 중 또는 완료된 모든 캠페인을 한눈에 확인합니다."
        breadcrumbs={[{ label: '관리자' }, { label: '발송 이력' }]}
        apiBadges={<ApiBadge method="GET" path="/api/campaigns" note="CAM-001 목록 조회" />}
        actions={
          <Link to="/admin/campaigns/new">
            <Button iconLeft={<Icon.Plus size={14} />}>새 발송</Button>
          </Link>
        }
      />

      <Card>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] sm:max-w-xs">
              <Input
                placeholder="캠페인명 검색"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                iconLeft={<Icon.Search size={14} />}
              />
            </div>
          </div>
          <Pill
            items={STATUS_FILTERS}
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
        </CardBody>

        <Table>
          <THead>
            <TR>
              <TH className="w-[28%]">캠페인명</TH>
              <TH>상태</TH>
              <TH>발송일</TH>
              <TH className="text-right">대상자</TH>
              <TH className="text-right">성공/실패</TH>
              <TH className="text-right">확인</TH>
              <TH className="text-right">생성</TH>
            </TR>
          </THead>
          <TBody>
            {isLoading ? (
              <>
                <SkeletonRow cols={7} />
                <SkeletonRow cols={7} />
                <SkeletonRow cols={7} />
              </>
            ) : (data?.items ?? []).length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    title="조회 결과가 없습니다"
                    description="필터 조건을 바꾸거나 새 발송을 시작해 보세요."
                    icon={<Icon.Inbox size={28} />}
                    action={
                      <Link to="/admin/campaigns/new">
                        <Button size="sm" iconLeft={<Icon.Plus size={12} />}>
                          새 발송
                        </Button>
                      </Link>
                    }
                  />
                </td>
              </tr>
            ) : (
              data?.items.map((c) => (
                <TR key={c.campaignId}>
                  <TD>
                    <Link
                      to={`/admin/campaigns/${c.campaignId}`}
                      className="block font-medium text-ink-1 hover:text-mint-700"
                    >
                      {c.campaignName}
                    </Link>
                    <div className="mt-0.5 font-mono text-[10.5px] text-ink-4">{c.campaignId}</div>
                  </TD>
                  <TD>
                    <CampaignStatusBadge status={c.status} />
                  </TD>
                  <TD className="num text-[11.5px] text-ink-3">
                    {c.sendCompletedAt
                      ? formatDate(c.sendCompletedAt)
                      : c.scheduledSendAt
                        ? `예약 ${formatDate(c.scheduledSendAt)}`
                        : '발송 전'}
                  </TD>
                  <TD className="num text-right">{formatNumber(c.totalRecipientCount)}</TD>
                  <TD className="text-right">
                    <span className="num text-mint-700">
                      {formatNumber(c.sendSuccessCount)}
                    </span>
                    <span className="text-ink-4 mx-1">/</span>
                    <span
                      className={`num ${c.sendFailedCount > 0 ? 'text-danger-600' : 'text-ink-3'}`}
                    >
                      {formatNumber(c.sendFailedCount)}
                    </span>
                  </TD>
                  <TD className="text-right">
                    <span className="num text-ink-1">{formatNumber(c.viewedCount)}</span>
                  </TD>
                  <TD className="text-right num text-[11.5px] text-ink-3">
                    {formatDate(c.createdAt)}
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>

        {data ? (
          <div className="border-t border-border px-4 py-2">
            <Pagination page={data.page} totalPages={totalPages} onChange={setPage} />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
