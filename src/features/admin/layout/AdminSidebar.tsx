import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '../../../shared/ui';
import { cn } from '../../../shared/lib/cn';
import { useAuthStore } from '../../../shared/stores/auth.store';
import { USE_COGNITO, cognitoLogoutUrl } from '../../../shared/config/cognito';
import { notificationApi } from '../notifications/api';

interface NavItem {
  to: string;
  label: string;
  icon: keyof typeof Icon;
  exact?: boolean;
  badge?: boolean;
  exclude?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: '대시보드', icon: 'Home', exact: true },
  { to: '/admin/campaigns/new', label: '새 발송', icon: 'Plus' },
  { to: '/admin/campaigns', label: '발송 이력', icon: 'History', exclude: '/admin/campaigns/new' },
  { to: '/admin/checks', label: '확인 필요', icon: 'Bell', badge: true },
  { to: '/admin/scheduled', label: '예약 발송', icon: 'Calendar' },
  { to: '/admin/settings', label: '설정', icon: 'Settings' },
];

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const profile = useAuthStore((s) => s.adminProfile);
  const location = useLocation();
  const clearAdmin = useAuthStore((s) => s.clearAdmin);

  const { data: checkData } = useQuery({
    queryKey: ['check-items', 'topbar'],
    queryFn: () => notificationApi.checkItems({ status: 'OPEN', pageSize: 1 }),
    refetchInterval: 60_000,
  });
  const openCount = checkData?.openCount ?? 0;

  return (
    <aside className="flex h-full w-[244px] shrink-0 flex-col bg-[var(--color-sidebar-bg)] text-[var(--color-sidebar-text)]">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-[var(--color-sidebar-divider)] px-5 py-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-mint-500 text-[13px] font-bold text-white">
          PS
        </div>
        <div className="leading-tight">
          <div className="text-[14px] font-bold tracking-tight text-[var(--color-sidebar-text-strong)]">
            PayLinker
          </div>
          <div className="mt-0.5 text-[10.5px] text-[var(--color-sidebar-text-muted)]">
            보안 명세서 발송
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-3 px-2 text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--color-sidebar-text-muted)]">
          Workspace
        </div>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to) &&
                (!item.exclude || !location.pathname.startsWith(item.exclude));
            const Ico = Icon[item.icon];
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={!!item.exact}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition',
                    isActive
                      ? 'bg-mint-500 text-white'
                      : 'text-[var(--color-sidebar-text)] hover:bg-white/[0.05] hover:text-[var(--color-sidebar-text-strong)]',
                  )}
                >
                  <Ico size={16} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && openCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warn-500 px-1.5 text-[10px] font-bold leading-none text-white num">
                      {openCount > 99 ? '99+' : openCount}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User profile */}
      <div className="border-t border-[var(--color-sidebar-divider)] px-4 py-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-mint-500/20 text-[12px] font-bold text-mint-300">
            {profile?.name?.slice(0, 1) ?? 'A'}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[12.5px] font-medium text-[var(--color-sidebar-text-strong)]">
              {profile?.name ?? '운영자'}
            </div>
            <div className="mt-0.5 truncate text-[10.5px] text-[var(--color-sidebar-text-muted)]">
              {profile?.email ?? 'admin@paylinker.io'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearAdmin();
              window.location.href = USE_COGNITO ? cognitoLogoutUrl() : '/login';
            }}
            className="text-[var(--color-sidebar-text-muted)] transition hover:text-[var(--color-sidebar-text-strong)]"
            aria-label="로그아웃"
            title="로그아웃"
          >
            <Icon.Logout size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
