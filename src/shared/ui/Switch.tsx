import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

type Size = 'sm' | 'md';

export interface SwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'type'> {
  checked: boolean;
  onChange: (next: boolean) => void;
  size?: Size;
  label?: string;
}

const TRACK_CLASS: Record<Size, string> = {
  sm: 'h-5 w-9 p-0.5',
  md: 'h-6 w-11 p-0.5',
};

const KNOB_CLASS: Record<Size, string> = {
  sm: 'size-4',
  md: 'size-5',
};

const TRANSLATE_CLASS: Record<Size, string> = {
  sm: 'translate-x-4',
  md: 'translate-x-5',
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onChange, size = 'md', disabled, label, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center rounded-full transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-500/60 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        TRACK_CLASS[size],
        checked ? 'bg-mint-500' : 'bg-gray-300',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          'inline-block rounded-full bg-white shadow-sm transition-transform duration-150',
          KNOB_CLASS[size],
          checked ? TRANSLATE_CLASS[size] : 'translate-x-0',
        )}
      />
    </button>
  );
});
