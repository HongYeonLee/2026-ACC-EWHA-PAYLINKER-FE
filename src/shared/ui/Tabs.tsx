import { cn } from '../lib/cn';

export interface TabItem<V extends string = string> {
  value: V;
  label: string;
  count?: number | string;
}

export function Tabs<V extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<V>[];
  value: V;
  onChange: (next: V) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn('flex items-center gap-1 border-b border-border', className)}
    >
      {items.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            '-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-medium transition',
            value === tab.value
              ? 'border-mint-500 text-ink-1'
              : 'border-transparent text-ink-4 hover:text-ink-2',
          )}
        >
          {tab.label}
          {tab.count !== undefined ? (
            <span
              className={cn(
                'inline-flex h-[18px] items-center rounded-full px-1.5 text-[10.5px] font-medium num',
                value === tab.value
                  ? 'bg-mint-500/15 text-mint-700'
                  : 'bg-surface-sunken text-ink-4',
              )}
            >
              {tab.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function Pill<V extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<V>[];
  value: V;
  onChange: (next: V) => void;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex flex-wrap items-center gap-2', className)}>
      {items.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-medium transition',
            value === tab.value
              ? 'border-mint-500 bg-mint-50 text-mint-700'
              : 'border-border-strong text-ink-3 hover:bg-surface-sunken',
          )}
        >
          {tab.label}
          {tab.count !== undefined ? (
            <span className="num text-[11.5px] text-current/70">{tab.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
