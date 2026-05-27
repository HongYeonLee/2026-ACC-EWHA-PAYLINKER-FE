import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle' | 'link';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-mint-500 text-navy-900 hover:bg-mint-400 active:bg-mint-600 disabled:bg-mint-200 disabled:text-navy-400',
  secondary:
    'bg-white text-navy-800 border border-border-strong hover:bg-surface-sunken active:bg-gray-100 disabled:text-gray-400 disabled:bg-white',
  ghost:
    'text-ink-2 hover:bg-surface-sunken active:bg-gray-100 disabled:text-gray-400',
  danger:
    'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-600 disabled:bg-danger-100 disabled:text-white',
  subtle:
    'bg-navy-800 text-mint-200 hover:bg-navy-700 active:bg-navy-600 disabled:bg-navy-700 disabled:text-navy-400',
  link: 'text-mint-700 hover:text-mint-600 underline-offset-4 hover:underline disabled:text-gray-400',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12.5px] rounded-md gap-1.5',
  md: 'h-10 px-3.5 text-[13.5px] rounded-md gap-2',
  lg: 'h-12 px-6 text-[14px] rounded-lg gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    iconLeft,
    iconRight,
    children,
    type,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium tracking-tight transition outline-none',
        'focus-visible:ring-2 focus-visible:ring-mint-500/60',
        'disabled:cursor-not-allowed',
        variant !== 'link' ? 'shadow-sm shadow-navy-900/5' : '',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden
          className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : (
        iconLeft
      )}
      {children}
      {!loading && iconRight}
    </button>
  );
});
