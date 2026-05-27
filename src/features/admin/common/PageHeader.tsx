import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../../shared/ui';
import { cn } from '../../../shared/lib/cn';

export interface Breadcrumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  apiBadges?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  apiBadges,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-8 flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="mb-2 flex items-center gap-1.5 text-[12px] text-ink-4">
            {breadcrumbs.map((bc, idx) => (
              <span key={`${bc.label}-${idx}`} className="inline-flex items-center gap-1.5">
                {bc.to ? (
                  <Link to={bc.to} className="hover:text-ink-1">
                    {bc.label}
                  </Link>
                ) : (
                  <span>{bc.label}</span>
                )}
                {idx < breadcrumbs.length - 1 ? (
                  <Icon.ChevronRight size={12} className="text-ink-5" />
                ) : null}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-ink-1">{title}</h1>
        {description ? (
          <p className="mt-2 text-[13.5px] text-ink-4">{description}</p>
        ) : null}
        {apiBadges ? <div className="mt-3 flex flex-wrap items-center gap-1.5">{apiBadges}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}
