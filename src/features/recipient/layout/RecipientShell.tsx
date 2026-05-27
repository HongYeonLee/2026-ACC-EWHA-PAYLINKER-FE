import type { ReactNode } from 'react';
import { Icon } from '../../../shared/ui';
import { cn } from '../../../shared/lib/cn';

export function RecipientShell({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'error';
}) {
  return (
    <div
      className={cn(
        'min-h-screen w-full',
        variant === 'error' ? 'bg-bg-2' : 'bg-gradient-to-b from-bg-2 to-white',
      )}
    >
      <header className="flex items-center justify-between border-b border-border bg-white/80 px-5 py-4 backdrop-blur sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-navy-900 text-mint-300">
            <Icon.Logo size={20} />
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-bold text-ink-1">PayLinker</div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-4">
              Secure Document
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-[12px] text-ink-4 sm:flex">
          <Icon.Lock size={14} />
          <span>본인 외 열람 불가 / 일회용 링크</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-5 py-8 sm:py-14">{children}</main>
      <footer className="px-5 pb-10 text-center text-[11.5px] text-ink-4">
        © 2026 PayLinker · 본인 명세서가 아닌 경우 즉시 페이지를 닫아주세요.
      </footer>
    </div>
  );
}
