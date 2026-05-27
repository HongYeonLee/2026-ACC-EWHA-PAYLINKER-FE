import { cn } from '../lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block animate-pulse rounded-md bg-surface-sunken', className)}
    />
  );
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
