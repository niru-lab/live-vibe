import { Star } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface StarInputProps {
  value: number;
  onChange: (v: number) => void;
  label: string;
  size?: number;
  testId?: string;
}

/** 1–5 star input with big tap targets. */
export const StarInput = ({ value, onChange, label, size = 30, testId }: StarInputProps) => (
  <div className="flex gap-1" role="radiogroup" aria-label={label} data-testid={testId}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        role="radio"
        aria-checked={value === n}
        aria-label={`${n} von 5`}
        onClick={() => onChange(n)}
        className="rounded-md p-0.5 transition active:scale-90"
      >
        <Star
          weight={n <= value ? 'fill' : 'regular'}
          style={{ width: size, height: size }}
          className={n <= value ? 'text-amber-400' : 'text-muted-foreground/40'}
        />
      </button>
    ))}
  </div>
);

/** Read-only stars, supports halves (e.g. 4,3 → 4 full + 1 partly filled). */
export const StarDisplay = ({ value, size = 14, className }: { value: number; size?: number; className?: string }) => (
  <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} von 5 Sternen`}>
    {[1, 2, 3, 4, 5].map((n) => {
      const fill = Math.max(0, Math.min(1, value - (n - 1)));
      return (
        <span key={n} className="relative inline-block" style={{ width: size, height: size }}>
          <Star weight="fill" className="absolute inset-0 text-muted-foreground/25" style={{ width: size, height: size }} />
          <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
            <Star weight="fill" className="text-amber-400" style={{ width: size, height: size }} />
          </span>
        </span>
      );
    })}
  </span>
);
