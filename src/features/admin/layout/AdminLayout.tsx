import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { useAuthStore } from '../../../shared/stores/auth.store';
import { cn } from '../../../shared/lib/cn';

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const adminToken = useAuthStore((s) => s.adminToken);
  if (!adminToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="flex min-h-screen bg-bg-2">
      {/* desktop sidebar */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-navy-900/50"
            aria-hidden
            onClick={() => setMobileOpen(false)}
          />
          <div className={cn('absolute inset-y-0 left-0 z-10 flex')}>
            <AdminSidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-x-hidden px-5 py-8 md:px-8 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
