import {
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { cn } from '../lib/cn';

interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hideClose?: boolean;
  footer?: ReactNode;
}

const SIZE_CLASS: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  hideClose,
  footer,
  children,
  className,
  ...props
}: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, handleEscape]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        onClick={onClose}
        aria-hidden
        className="absolute inset-0 bg-[var(--color-overlay-mask)]/45 backdrop-blur-[2px]"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 flex w-full flex-col rounded-t-2xl bg-white shadow-2xl shadow-navy-900/20',
          'sm:rounded-2xl',
          SIZE_CLASS[size],
          'max-h-[90vh]',
          className,
        )}
        {...props}
      >
        {title || description || !hideClose ? (
          <div className="flex items-start justify-between gap-4 border-b border-border px-7 py-6">
            <div className="min-w-0">
              {title ? (
                <h2 className="truncate text-[16px] font-bold tracking-tight text-ink-1">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="mt-2 text-[13px] leading-relaxed text-ink-4">{description}</p>
              ) : null}
            </div>
            {hideClose ? null : (
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="text-[18px] leading-none text-ink-4 transition hover:text-ink-1"
              >
                ×
              </button>
            )}
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto px-7 py-6">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border px-7 py-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
