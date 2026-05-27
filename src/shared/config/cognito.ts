import type { AuthProviderProps } from 'react-oidc-context';
import { WebStorageStateStore } from 'oidc-client-ts';
import type { AdminProfile } from '../stores/auth.store';

export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true';

/** mock 모드일 때는 Cognito 흐름 자체를 켜지 않음. */
export const USE_COGNITO = !USE_MOCK;

export const cognitoConfig: AuthProviderProps = {
  authority: import.meta.env.VITE_COGNITO_AUTHORITY ?? '',
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID ?? '',
  redirect_uri:
    import.meta.env.VITE_COGNITO_REDIRECT_URI ?? `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri:
    import.meta.env.VITE_COGNITO_POST_LOGOUT_URI ?? `${window.location.origin}/login`,
  response_type: 'code',
  scope: 'openid email profile',
  // refresh 토큰 자동 갱신 (silent renew)
  automaticSilentRenew: true,
  // 로컬스토리지에 토큰 보관 (zustand persist 와 분리)
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  onSigninCallback: () => {
    // Strip code/state from URL after successful redirect callback
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

/**
 * Cognito Hosted UI 의 logout endpoint URL.
 * 단순 토큰 폐기로는 Hosted UI 의 SSO 쿠키가 안 지워지므로 직접 리다이렉트해야 함.
 */
export function cognitoLogoutUrl() {
  const domain = import.meta.env.VITE_COGNITO_DOMAIN;
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  const logoutUri =
    import.meta.env.VITE_COGNITO_POST_LOGOUT_URI ?? `${window.location.origin}/login`;
  if (!domain || !clientId) return logoutUri;
  const params = new URLSearchParams({
    client_id: clientId,
    logout_uri: logoutUri,
  });
  return `${domain}/logout?${params.toString()}`;
}

/**
 * Cognito User profile → AdminProfile 매핑.
 * BE 의 UserService.java 가 sub/email/name/custom:createdAt 을 그대로 읽으므로 동일하게.
 */
export function toAdminProfile(claims: Record<string, unknown>): AdminProfile {
  return {
    adminId: String(claims.sub ?? ''),
    email: String(claims.email ?? ''),
    name: String(claims.name ?? claims['cognito:username'] ?? ''),
    role: 'ADMIN',
    createdAt:
      typeof claims['custom:createdAt'] === 'string'
        ? (claims['custom:createdAt'] as string)
        : undefined,
  };
}
