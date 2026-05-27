import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

type Tone = 'success' | 'warn' | 'danger' | 'scheduled' | 'neutral' | 'brand';
type Size = 'xs' | 'sm';

const TONE_CLASSES: Record<Tone, string> = {
  success:
    'bg-[var(--color-success-bg)] text-[var(--color-success-text)] border-[var(--color-success-border)]',
  warn: 'bg-[var(--color-warn-bg)] text-[var(--color-warn-text)] border-[var(--color-warn-border)]',
  danger:
    'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border-[var(--color-danger-border)]',
  scheduled:
    'bg-[var(--color-scheduled-bg)] text-[var(--color-scheduled-text)] border-[var(--color-scheduled-border)]',
  neutral:
    'bg-[var(--color-neutral-bg)] text-[var(--color-neutral-text)] border-[var(--color-neutral-border)]',
  brand: 'bg-mint-50 text-mint-700 border-mint-100',
};

const DOT_CLASSES: Record<Tone, string> = {
  success: 'bg-[var(--color-success-dot)]',
  warn: 'bg-[var(--color-warn-dot)]',
  danger: 'bg-[var(--color-danger-dot)]',
  scheduled: 'bg-[var(--color-scheduled-dot)]',
  neutral: 'bg-[var(--color-neutral-dot)]',
  brand: 'bg-mint-500',
};

export function Badge({
  tone = 'neutral',
  size = 'sm',
  dot = false,
  children,
  className,
}: {
  tone?: Tone;
  size?: Size;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium tracking-tight whitespace-nowrap',
        size === 'xs' ? 'h-[22px] px-2.5 text-[11px]' : 'h-7 px-3 text-[11.5px]',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot ? <span className={cn('size-1.5 rounded-full', DOT_CLASSES[tone])} /> : null}
      {children}
    </span>
  );
}
