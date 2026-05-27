import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useAuthStore } from '../../shared/stores/auth.store';
import { toAdminProfile } from '../../shared/config/cognito';

/**
 * Cognito 의 사용자/토큰 변화를 zustand auth store 로 동기화.
 * - 처음 로그인 시점에는 CallbackPage 가 setAdminSession 으로 채워주지만,
 *   silent renew 로 access_token 이 갱신될 때마다 store 도 따라가야 client.ts 가 새 토큰을 씀.
 * - 토큰 만료/로그아웃 시에도 store 를 비워 client.ts 가 401 처리 후 /login 으로 보내게 함.
 */
export function CognitoBridge() {
  const auth = useAuth();

  useEffect(() => {
    if (auth.isLoading) return;
    if (auth.user && auth.isAuthenticated) {
      const profile = toAdminProfile(auth.user.profile as Record<string, unknown>);
      useAuthStore.getState().setAdminSession(auth.user.access_token, profile);
    } else if (!auth.activeNavigator) {
      // signinRedirect/signoutRedirect 진행 중이 아닌데 user 가 없으면 로그아웃 상태로 정리.
      useAuthStore.getState().clearAdmin();
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.user, auth.activeNavigator]);

  return null;
}
