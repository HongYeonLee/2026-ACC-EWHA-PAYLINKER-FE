import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useAuthStore } from '../../shared/stores/auth.store';
import { toAdminProfile } from '../../shared/config/cognito';
import { toast } from '../../shared/ui';

export function CallbackPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isLoading) return;
    if (auth.error) {
      // Don't auto-redirect — keep user here so they can see the error message
      return;
    }
    if (auth.isAuthenticated && auth.user) {
      const claimsProfile = toAdminProfile(auth.user.profile as Record<string, unknown>);
      useAuthStore.getState().setAdminSession(auth.user.access_token, claimsProfile);
      toast.success('로그인되었습니다', `${claimsProfile.name || claimsProfile.email} 님, 환영합니다.`);
      navigate('/admin', { replace: true });
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.user, auth.error, navigate]);

  if (auth.error) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg-2 px-4 text-center">
        <div className="max-w-md w-full space-y-3 rounded-xl border border-danger-200 bg-white p-6 text-left shadow">
          <div className="text-[13px] font-semibold text-danger-700">로그인 오류</div>
          <div className="rounded bg-danger-50 px-3 py-2 font-mono text-[11.5px] text-danger-800 break-all">
            {auth.error.message}
          </div>
          <div className="space-y-1 text-[11px] text-ink-4">
            <div>redirect_uri: <span className="font-mono">{window.location.origin}/auth/callback</span></div>
            <div>current url: <span className="font-mono break-all">{window.location.href}</span></div>
          </div>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="mt-2 w-full rounded-md bg-mint-600 py-1.5 text-[12px] font-medium text-white hover:bg-mint-700"
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

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
