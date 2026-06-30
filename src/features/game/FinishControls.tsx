import { cn } from '@/lib/cn';
import { useLongPress } from '@/hooks/useLongPress';

/** A button that only triggers on long-press (used to confirm a finish). */
function HoldButton({
  darts,
  disabled,
  onHold,
}: {
  darts: number;
  disabled: boolean;
  onHold: () => void;
}) {
  const handlers = useLongPress(onHold, { ms: 420, disabled });
  return (
    <button
      {...handlers}
      disabled={disabled}
      className={cn(
        'flex flex-1 flex-col items-center justify-center rounded-xl py-2 text-white transition-all active:scale-95 disabled:opacity-25',
        'bg-[var(--color-success)]',
      )}
    >
      <span className="text-xl font-black leading-none">{darts}</span>
      <span className="text-[9px] uppercase tracking-wide opacity-80">
        {darts === 1 ? 'dart' : 'darts'}
      </span>
    </button>
  );
}

/**
 * Finish controls, shown right under the remaining score when the player is on
 * a checkout. Long-press 1/2/3 to close the leg with that many darts; Miss
 * records a no-score visit (0), not a bust.
 */
export function FinishControls({
  minDarts,
  onFinishWith,
  onMiss,
  disabled,
}: {
  minDarts: number;
  onFinishWith: (darts: number) => void;
  onMiss: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="px-4 pb-1">
      <div className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--color-success)]">
        Finish — hold the darts used
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((d) => (
          <HoldButton
            key={d}
            darts={d}
            disabled={!!disabled || d < minDarts}
            onHold={() => onFinishWith(d)}
          />
        ))}
        <button
          onClick={onMiss}
          disabled={disabled}
          className="flex-1 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] py-2 text-base font-black text-[var(--color-text)] transition-all active:scale-95 disabled:opacity-40"
        >
          Miss
        </button>
      </div>
    </div>
  );
}
