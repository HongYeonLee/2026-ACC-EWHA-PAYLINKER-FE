import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useAuthStore } from '../../shared/stores/auth.store';
import { toAdminProfile } from '../../shared/config/cognito';
import { toast } from '../../shared/ui';
import { authApi } from './api';

export function CallbackPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isLoading) return;
    if (auth.error) {
      toast.error('로그인 실패', auth.error.message);
      navigate('/login', { replace: true });
      return;
    }
    if (auth.isAuthenticated && auth.user) {
      const claimsProfile = toAdminProfile(auth.user.profile as Record<string, unknown>);
      useAuthStore.getState().setAdminSession(auth.user.access_token, claimsProfile);
      // Sync BE-side metadata (role, createdAt) after setting initial token
      authApi.me().then((me) => {
        useAuthStore.getState().setAdminProfile({
          adminId: me.adminId,
          email: me.email,
          name: me.name,
          role: me.role,
          createdAt: me.createdAt,
        });
      }).catch(() => {
        // Non-fatal: Cognito claims profile already set above
      });
      toast.success('로그인되었습니다', `${claimsProfile.name || claimsProfile.email} 님, 환영합니다.`);
      navigate('/admin', { replace: true });
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.user, auth.error, navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-bg-2 px-4 text-center">
      <div>
        <div className="num text-[14px] font-medium text-ink-2">로그인 처리 중…</div>
        <div className="mt-1 text-[12px] text-ink-4">
          Cognito 인증을 확인하고 있습니다. 잠시만 기다려 주세요.
        </div>
      </div>
    </div>
  );
}
