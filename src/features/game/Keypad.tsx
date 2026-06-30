import { cn } from '@/lib/cn';

const QUICK_LEFT = [26, 41, 45, 59];
const QUICK_RIGHT = [60, 81, 99, 100];
const QUICK_BOTTOM = [140, 180];

/**
 * Numeric keypad. The buffer is interpreted as the SCORE thrown:
 *  - ✓ / VALIDATE / quick scores deduct it from the remaining.
 * (Tapping the central remaining score instead treats the buffer as the
 *  remaining — see ScoreBoard / GameScreen.)
 */
export function Keypad({
  buffer,
  remainingBefore,
  onDigit,
  onBackspace,
  onCommit,
  onQuickScore,
  onBust,
  disabled,
}: {
  buffer: string;
  remainingBefore: number;
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onCommit: () => void;
  onQuickScore: (gross: number) => void;
  onBust: () => void;
  disabled?: boolean;
}) {
  const hasInput = buffer !== '';
  const canBust = remainingBefore <= 180;

  const Key = ({
    label,
    onClick,
    className,
  }: {
    label: React.ReactNode;
    onClick: () => void;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center rounded-xl bg-[var(--color-surface-2)] text-2xl font-bold transition-all active:scale-95 active:bg-[var(--color-surface-3)] disabled:opacity-40',
        className,
      )}
    >
      {label}
    </button>
  );

  const Quick = ({ value }: { value: number }) => (
    <button
      onClick={() => onQuickScore(value)}
      disabled={disabled}
      className="rounded-lg bg-[var(--color-surface)] py-2 text-lg font-bold text-[var(--color-text-dim)] transition-all active:scale-95 hover:text-[var(--color-text)] disabled:opacity-40"
    >
      {value}
    </button>
  );

  return (
    <div className="select-none px-2 pb-2 pt-2">
      {/* keypad input preview */}
      <div className="mb-1.5 flex h-9 items-center justify-center rounded-lg bg-[var(--color-surface)] px-3">
        {hasInput ? (
          <span className="text-2xl font-black tnum tracking-wider">
            {buffer}
          </span>
        ) : (
          <span className="text-sm text-[var(--color-text-mute)]">
            Type a score
          </span>
        )}
      </div>

      <div className="flex gap-1.5">
        {/* left quick column */}
        <div className="flex w-12 flex-col gap-1.5 sm:w-16">
          {QUICK_LEFT.map((v) => (
            <Quick key={v} value={v} />
          ))}
        </div>

        {/* numpad */}
        <div className="grid flex-1 grid-cols-3 gap-1.5">
          {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((d) => (
            <Key
              key={d}
              label={d}
              onClick={() => onDigit(d)}
              className="h-12 sm:h-14"
            />
          ))}
          <Key label="0" onClick={() => onDigit('0')} className="h-12 sm:h-14" />
          <Key
            label="⌫"
            onClick={onBackspace}
            className="h-12 text-[var(--color-text-dim)] sm:h-14"
          />
          <Key
            label="✓"
            onClick={onCommit}
            className="h-12 bg-[var(--color-accent)] text-white active:bg-[var(--color-accent-hover)] sm:h-14"
          />
        </div>

        {/* right quick column */}
        <div className="flex w-12 flex-col gap-1.5 sm:w-16">
          {QUICK_RIGHT.map((v) => (
            <Quick key={v} value={v} />
          ))}
        </div>
      </div>

      {/* bottom row: quick big scores + BUST */}
      <div className="mt-1.5 flex gap-1.5">
        {QUICK_BOTTOM.map((v) => (
          <button
            key={v}
            onClick={() => onQuickScore(v)}
            disabled={disabled}
            className="flex-1 rounded-xl bg-[var(--color-surface-2)] py-2.5 text-xl font-black transition-all active:scale-95 disabled:opacity-40"
          >
            {v}
          </button>
        ))}
        {canBust && (
          <button
            onClick={onBust}
            disabled={disabled}
            className="flex-[1.2] rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] py-2.5 text-xl font-black text-[var(--color-accent-hover)] transition-all active:scale-95 disabled:opacity-40"
          >
            BUST
          </button>
        )}
      </div>

      {/* validate (buffer = score thrown) */}
      <button
        onClick={onCommit}
        disabled={disabled || !hasInput}
        className="mt-1.5 w-full rounded-2xl bg-white py-3.5 text-2xl font-black text-black transition-all active:scale-[0.99] disabled:opacity-30"
      >
        VALIDATE
      </button>
    </div>
  );
}
