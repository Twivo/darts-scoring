import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { persistEncounter } from '@/store/encounterService';
import type { EncounterRecord } from '@/data/types';
import type {
  EncounterSettings,
  Fixture,
  Side,
} from '@/domain/championship/types';

/**
 * Configure the encounter at any time: edit not-yet-started matches (players,
 * order) and settings. Started/finished matches are locked. Saves immediately.
 */
export function EncounterConfig({
  encounter,
  onClose,
  onUpdated,
}: {
  encounter: EncounterRecord;
  onClose: () => void;
  onUpdated: (e: EncounterRecord) => void;
}) {
  const { teams } = encounter.plan;
  const [settings, setSettings] = useState<EncounterSettings>({
    starterSide: 'A',
    ...encounter.plan.settings,
  });
  const [fixtures, setFixtures] = useState<Fixture[]>(encounter.plan.fixtures);
  const [busy, setBusy] = useState(false);

  const editable = (f: Fixture) => f.matchId === null && f.winner === null;
  const per = (f: Fixture) => (f.kind === 'DOUBLE' ? 2 : 1);

  const setSlot = (index: number, side: 'a' | 'b', slot: number, value: string) => {
    setFixtures((prev) =>
      prev.map((f) => {
        if (f.index !== index) return f;
        const key = side === 'a' ? 'aPlayerIds' : 'bPlayerIds';
        const arr = [...f[key]];
        arr[slot] = value;
        return { ...f, [key]: arr };
      }),
    );
  };

  /** Swap the composition of two fixtures (used to reorder remaining matches). */
  const swap = (a: number, b: number) => {
    setFixtures((prev) => {
      const fa = prev.find((f) => f.index === a);
      const fb = prev.find((f) => f.index === b);
      if (!fa || !fb) return prev;
      return prev.map((f) => {
        if (f.index === a)
          return { ...f, aPlayerIds: fb.aPlayerIds, bPlayerIds: fb.bPlayerIds };
        if (f.index === b)
          return { ...f, aPlayerIds: fa.aPlayerIds, bPlayerIds: fa.bPlayerIds };
        return f;
      });
    });
  };

  const editableSameKind = (f: Fixture) =>
    fixtures.filter((x) => editable(x) && x.kind === f.kind);

  const save = async () => {
    setBusy(true);
    const updated: EncounterRecord = {
      ...encounter,
      plan: { ...encounter.plan, settings, fixtures },
    };
    await persistEncounter(updated);
    onUpdated(updated);
    onClose();
  };

  return (
    <Modal open onClose={onClose} className="max-w-2xl" title="Configure encounter">
      <div className="max-h-[78vh] overflow-y-auto pr-1">
        {/* settings */}
        <div className="mb-4 rounded-xl border border-[var(--color-border)] p-3">
          <Row label="Legs to win">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Chip
                  key={n}
                  active={settings.legsToWin === n}
                  onClick={() => setSettings((s) => ({ ...s, legsToWin: n }))}
                >
                  {n}
                </Chip>
              ))}
            </div>
          </Row>
          <Row label="Starts">
            <div className="flex gap-1">
              {(['A', 'B'] as Side[]).map((side) => (
                <Chip
                  key={side}
                  active={(settings.starterSide ?? 'A') === side}
                  onClick={() => setSettings((s) => ({ ...s, starterSide: side }))}
                >
                  {side === 'A' ? teams.A.name : teams.B.name}
                </Chip>
              ))}
            </div>
          </Row>
          <Row label="Start mode">
            <div className="flex gap-1">
              {(['BULL', 'MANUAL'] as const).map((p) => (
                <Chip
                  key={p}
                  active={settings.startingPolicy === p}
                  onClick={() => setSettings((s) => ({ ...s, startingPolicy: p }))}
                >
                  {p === 'BULL' ? 'Bull' : 'Fixed'}
                </Chip>
              ))}
              <Chip
                active={settings.alternateStarter}
                onClick={() =>
                  setSettings((s) => ({ ...s, alternateStarter: !s.alternateStarter }))
                }
              >
                Alternate
              </Chip>
            </div>
          </Row>
          <p className="mt-1 text-xs text-[var(--color-text-mute)]">
            Applies to matches not started yet.
          </p>
        </div>

        {/* fixtures */}
        <div className="flex flex-col gap-2">
          {fixtures.map((f) => {
            const locked = !editable(f);
            const group = editableSameKind(f);
            const pos = group.findIndex((x) => x.index === f.index);
            return (
              <div
                key={f.index}
                className={cn(
                  'rounded-xl border p-2.5',
                  locked
                    ? 'border-[var(--color-border)] bg-[var(--color-surface-2)] opacity-60'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]',
                )}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-accent)]">
                    {f.kind === 'DOUBLE' ? 'Double' : 'Single'} #{f.index + 1}
                    {locked && (
                      <span className="ml-2 text-[var(--color-text-mute)]">
                        🔒 {f.winner ? 'played' : 'in progress'}
                      </span>
                    )}
                  </span>
                  {!locked && group.length > 1 && (
                    <span className="flex gap-1">
                      <MiniBtn
                        disabled={pos <= 0}
                        onClick={() => swap(f.index, group[pos - 1]!.index)}
                      >
                        ▲
                      </MiniBtn>
                      <MiniBtn
                        disabled={pos >= group.length - 1}
                        onClick={() => swap(f.index, group[pos + 1]!.index)}
                      >
                        ▼
                      </MiniBtn>
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Slots
                    disabled={locked}
                    players={teams.A.players}
                    values={f.aPlayerIds}
                    count={per(f)}
                    onChange={(slot, v) => setSlot(f.index, 'a', slot, v)}
                  />
                  <Slots
                    disabled={locked}
                    players={teams.B.players}
                    values={f.bPlayerIds}
                    count={per(f)}
                    onChange={(slot, v) => setSlot(f.index, 'b', slot, v)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="ghost" size="lg" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="accent"
            size="lg"
            fullWidth
            disabled={busy}
            onClick={save}
          >
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <span className="text-sm text-[var(--color-text-dim)]">{label}</span>
      {children}
    </div>
  );
}
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-1.5 text-sm font-semibold',
        active
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
          : 'border-[var(--color-border)] text-[var(--color-text-dim)]',
      )}
    >
      {children}
    </button>
  );
}
function MiniBtn({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-[var(--color-border)] px-2 py-0.5 text-xs disabled:opacity-25"
    >
      {children}
    </button>
  );
}
function Slots({
  disabled,
  players,
  values,
  count,
  onChange,
}: {
  disabled: boolean;
  players: { id: string; name: string }[];
  values: string[];
  count: number;
  onChange: (slot: number, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: count }, (_, slot) => (
        <select
          key={slot}
          disabled={disabled}
          value={values[slot] ?? ''}
          onChange={(e) => onChange(slot, e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1.5 text-sm outline-none focus:border-[var(--color-accent)] disabled:opacity-60"
        >
          <option value="">—</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
