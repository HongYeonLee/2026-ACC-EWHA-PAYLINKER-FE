import { Icon } from './Icon';
import { cn } from '../lib/cn';

export function Pagination({
  page,
  totalPages,
  onChange,
  className,
}: {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i += 1) pages.push(i);

  return (
    <nav
      aria-label="페이지 이동"
      className={cn('flex items-center justify-center gap-2 py-3', className)}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="이전"
        className="inline-flex size-9 items-center justify-center rounded-md border border-border-strong text-ink-3 transition disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-surface-sunken"
      >
        <Icon.ChevronLeft size={16} />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-md text-[12.5px] font-medium transition',
            p === page
              ? 'bg-navy-800 text-white'
              : 'border border-border-strong text-ink-3 hover:bg-surface-sunken',
          )}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="다음"
        className="inline-flex size-9 items-center justify-center rounded-md border border-border-strong text-ink-3 transition disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-surface-sunken"
      >
        <Icon.ChevronRight size={16} />
      </button>
    </nav>
  );
}
