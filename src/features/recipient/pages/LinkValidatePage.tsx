import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { RecipientShell } from '../layout/RecipientShell';
import { useAuthStore } from '../../../shared/stores/auth.store';
import { ApiBadge, Icon } from '../../../shared/ui';
import { recipientApi } from '../api';

const LNK_ERROR_CODE_MAP: Record<string, string> = {
  LNK_EXPIRED: 'EXPIRED',
  LNK_REUSED: 'REUSED',
  LNK_INVALID_LINK: 'INVALID_LINK',
  LNK_UNAUTHORIZED: 'UNAUTHORIZED',
};

export function LinkValidatePage() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const setLinkSession = useAuthStore((s) => s.setLinkSession);
  const startedRef = useRef(false);

  const mutation = useMutation({
    mutationFn: (tok: string) => recipientApi.validateLink(tok),
    onSuccess: (session) => {
      setLinkSession(session.linkSessionToken, {
        campaignRecipientId: session.campaignRecipientId,
        campaignId: session.campaignId,
        campaignName: session.campaignName,
        recipientName: session.recipientName,
        documentCount: session.documentCount,
        issuedAt: session.issuedAt,
        expiresAt: session.expiresAt,
      });
      navigate('/me/document', { replace: true });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        const reason = LNK_ERROR_CODE_MAP[error.code] ?? 'UNKNOWN';
        navigate(`/link-error/${reason}`, { replace: true, state: { token } });
      } else {
        navigate('/link-error/UNKNOWN', { replace: true });
      }
    },
  });

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (!token) {
      navigate('/link-error/INVALID_LINK', { replace: true });
      return;
    }
    mutation.mutate(token);
  }, [mutation, navigate, token]);

  return (
    <RecipientShell>
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-border bg-white px-9 py-12 text-center shadow-sm shadow-navy-900/[0.04]">
        <div className="mx-auto flex size-14 animate-pulse items-center justify-center rounded-full bg-mint-50 text-mint-700">
          <Icon.Lock size={26} />
        </div>
        <h1 className="mt-6 text-[20px] font-bold tracking-tight text-ink-1">
          보안 링크를 확인하고 있습니다
        </h1>
        <p className="mt-2.5 text-[13px] leading-relaxed text-ink-4">
          본인 명세서가 맞는지 검증 중입니다. 잠시만 기다려 주세요.
        </p>
        <div className="mt-4 flex justify-center">
          <ApiBadge
            method="POST"
            path="/api/secure-links/validate"
            auth="public"
            note="LNK-001 / RCV-001"
          />
        </div>
        <div className="mx-auto mt-8 h-1.5 w-36 overflow-hidden rounded-full bg-surface-sunken">
          <div className="h-full w-1/2 animate-[loading_1.2s_ease-in-out_infinite] bg-mint-500" />
        </div>
        <style>{`@keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`}</style>
      </div>
      <div className="mx-auto mt-8 max-w-md rounded-xl border border-dashed border-border-strong bg-white/60 px-6 py-5 text-[12px] leading-relaxed text-ink-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
          데모 토큰
        </div>
        <ul className="mt-2 space-y-1">
          <li>
            <span className="num">/link/demo-valid</span> — 정상 흐름
          </li>
          <li>
            <span className="num">/link/demo-expired</span> — 만료된 링크 안내
          </li>
          <li>
            <span className="num">/link/demo-used</span> — 이미 사용된 링크
          </li>
          <li>
            <span className="num">/link/demo-invalid</span> — 잘못된 링크
          </li>
        </ul>
      </div>
    </RecipientShell>
  );
}
