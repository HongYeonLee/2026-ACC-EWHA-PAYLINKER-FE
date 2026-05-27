import { type ReactNode, type ThHTMLAttributes, type TdHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-left">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-border bg-surface-sunken text-ink-3">
      {children}
    </thead>
  );
}

export function TBody({ children, className }: { children: ReactNode; className?: string }) {
  return <tbody className={cn('divide-y divide-border', className)}>{children}</tbody>;
}

export function TR({
  children,
  className,
  onClick,
  selected,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition',
        onClick ? 'cursor-pointer hover:bg-surface-sunken' : '',
        selected ? 'bg-mint-50/60' : '',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TH({
  children,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={cn(
        'whitespace-nowrap px-4 py-3.5 text-[11.5px] font-medium tracking-[0.05em] text-ink-3',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TD({
  children,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td {...props} className={cn('px-4 py-4 text-[13px] text-ink-1 align-middle', className)}>
      {children}
    </td>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      {icon ? <div className="text-ink-4">{icon}</div> : null}
      <div className="text-[15px] font-bold text-ink-1">{title}</div>
      {description ? (
        <div className="max-w-md text-[13px] leading-relaxed text-ink-4">{description}</div>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
