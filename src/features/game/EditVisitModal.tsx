import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useGame } from '@/store/GameContext';
import { MAX_VISIT_SCORE } from '@/domain/rules/bust';

export function EditVisitModal({
  eventId,
  onClose,
}: {
  eventId: string | null;
  onClose: () => void;
}) {
  const { events, editVisit, deleteEvent } = useGame();
  const event = events.find((e) => e.id === eventId) ?? null;
  const isVisit = event?.type === 'VISIT';

  const [value, setValue] = useState('');

  useEffect(() => {
    if (event?.type === 'VISIT') setValue(String(event.scored));
    else setValue('');
  }, [event]);

  if (!event) return null;

  const parsed = parseInt(value, 10);
  const valid =
    !Number.isNaN(parsed) && parsed >= 0 && parsed <= MAX_VISIT_SCORE;

  const save = () => {
    if (!valid) return;
    editVisit(event.id, parsed);
    onClose();
  };

  const remove = () => {
    deleteEvent(event.id);
    onClose();
  };

  return (
    <Modal
      open={eventId !== null}
      onClose={onClose}
      title={isVisit ? 'Edit visit' : 'Special visit'}
    >
      {isVisit ? (
        <>
          <p className="mb-2 text-sm text-[var(--color-text-dim)]">
            Visit score (0–180). Everything recalculates instantly.
          </p>
          <input
            autoFocus
            inputMode="numeric"
            value={value}
            onChange={(e) =>
              setValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))
            }
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="mb-4 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-center text-3xl font-bold tabular-nums outline-none focus:border-[var(--color-accent)]"
          />
        </>
      ) : (
        <p className="mb-4 text-[var(--color-text-dim)]">
          This entry ({event.type}) can only be deleted, not edited. Everything
          recalculates instantly.
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="danger" size="lg" fullWidth onClick={remove}>
          Delete
        </Button>
        {isVisit && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!valid}
            onClick={save}
          >
            Save
          </Button>
        )}
      </div>
    </Modal>
  );
}
