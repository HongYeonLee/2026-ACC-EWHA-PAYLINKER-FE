import { useAuthStore } from '../stores/auth.store';

export type ApiSuccess<T> = {
  success: true;
  code: string;
  message: string;
  data: T;
};

export type ApiFailure = {
  success: false;
  code: string;
  message: string;
  data: null;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  code: string;
  status: number;
  payload?: unknown;

  constructor(code: string, message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.payload = payload;
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | null | undefined>;
  auth?: 'admin' | 'recipient' | 'none';
  /** signal for cancellation */
  signal?: AbortSignal;
  /** 401 수신 시 세션을 자동 클리어하지 않음 (초기 프로필 동기화 등 non-fatal 호출에 사용) */
  skipLogoutOn401?: boolean;
};

function buildUrl(path: string, query?: RequestOptions['query']) {
  const normalised = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${BASE_URL}${normalised}`, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }
  // If BASE_URL is absolute, preserve it
  if (BASE_URL.startsWith('http')) {
    const base = new URL(BASE_URL);
    url.protocol = base.protocol;
    url.host = base.host;
  }
  return url.toString();
}

function pickAuthHeader(auth: RequestOptions['auth']) {
  if (auth === 'none') return undefined;
  const state = useAuthStore.getState();
  if (auth === 'recipient') {
    const t = state.linkSessionToken;
    if (!t) return undefined;
    // BE generates tokens with ls_ prefix already; guard for safety.
    return `Bearer ${t.startsWith('ls_') ? t : `ls_${t}`}`;
  }
  // Default: admin
  return state.adminToken ? `Bearer ${state.adminToken}` : undefined;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, auth = 'admin', headers, body, skipLogoutOn401, ...rest } = options;
  const url = buildUrl(path, query);

  const finalHeaders = new Headers(headers);
  if (body && !(body instanceof FormData)) {
    finalHeaders.set('Content-Type', 'application/json');
  }
  finalHeaders.set('Accept', 'application/json');
  const authHeader = pickAuthHeader(auth);
  if (authHeader) finalHeaders.set('Authorization', authHeader);

  let response: Response;
  try {
    response = await fetch(url, { ...rest, headers: finalHeaders, body });
  } catch (err) {
    throw new ApiError('NETWORK_ERROR', '네트워크에 연결할 수 없습니다.', 0, err);
  }

  let payload: ApiResponse<T> | null = null;
  if (response.status !== 204) {
    try {
      payload = (await response.json()) as ApiResponse<T>;
    } catch {
      // not json — treat as failure
    }
  }

  if (!response.ok || (payload && payload.success === false)) {
    const code = payload?.code ?? `HTTP_${response.status}`;
    const message = payload?.message ?? `요청 처리에 실패했습니다. (${response.status})`;
    if (response.status === 401 && auth !== 'none' && !skipLogoutOn401) {
      const state = useAuthStore.getState();
      if (auth === 'recipient') state.clearLinkSession();
      else state.clearAdmin();
    }
    throw new ApiError(code, message, response.status, payload);
  }

  return (payload?.data ?? (undefined as unknown as T)) as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
