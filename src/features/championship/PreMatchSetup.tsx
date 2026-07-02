import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { EncounterRecord } from '@/data/types';
import type { Fixture, Side } from '@/domain/championship/types';

/**
 * Shown before every match: pick the throwing order (doubles) and who won the
 * bull-up (which side throws first). The choice is kept for the whole match.
 */
export function PreMatchSetup({
  encounter,
  fixture,
  onConfirm,
}: {
  encounter: EncounterRecord;
  fixture: Fixture;
  onConfirm: (v: { aOrder: string[]; bOrder: string[]; starter: Side }) => void;
}) {
  const { teams } = encounter.plan;
  const isDouble = fixture.kind === 'DOUBLE';
  const [aOrder, setAOrder] = useState<string[]>(fixture.aPlayerIds);
  const [bOrder, setBOrder] = useState<string[]>(fixture.bPlayerIds);
  const [starter, setStarter] = useState<Side | null>(null);

  const nameOf = (id: string) =>
    [...teams.A.players, ...teams.B.players].find((p) => p.id === id)?.name ??
    '???';
  const swap = (order: string[], set: (v: string[]) => void) =>
    set([order[1]!, order[0]!]);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-y-auto px-4 py-5">
      <div className="mb-4 text-center">
        <div className="text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
          Match {fixture.index + 1} · {isDouble ? 'Doubles' : 'Singles'}
        </div>
        <h2 className="text-xl font-black">Bull-up</h2>
      </div>

      {isDouble && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-dim)]">
            Throwing order
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <OrderCard
              team={teams.A.name}
              order={aOrder}
              nameOf={nameOf}
              onSwap={() => swap(aOrder, setAOrder)}
            />
            <OrderCard
              team={teams.B.name}
              order={bOrder}
              nameOf={nameOf}
              onSwap={() => swap(bOrder, setBOrder)}
            />
          </div>
        </div>
      )}

      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-dim)]">
        Who won the bull and starts?
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {(['A', 'B'] as Side[]).map((side) => {
          const order = side === 'A' ? aOrder : bOrder;
          const teamName = side === 'A' ? teams.A.name : teams.B.name;
          return (
            <button
              key={side}
              onClick={() => setStarter(side)}
              className={cn(
                'rounded-xl border-2 px-4 py-4 text-center transition-all active:scale-[0.98]',
                starter === side
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)]',
              )}
            >
              <div className="text-xs opacity-80">{teamName}</div>
              <div className="font-black">
                {order.map(nameOf).join(' & ') || '—'}
              </div>
            </button>
          );
        })}
      </div>

      <Button
        variant="accent"
        size="xl"
        fullWidth
        className="mt-6"
        disabled={!starter}
        onClick={() => starter && onConfirm({ aOrder, bOrder, starter })}
      >
        Start match ▶
      </Button>
    </div>
  );
}

function OrderCard({
  team,
  order,
  nameOf,
  onSwap,
}: {
  team: string;
  order: string[];
  nameOf: (id: string) => string;
  onSwap: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="mb-1 truncate text-xs font-semibold text-[var(--color-text-dim)]">
        {team}
      </div>
      <ol className="mb-2 flex flex-col gap-1 text-sm">
        {order.map((id, i) => (
          <li key={id} className="flex items-center gap-2">
            <span className="text-[var(--color-text-mute)]">{i + 1}.</span>
            <span className="font-semibold">{nameOf(id)}</span>
          </li>
        ))}
      </ol>
      <button
        onClick={onSwap}
        className="w-full rounded-lg border border-[var(--color-border)] py-1 text-xs text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)]"
      >
        ↕ Swap order
      </button>
    </div>
  );
}
