import { api } from '../../shared/api/client';
import type { AdminProfile } from '../../shared/stores/auth.store';
import type { UserMeResponse } from '../../shared/api/types';

export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface AdminLoginResult {
  token: string;
  admin: AdminProfile;
}

export const authApi = {
  /**
   * Cognito Hosted UI로 이전될 자리표시자. 실제 운영 환경에선 Cognito가 토큰을 발급하고
   * 프론트는 그 토큰으로 useAuthStore.setAdminSession 을 직접 호출한다.
   */
  adminLogin: (body: AdminLoginInput) =>
    api.post<AdminLoginResult>('/auth/admin/login', body, { auth: 'none' }),
  adminLogout: () => api.post<unknown>('/auth/admin/logout', undefined),
  me: () => api.get<UserMeResponse>('/users/me'),
};
