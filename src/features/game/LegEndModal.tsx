import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { minDartsToCheckout } from '@/domain/rules/checkout';

/**
 * Shown when the entered score finishes the leg (remaining hits 0).
 * Confirms the checkout and records how many darts were used on the
 * final visit (1-3). Cancel discards the visit entirely.
 *
 * Dart counts that are physically impossible for this finish are disabled:
 * e.g. 102 can only be checked out in 3 darts, so 1 and 2 are greyed out.
 */
export function LegEndModal({
  open,
  playerName,
  legNumber,
  checkoutScore,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  playerName: string;
  legNumber: number;
  /** The score that was closed (what the player was sitting on). */
  checkoutScore: number;
  onConfirm: (darts: number) => void;
  onCancel: () => void;
}) {
  const minDarts = minDartsToCheckout(checkoutScore) ?? 1;

  return (
    <Modal open={open} onClose={onCancel} closeOnBackdrop={false}>
      <div className="text-center">
        <div className="mb-1 text-5xl">🎯</div>
        <h2 className="text-2xl font-black">Leg {legNumber} complete!</h2>
        <p className="mt-1 text-[var(--color-accent)]">
          {playerName} checked out {checkoutScore}
        </p>

        <p className="mt-5 mb-2 text-sm text-[var(--color-text-dim)]">
          How many darts were used on this final visit?
        </p>
        <div className="flex gap-2">
          {[1, 2, 3].map((d) => {
            const impossible = d < minDarts;
            return (
              <Button
                key={d}
                variant="success"
                size="xl"
                fullWidth
                disabled={impossible}
                title={
                  impossible
                    ? `${checkoutScore} cannot be checked out in ${d} dart${d > 1 ? 's' : ''}`
                    : undefined
                }
                onClick={() => onConfirm(d)}
              >
                {d}
              </Button>
            );
          })}
        </div>
        {minDarts > 1 && (
          <p className="mt-2 text-xs text-[var(--color-text-dim)]">
            {checkoutScore} needs at least {minDarts} darts to finish
          </p>
        )}

        <Button
          variant="ghost"
          size="md"
          fullWidth
          className="mt-3"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
