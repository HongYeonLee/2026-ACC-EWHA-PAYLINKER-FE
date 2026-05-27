import { Link, useLocation, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { api, ApiError } from '../../../shared/api/client';
import { RecipientShell } from '../layout/RecipientShell';
import { ApiBadge, Button, Field, Icon, Textarea, toast } from '../../../shared/ui';
import { LINK_ERROR_LABEL } from '../../../shared/constants/status';

export function LinkErrorPage() {
  const { reason = 'UNKNOWN' } = useParams<{ reason: string }>();
  const location = useLocation();
  const token = (location.state as { token?: string } | null)?.token;
  const detail = LINK_ERROR_LABEL[reason] ?? LINK_ERROR_LABEL.UNKNOWN;
  const allowResend = ['EXPIRED', 'REUSED', 'UNKNOWN'].includes(reason);

  const [showForm, setShowForm] = useState(false);
  const [body, setBody] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/secure-links/resend-request', { token: token ?? 'unknown', reason }, {
        auth: 'none',
      }),
    onSuccess: () => {
      toast.success('재전송 요청이 접수되었습니다', '운영자 확인 후 새 링크가 발송됩니다.');
      setShowForm(false);
    },
    onError: (err: unknown) => {
      const m = err instanceof ApiError ? err.message : '요청에 실패했습니다.';
      toast.error('요청 실패', m);
    },
  });

  const tone =
    reason === 'EXPIRED'
      ? { badge: 'bg-warn-50 text-warn-600', icon: <Icon.Calendar size={22} /> }
      : reason === 'REUSED'
        ? { badge: 'bg-warn-50 text-warn-600', icon: <Icon.Refresh size={22} /> }
        : reason === 'UNAUTHORIZED'
          ? { badge: 'bg-danger-50 text-danger-600', icon: <Icon.Lock size={22} /> }
          : { badge: 'bg-danger-50 text-danger-600', icon: <Icon.Alert size={22} /> };

  return (
    <RecipientShell variant="error">
      <div className="mx-auto mt-12 max-w-md rounded-2xl border border-border bg-white px-9 py-12 text-center shadow-sm shadow-navy-900/[0.04]">
        <div
          className={`mx-auto flex size-16 items-center justify-center rounded-full ${tone.badge}`}
        >
          {tone.icon}
        </div>
        <h1 className="mt-6 text-[22px] font-bold tracking-tight text-ink-1">{detail.title}</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-3">{detail.description}</p>
        {allowResend ? (
          <div className="mt-4 flex justify-center">
            <ApiBadge
              method="POST"
              path="/api/secure-links/resend-request"
              auth="public"
              note="ERR-003 재전송 요청"
            />
          </div>
        ) : null}

        <div className="mt-8 rounded-lg border border-dashed border-border-strong bg-surface-sunken px-5 py-4 text-left text-[12px] leading-relaxed text-ink-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-4">
            문의 안내
          </div>
          <ul className="mt-2 space-y-1.5">
            <li>• 인사팀 김운영 매니저 — <span className="num">admin@paylinker.io</span></li>
            <li>• 사내 메신저: PayLinker 운영방</li>
            <li>• 본인 신원 확인 후 새 링크가 발급됩니다.</li>
          </ul>
        </div>

        {allowResend ? (
          showForm ? (
            <div className="mt-6 text-left">
              <Field label="요청 사유 (선택)">
                <Textarea
                  rows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="예: 링크가 만료되어 명세서 확인이 필요합니다."
                />
              </Field>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  취소
                </Button>
                <Button size="sm" onClick={() => mutation.mutate()} loading={mutation.isPending}>
                  요청 보내기
                </Button>
              </div>
            </div>
          ) : (
            <Button className="mt-6 w-full" onClick={() => setShowForm(true)}>
              재전송 요청하기
            </Button>
          )
        ) : null}

        <Link
          to="/login"
          className="mt-6 inline-block text-[11.5px] text-ink-4 underline-offset-2 hover:underline"
        >
          운영자 화면으로 이동
        </Link>
      </div>
    </RecipientShell>
  );
}
