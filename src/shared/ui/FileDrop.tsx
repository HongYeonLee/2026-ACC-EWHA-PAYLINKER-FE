import { useId, useState, type DragEvent, type ChangeEvent } from 'react';
import { cn } from '../lib/cn';
import { Icon } from './Icon';

interface FileDropProps {
  accept?: string;
  onFile: (file: File) => void;
  hint?: string;
  className?: string;
  disabled?: boolean;
}

export function FileDrop({ accept, onFile, hint, className, disabled }: FileDropProps) {
  const [hover, setHover] = useState(false);
  const id = useId();

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setHover(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  }

  return (
    <label
      htmlFor={id}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-14 transition',
        disabled
          ? 'cursor-not-allowed border-border bg-surface-sunken text-ink-5'
          : hover
            ? 'cursor-pointer border-mint-500 bg-mint-50 text-mint-700'
            : 'cursor-pointer border-border-strong bg-white text-ink-3 hover:border-mint-500 hover:bg-mint-50/40',
        className,
      )}
    >
      <Icon.Upload size={26} />
      <div className="text-[13.5px] font-medium">
        파일을 여기로 끌어다 놓거나{' '}
        <span className="text-mint-700 underline-offset-2 hover:underline">파일 선택</span>
      </div>
      {hint ? <p className="text-[12px] text-ink-4">{hint}</p> : null}
      <input
        id={id}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />
    </label>
  );
}
