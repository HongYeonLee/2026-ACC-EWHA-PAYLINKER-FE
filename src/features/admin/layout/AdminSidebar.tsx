import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from '../../../shared/ui';
import { cn } from '../../../shared/lib/cn';
import { useAuthStore } from '../../../shared/stores/auth.store';
import { USE_COGNITO, cognitoLogoutUrl } from '../../../shared/config/cognito';

interface NavItem {
  to: string;
  label: string;
  icon: keyof typeof Icon;
  match?: string[];
}

const NAV_SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: '발송 관리',
    items: [
      { to: '/admin', label: '대시보드', icon: 'Dashboard' },
      { to: '/admin/campaigns', label: '발송 이력', icon: 'History' },
      { to: '/admin/campaigns/new', label: '새 발송', icon: 'Send' },
      { to: '/admin/scheduled', label: '예약 발송', icon: 'Calendar' },
    ],
  },
  {
    title: '확인 & 알림',
    items: [
      { to: '/admin/checks', label: '확인 필요', icon: 'Alert' },
      { to: '/admin/resend-requests', label: '재전송 요청', icon: 'Inbox' },
    ],
  },
  {
    title: '설정',
    items: [{ to: '/admin/settings', label: '설정', icon: 'Settings' }],
  },
];

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const profile = useAuthStore((s) => s.adminProfile);
  const location = useLocation();
  const clearAdmin = useAuthStore((s) => s.clearAdmin);

  return (
    <aside className="flex h-full w-[244px] shrink-0 flex-col bg-[var(--color-sidebar-bg)] text-[var(--color-sidebar-text)]">
      <div className="flex items-center gap-3 border-b border-[var(--color-sidebar-divider)] px-5 py-6">
        <div className="flex size-10 items-center justify-center rounded-lg bg-mint-500/15 text-mint-300">
          <Icon.Logo size={22} />
        </div>
        <div className="leading-tight">
          <div className="text-[14px] font-bold tracking-tight text-[var(--color-sidebar-text-strong)]">
            PayLinker
          </div>
          <div className="mt-0.5 font-mono text-[10px] tracking-[0.18em] text-[var(--color-sidebar-text-muted)] uppercase">
            Admin Console
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-6">
            <div className="px-3 pb-2.5 text-[10px] font-medium tracking-[0.18em] uppercase text-[var(--color-sidebar-text-muted)]">
              {section.title}
            </div>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  item.to === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.to);
                const Ico = Icon[item.icon];
                return (
                  <li key={item.to} className="relative">
                    {isActive && (
                      <span className="pointer-events-none absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-mint-400" />
                    )}
                    <NavLink
                      to={item.to}
                      end={item.to === '/admin'}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition',
                        isActive
                          ? 'bg-mint-500/20 font-medium text-mint-300'
                          : 'text-[var(--color-sidebar-text)] hover:bg-white/[0.04] hover:text-[var(--color-sidebar-text-strong)]',
                      )}
                    >
                      <Ico size={16} />
                      <span className="flex-1">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--color-sidebar-divider)] px-3 py-4">
        <div className="flex items-center gap-3 rounded-md px-3 py-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-mint-500/20 text-[12px] font-bold text-mint-300">
            {profile?.name?.slice(0, 1) ?? 'A'}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[12.5px] font-medium text-[var(--color-sidebar-text-strong)]">
              {profile?.name ?? '운영자'}
            </div>
            <div className="mt-0.5 truncate font-mono text-[10px] text-[var(--color-sidebar-text-muted)]">
              {profile?.email ?? 'admin@paylinker.io'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearAdmin();
              // Cognito 모드에서는 Hosted UI 의 SSO 쿠키까지 정리하기 위해 logout endpoint 로 리다이렉트.
              // mock 모드에서는 그냥 로컬 라우터로 /login.
              window.location.href = USE_COGNITO ? cognitoLogoutUrl() : '/login';
            }}
            className="text-[var(--color-sidebar-text-muted)] transition hover:text-[var(--color-sidebar-text-strong)]"
            aria-label="로그아웃"
            title="로그아웃"
          >
            <Icon.Logout size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}
