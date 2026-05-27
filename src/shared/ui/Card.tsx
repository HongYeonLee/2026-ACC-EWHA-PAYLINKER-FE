import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-xl border border-border bg-white shadow-sm shadow-navy-900/[0.03]',
        className,
      )}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  actions,
  apiBadge,
  className,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  apiBadge?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-border px-6 py-6',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {title ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-bold text-ink-1 tracking-tight">{title}</span>
            {apiBadge}
          </div>
        ) : null}
        {subtitle ? <div className="mt-1 text-[12.5px] text-ink-4">{subtitle}</div> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('px-6 py-6', className)} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn('flex items-center justify-end gap-2.5 border-t border-border px-6 py-5', className)}
    />
  );
}
