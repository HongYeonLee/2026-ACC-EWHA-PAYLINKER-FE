import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { authApi } from './api';
import { useAuthStore } from '../../shared/stores/auth.store';
import { ApiError } from '../../shared/api/client';
import { USE_COGNITO } from '../../shared/config/cognito';
import { ApiBadge, Button, Field, Icon, Input, toast } from '../../shared/ui';

const DEMO_ACCOUNTS = [
  { label: '운영 매니저', email: 'admin@paylinker.io' },
  { label: '인사팀 담당', email: 'hr.kim@paylinker.io' },
];

export function LoginPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-bg-2 lg:grid-cols-[1fr_1.05fr]">
      <BrandPanel />
      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <MobileLogo />
          {USE_COGNITO ? <CognitoLoginPanel /> : <MockLoginPanel />}
        </div>
      </main>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="hidden flex-col justify-between bg-navy-900 px-12 py-12 text-navy-100 lg:flex">
      <div className="flex items-center gap-3 text-mint-300">
        <div className="flex size-10 items-center justify-center rounded-lg bg-mint-500/15">
          <Icon.Logo size={20} />
        </div>
        <div>
          <div className="text-[15px] font-bold tracking-tight text-white">PayLinker</div>
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-navy-300">
            Admin Console
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-white">
          보안 명세서 발송을
          <br />한 곳에서 통제하세요.
        </h1>
        <p className="max-w-md text-[13.5px] leading-relaxed text-navy-200">
          급여명세서, 인센티브 정산서, 비밀 사내 문서까지. 발송 → 열람 → 만료까지의 모든 흐름이 운영자
          한 명의 시야 안에서 안전하게 흐릅니다.
        </p>

        <div className="grid grid-cols-3 gap-3 pt-4">
          {[
            { label: '평균 열람률', value: '94%' },
            { label: '실패 자동 검출', value: '5종' },
            { label: '링크 TTL', value: '48h' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3">
              <div className="font-mono text-[22px] font-medium leading-none text-mint-300">
                {stat.value}
              </div>
              <div className="mt-1.5 text-[10.5px] uppercase tracking-[0.16em] text-navy-300">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[11px] text-navy-400">
        © 2026 PayLinker · Frontend prototype build
      </div>
    </aside>
  );
}

function MobileLogo() {
  return (
    <div className="mb-8 flex items-center gap-2 lg:hidden">
      <div className="flex size-9 items-center justify-center rounded-lg bg-navy-900 text-mint-300">
        <Icon.Logo size={18} />
      </div>
      <div>
        <div className="text-[14px] font-bold text-ink-1">PayLinker</div>
        <div className="font-mono text-[10px] tracking-[0.18em] text-ink-4 uppercase">
          Admin Console
        </div>
      </div>
    </div>
  );
}

function CognitoLoginPanel() {
  const auth = useAuth();

  return (
    <>
      <h2 className="text-[22px] font-bold tracking-tight text-ink-1">로그인</h2>
      <p className="mt-2 text-[13px] text-ink-4">
        AWS Cognito 로 인증합니다. 운영자 계정으로 로그인해 주세요.
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <ApiBadge method="GET" path="/oauth2/authorize" auth="public" note="Cognito Hosted UI" />
        <ApiBadge method="GET" path="/api/users/me" note="USR-001 (로그인 직후)" />
      </div>

      <div className="mt-9">
        <Button
          type="button"
          size="lg"
          className="w-full"
          loading={auth.isLoading || auth.activeNavigator === 'signinRedirect'}
          onClick={() => auth.signinRedirect()}
          iconLeft={<Icon.Lock size={16} />}
        >
          Cognito 로 로그인
        </Button>
        {auth.error ? (
          <div className="mt-3 rounded-md border border-danger-100 bg-danger-50 px-3.5 py-2.5 text-[12px] text-danger-600">
            {auth.error.message}
          </div>
        ) : null}
      </div>

      <p className="mt-6 text-center text-[11.5px] text-ink-4">
        수신자라면? 이메일 안내의 보안 링크로 접속해 주세요.{' '}
        <Link to="/link/demo-valid" className="text-mint-700 hover:underline">
          데모 보기
        </Link>
      </p>
    </>
  );
}

function MockLoginPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAdminSession = useAuthStore((s) => s.setAdminSession);
  const [email, setEmail] = useState('admin@paylinker.io');
  const [password, setPassword] = useState('paylinker!1');
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: authApi.adminLogin,
    onSuccess: ({ token, admin }) => {
      setAdminSession(token, admin);
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/admin';
      toast.success('로그인되었습니다', `${admin.name}님, 환영합니다.`);
      navigate(from, { replace: true });
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiError ? error.message : '로그인에 실패했습니다.';
      toast.error('로그인 실패', message);
    },
  });

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password) {
      toast.warn('입력 확인', '이메일과 비밀번호를 입력해 주세요.');
      return;
    }
    mutation.mutate({ email, password });
  }

  return (
    <>
      <h2 className="text-[22px] font-bold tracking-tight text-ink-1">로그인</h2>
      <p className="mt-2 text-[13px] text-ink-4">
        계정 정보를 입력해 관리자 콘솔로 이동하세요.
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <ApiBadge
          method="POST"
          path="/api/auth/admin/login"
          auth="public"
          note="MOCK 자리표시자 (실 환경은 Cognito Hosted UI)"
        />
        <ApiBadge method="GET" path="/api/users/me" note="USR-001 (로그인 직후)" />
      </div>

      <form onSubmit={handleSubmit} className="mt-9 space-y-5">
        <Field label="이메일" required>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@yourcompany.com"
            iconLeft={<Icon.Mail size={16} />}
            autoComplete="email"
            required
          />
        </Field>
        <Field label="비밀번호" required>
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력해 주세요"
            iconLeft={<Icon.Lock size={16} />}
            iconRight={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-ink-4 transition hover:text-ink-1"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <Icon.EyeOff size={16} /> : <Icon.Eye size={16} />}
              </button>
            }
            autoComplete="current-password"
            required
          />
        </Field>

        <Button type="submit" size="lg" loading={mutation.isPending} className="mt-3 w-full">
          로그인
        </Button>
      </form>

      <div className="mt-9 rounded-lg border border-dashed border-border-strong bg-surface-sunken px-5 py-4">
        <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-ink-4">
          데모 계정 (mock)
        </div>
        <ul className="mt-2 space-y-1.5">
          {DEMO_ACCOUNTS.map((acc) => (
            <li key={acc.email} className="flex items-center justify-between gap-2 text-[12px]">
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink-2">{acc.label}</span>
                <span className="num text-ink-4">{acc.email}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword('paylinker!1');
                }}
                className="rounded-md px-2 py-0.5 text-[11px] font-medium text-mint-700 transition hover:bg-mint-50"
              >
                입력
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 text-[11px] text-ink-4">
          비밀번호: <span className="num">paylinker!1</span>
        </div>
      </div>

      <p className="mt-6 text-center text-[11.5px] text-ink-4">
        수신자라면? 이메일 안내의 보안 링크로 접속해 주세요.{' '}
        <Link to="/link/demo-valid" className="text-mint-700 hover:underline">
          데모 보기
        </Link>
      </p>
    </>
  );
}
