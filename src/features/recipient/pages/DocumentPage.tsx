import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { RecipientShell } from '../layout/RecipientShell';
import { ApiBadge, ApiBadgeGroup, Badge, Button, Field, Icon, Modal, toast } from '../../../shared/ui';
import { useAuthStore } from '../../../shared/stores/auth.store';
import { formatDate, formatNumber, formatRelative } from '../../../shared/lib/format';
import { type ResendReason, RESEND_REASON_LABEL } from '../../../shared/api/types';
import { recipientApi } from '../api';

const LNK_ERROR_CODE_MAP: Record<string, string> = {
  LNK_EXPIRED: 'EXPIRED',
  LNK_REUSED: 'REUSED',
  LNK_INVALID_LINK: 'INVALID_LINK',
  LNK_UNAUTHORIZED: 'UNAUTHORIZED',
};

export function DocumentPage() {
  const linkSessionToken = useAuthStore((s) => s.linkSessionToken);
  const linkSession = useAuthStore((s) => s.linkSession);
  const clearLinkSession = useAuthStore((s) => s.clearLinkSession);
  const navigate = useNavigate();
  const [resendOpen, setResendOpen] = useState(false);
  const [resendReason, setResendReason] = useState<ResendReason>('EXPIRED');

  const { data, isLoading, error } = useQuery({
    queryKey: ['recipient-document', linkSessionToken],
    queryFn: () => recipientApi.getDocument(),
    enabled: !!linkSessionToken,
    retry: false,
  });

  const markViewed = useMutation({
    mutationFn: () => recipientApi.markViewed(),
  });

  const resendMutation = useMutation({
    mutationFn: (reason: ResendReason) =>
      recipientApi.submitResendRequest({ token: linkSessionToken!, reason }),
    onSuccess: () => {
      setResendOpen(false);
      toast.success('재전송 요청이 접수되었습니다', '운영자 확인 후 새 링크가 발송됩니다.');
    },
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : '재전송 요청에 실패했습니다.';
      toast.error('요청 실패', message);
    },
  });

  useEffect(() => {
    if (data && !data.viewedAt) {
      markViewed.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.recipientName]);

  // Auto-redirect to expired page when session token expires
  useEffect(() => {
    if (!data?.expiresAt) return;
    const msLeft = new Date(data.expiresAt).getTime() - Date.now();
    if (msLeft <= 0) {
      navigate('/link-error/EXPIRED', { replace: true });
      return;
    }
    const timer = setTimeout(() => navigate('/link-error/EXPIRED', { replace: true }), msLeft);
    return () => clearTimeout(timer);
  }, [data?.expiresAt, navigate]);

  const expiresInLabel = useMemo(() => {
    if (!data) return null;
    return formatRelative(data.expiresAt);
  }, [data]);

  if (!linkSessionToken) {
    return <Navigate to="/link-error/UNAUTHORIZED" replace />;
  }

  if (error) {
    if (error instanceof ApiError) {
      const reason = LNK_ERROR_CODE_MAP[error.code] ?? 'UNKNOWN';
      return <Navigate to={`/link-error/${reason}`} replace />;
    }
    return <Navigate to="/link-error/UNKNOWN" replace />;
  }

  return (
    <RecipientShell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11.5px] font-mono uppercase tracking-[0.18em] text-ink-4">
            본인 명세서 확인
          </div>
          <h1 className="mt-1 text-[20px] font-bold tracking-tight text-ink-1">
            {data?.campaignName ?? linkSession?.campaignName ?? '명세서'}
          </h1>
          <p className="mt-1 text-[12.5px] text-ink-4">
            수신자: <span className="font-medium text-ink-2">{data?.recipientName ?? '확인 중'}</span>
          </p>
          <ApiBadgeGroup className="mt-3">
            <ApiBadge method="GET" path="/api/documents/me" auth="recipient" note="DOC-101" />
            <ApiBadge
              method="POST"
              path="/api/documents/me/viewed"
              auth="recipient"
              note="DOC-102 열람 완료"
            />
            <ApiBadge
              method="POST"
              path="/api/secure-links/resend-request"
              auth="recipient"
              note="ERR-003 재전송"
            />
          </ApiBadgeGroup>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge tone="success" dot>
            정상 링크
          </Badge>
          <div className="font-mono text-[11px] text-ink-4">
            만료까지 {expiresInLabel ?? '-'} ({formatDate(data?.expiresAt)})
          </div>
        </div>
      </div>

      <article className="rounded-2xl border border-border bg-white shadow-sm shadow-navy-900/[0.04]">
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4 sm:px-7">
          <div className="flex items-center gap-2.5 text-[12.5px] text-ink-3">
            <Icon.File size={16} />
            <span>{data?.documents[0]?.filename ?? 'paystub.pdf'}</span>
            {data?.documents[0]?.fileSizeBytes ? (
              <span className="num text-ink-4">
                · {formatNumber(Math.round(data.documents[0].fileSizeBytes / 1024))} KB
              </span>
            ) : null}
          </div>
          <div className="text-[11.5px] text-ink-4">
            발송: {formatDate(linkSession?.issuedAt)}
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-72 items-center justify-center text-[12.5px] text-ink-4">
            본인 명세서를 불러오는 중입니다…
          </div>
        ) : (
          <div className="px-5 py-7 sm:px-10 sm:py-12 space-y-6">
            {data?.documents.map((doc) => (
              <div key={doc.documentId}>
                {doc.downloadUrl ? (
                  <div className="mb-3 flex justify-end">
                    <a
                      href={doc.downloadUrl}
                      download={doc.filename}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-white px-3 py-1.5 text-[12px] font-medium text-ink-2 transition hover:bg-surface-sunken"
                    >
                      <Icon.File size={13} />
                      다운로드
                    </a>
                  </div>
                ) : null}
                {doc.documentType === 'PDF' ? (
                  doc.downloadUrl ? (
                    <iframe
                      src={doc.downloadUrl}
                      title={doc.filename}
                      className="h-[70vh] w-full rounded-lg border border-border"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-[12.5px] text-ink-4">
                      PDF 미리보기를 불러올 수 없습니다.
                    </div>
                  )
                ) : doc.documentType === 'JSON' ? (
                  <JsonDocumentView content={doc.inlineHtml ?? ''} />
                ) : (
                  <div
                    className="prose max-w-none rounded-lg border border-border bg-bg-2 px-5 py-7 sm:px-10 sm:py-9"
                    dangerouslySetInnerHTML={{ __html: doc.inlineHtml ?? '' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4 sm:px-7">
          <div className="text-[11.5px] text-ink-4">
            <Icon.Info size={12} className="-mt-0.5 inline" /> 본인 외에는 열람할 수 없으며, 본 페이지를 닫으면 다시 동일 링크로 접근하지 못할 수 있습니다.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {data?.allowResendRequest ? (
              <Button variant="secondary" size="sm" onClick={() => setResendOpen(true)}>
                재전송 요청
              </Button>
            ) : null}
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                clearLinkSession();
                navigate('/closed', { replace: true });
              }}
            >
              확인 완료
            </Button>
          </div>
        </div>
      </article>

      <Modal
        open={resendOpen}
        onClose={() => setResendOpen(false)}
        title="재전송 요청"
        description="새 링크가 필요한 사유를 적어주시면 운영자 확인 후 다시 발송됩니다."
        footer={
          <>
            <Button variant="ghost" onClick={() => setResendOpen(false)}>
              취소
            </Button>
            <Button
              onClick={() => resendMutation.mutate(resendReason)}
              loading={resendMutation.isPending}
            >
              요청 보내기
            </Button>
          </>
        }
      >
        <Field label="요청 사유" hint="해당하는 사유를 선택해 주세요.">
          <select
            value={resendReason}
            onChange={(e) => setResendReason(e.target.value as ResendReason)}
            className="h-10 w-full rounded-md border border-border-strong bg-white px-3.5 text-[13.5px] text-ink-1 outline-none transition focus:border-mint-500 focus:ring-2 focus:ring-mint-500/30"
          >
            {(Object.keys(RESEND_REASON_LABEL) as ResendReason[]).map((key) => (
              <option key={key} value={key}>
                {RESEND_REASON_LABEL[key]}
              </option>
            ))}
          </select>
        </Field>
      </Modal>
    </RecipientShell>
  );
}

function JsonDocumentView({ content }: { content: string }) {
  let entries: Array<[string, string]> = [];
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') {
      entries = Object.entries(parsed).map(([k, v]) => [k, String(v)]);
    }
  } catch {
    return (
      <div className="rounded-lg border border-border bg-bg-2 px-5 py-7 text-[12.5px] text-ink-4">
        {content}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-bg-2 overflow-hidden">
      <table className="w-full text-[12.5px]">
        <tbody className="divide-y divide-border">
          {entries.map(([k, v]) => (
            <tr key={k}>
              <td className="w-2/5 px-4 py-2.5 font-medium text-ink-3 bg-surface-sunken">{k}</td>
              <td className="px-4 py-2.5 text-ink-1">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ViewClosedPage() {
  return (
    <RecipientShell>
      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border bg-white px-8 py-12 text-center shadow-sm shadow-navy-900/[0.04]">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-mint-50 text-mint-700">
          <Icon.Check size={22} />
        </div>
        <h1 className="mt-5 text-[18px] font-bold tracking-tight text-ink-1">
          명세서 확인이 완료되었습니다
        </h1>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-4">
          본인의 명세서를 정상적으로 확인하셨습니다. 이 페이지는 안전하게 닫으셔도 됩니다.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block text-[12px] font-medium text-mint-700 underline-offset-2 hover:underline"
        >
          운영자라면 로그인 화면으로 이동
        </Link>
      </div>
    </RecipientShell>
  );
}
