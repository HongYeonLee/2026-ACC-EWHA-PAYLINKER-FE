import { useEffect } from 'react';
import { cn } from '../lib/cn';
import { useToastStore, type Toast } from './toast-store';

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  useEffect(() => {
    const t = window.setTimeout(() => dismiss(toast.id), 4_500);
    return () => window.clearTimeout(t);
  }, [dismiss, toast.id]);

  const tone =
    toast.tone === 'success'
      ? 'bg-[var(--color-success-bg)] border-[var(--color-success-border)] text-[var(--color-success-text)]'
      : toast.tone === 'danger'
        ? 'bg-[var(--color-danger-bg)] border-[var(--color-danger-border)] text-[var(--color-danger-text)]'
        : toast.tone === 'warn'
          ? 'bg-[var(--color-warn-bg)] border-[var(--color-warn-border)] text-[var(--color-warn-text)]'
          : 'bg-[var(--color-neutral-bg)] border-[var(--color-neutral-border)] text-[var(--color-neutral-text)]';

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex w-[320px] items-start gap-3 rounded-lg border px-4 py-3 shadow-lg shadow-navy-900/5',
        tone,
      )}
    >
      <div className="flex-1">
        <div className="text-[13px] font-medium leading-snug">{toast.title}</div>
        {toast.description ? (
          <div className="mt-1 text-[12px] leading-relaxed text-ink-3">{toast.description}</div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="text-ink-4 transition hover:text-ink-1"
        aria-label="닫기"
      >
        ×
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] mx-auto flex w-fit max-w-[90vw] flex-col items-end gap-2 sm:right-6 sm:bottom-6 sm:left-auto sm:mx-0">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
