import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '../../../shared/ui';
import { notificationApi } from '../notifications/api';
import { formatRelative, formatDate } from '../../../shared/lib/format';
import { CHECK_ITEM_TYPE_LABEL } from '../../../shared/constants/status';
import { cn } from '../../../shared/lib/cn';

function getPageLabel(pathname: string): string {
  if (pathname === '/admin') return '대시보드';
  if (pathname.startsWith('/admin/campaigns/new')) return '새 발송';
  if (pathname.startsWith('/admin/campaigns')) return '발송 이력';
  if (pathname.startsWith('/admin/scheduled')) return '예약 발송';
  if (pathname.startsWith('/admin/checks')) return '확인 필요';
  if (pathname.startsWith('/admin/resend-requests')) return '재전송 요청';
  if (pathname.startsWith('/admin/settings')) return '설정';
  return '대시보드';
}

export function AdminTopbar({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ['check-items', 'topbar'],
    queryFn: () => notificationApi.checkItems({ status: 'OPEN', pageSize: 6 }),
    refetchInterval: 60_000,
  });
  const items = data?.items ?? [];
  const openCount = data?.openCount ?? 0;
  const pageLabel = getPageLabel(location.pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-white/90 px-5 backdrop-blur md:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="inline-flex size-10 items-center justify-center rounded-md text-ink-3 transition hover:bg-surface-sunken md:hidden"
        aria-label="메뉴"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" />
        </svg>
      </button>

      {/* Breadcrumb */}
      <nav className="flex flex-1 items-center gap-1.5 text-[13px]" aria-label="breadcrumb">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="text-ink-4 transition hover:text-ink-2"
        >
          홈
        </button>
        <Icon.ChevronRight size={13} className="shrink-0 text-ink-5" />
        <span className="font-medium text-ink-1">{pageLabel}</span>
      </nav>

      {/* Right: date + bell */}
      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden num text-[12px] text-ink-4 md:block">
          {formatDate(new Date(), 'yyyy년 M월 d일 (EEE)')}
        </span>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'relative inline-flex size-10 items-center justify-center rounded-md border transition',
              open
                ? 'border-mint-500 bg-mint-50 text-mint-700'
                : 'border-border-strong text-ink-3 hover:bg-surface-sunken',
            )}
            aria-label="확인 필요 알림"
          >
            <Icon.Bell size={18} />
            {openCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold leading-none text-white num">
                {openCount > 99 ? '99+' : openCount}
              </span>
            ) : null}
          </button>

          {open ? (
            <div
              className="absolute right-0 top-[calc(100%+10px)] z-30 w-[360px] overflow-hidden rounded-xl border border-border bg-white shadow-xl shadow-navy-900/10"
              onMouseLeave={() => setOpen(false)}
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="text-[14px] font-bold text-ink-1">확인 필요 알림</div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate('/admin/checks');
                  }}
                  className="text-[12px] font-medium text-mint-700 hover:underline"
                >
                  전체 보기
                </button>
              </div>
              <ul className="max-h-[400px] divide-y divide-border overflow-y-auto">
                {items.length === 0 ? (
                  <li className="px-4 py-8 text-center text-[12.5px] text-ink-4">
                    새로운 확인 항목이 없습니다.
                  </li>
                ) : (
                  items.slice(0, 6).map((n) => (
                    <li key={n.checkItemId}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          navigate(n.deepLink ?? `/admin/campaigns/${n.campaignId}`);
                        }}
                        className="block w-full px-5 py-4 text-left transition hover:bg-surface-sunken"
                      >
                        <div className="flex items-center justify-between gap-2 text-[10.5px] font-medium uppercase tracking-[0.1em] text-ink-4">
                          <span>{CHECK_ITEM_TYPE_LABEL[n.itemType]}</span>
                          <span className="num">{formatRelative(n.createdAt)}</span>
                        </div>
                        <div className="mt-1.5 truncate text-[13px] font-medium text-ink-1">
                          {n.campaignName}
                        </div>
                        <div className="mt-1 truncate text-[12px] text-ink-3">
                          {n.recipientName ? `대상자 ${n.recipientName}` : '캠페인 전체'}
                        </div>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
