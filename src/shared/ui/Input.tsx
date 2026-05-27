import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, iconLeft, iconRight, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        'flex h-10 items-center gap-2.5 rounded-md border bg-white px-3.5 transition',
        'focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/30',
        invalid
          ? 'border-danger-500 focus-within:border-danger-500 focus-within:ring-danger-500/30'
          : 'border-border-strong',
        props.disabled ? 'bg-surface-sunken text-ink-5' : '',
        className,
      )}
    >
      {iconLeft ? <span className="text-ink-4">{iconLeft}</span> : null}
      <input
        ref={ref}
        {...props}
        className="flex-1 bg-transparent text-[13.5px] text-ink-1 outline-none placeholder:text-ink-5 disabled:cursor-not-allowed"
      />
      {iconRight ? <span className="text-ink-4">{iconRight}</span> : null}
    </div>
  );
});

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      {...props}
      className={cn(
        'block w-full rounded-md border bg-white px-3.5 py-3 text-[13.5px] leading-[1.65] text-ink-1 outline-none transition placeholder:text-ink-5',
        'focus:border-mint-500 focus:ring-2 focus:ring-mint-500/30',
        invalid
          ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/30'
          : 'border-border-strong',
        className,
      )}
    />
  );
});

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('flex flex-col gap-2', className)}>
      {label ? (
        <span className="text-[12.5px] font-medium text-ink-2">
          {label}
          {required ? <span className="ml-1 text-danger-500">*</span> : null}
        </span>
      ) : null}
      {children}
      {error ? (
        <span className="text-[11.5px] font-medium text-danger-500">{error}</span>
      ) : hint ? (
        <span className="text-[11.5px] text-ink-4">{hint}</span>
      ) : null}
    </label>
  );
}
