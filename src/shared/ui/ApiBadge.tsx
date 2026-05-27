import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiBadgeProps {
  method: Method;
  path: string;
  /** Optional auth role this endpoint sits behind. Defaults to admin. */
  auth?: 'admin' | 'recipient' | 'public';
  /** Optional description (function id, etc.) */
  note?: string;
  className?: string;
}

/**
 * Dev-only API endpoint indicator. Renders nothing once VITE_USE_MOCK !== 'true',
 * so real-backend deployments are unaffected.
 *
 * Use to annotate Page headers, Cards, or Forms with the endpoint that drives them
 * so the team can map UI → API at a glance during integration.
 */
export function ApiBadge({ method, path, auth = 'admin', note, className }: ApiBadgeProps) {
  if ((import.meta.env.VITE_USE_MOCK ?? 'true') !== 'true') return null;

  const methodTone: Record<Method, string> = {
    GET: 'bg-mint-50 text-mint-700 border-mint-200',
    POST: 'bg-navy-100 text-navy-700 border-navy-200',
    PUT: 'bg-warn-50 text-warn-600 border-warn-100',
    PATCH: 'bg-warn-50 text-warn-600 border-warn-100',
    DELETE: 'bg-danger-50 text-danger-600 border-danger-100',
  };
  const authTone =
    auth === 'public'
      ? 'text-gray-500'
      : auth === 'recipient'
        ? 'text-warn-600'
        : 'text-mint-700';

  return (
    <span
      title={
        note
          ? `${method} ${path} · ${auth.toUpperCase()} · ${note}`
          : `${method} ${path} · ${auth.toUpperCase()}`
      }
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-dashed border-border-strong bg-white/70 px-2 py-1 font-mono text-[10.5px] leading-none text-ink-3 align-middle',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex items-center rounded-sm border px-1 py-0.5 text-[9.5px] font-bold tracking-wider',
          methodTone[method],
        )}
      >
        {method}
      </span>
      <span className="text-ink-2">{path}</span>
      <span className={cn('text-[9.5px] uppercase tracking-[0.1em]', authTone)}>
        {auth === 'public' ? 'public' : auth === 'recipient' ? 'ls_' : 'jwt'}
      </span>
    </span>
  );
}

/**
 * Container for multiple ApiBadge entries — same dev-only behavior as a single badge.
 */
export function ApiBadgeGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  if ((import.meta.env.VITE_USE_MOCK ?? 'true') !== 'true') return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>{children}</div>
  );
}
