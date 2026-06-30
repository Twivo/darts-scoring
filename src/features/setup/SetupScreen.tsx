import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import { createId } from '@/lib/id';
import { saveGame } from '@/store/persistence';
import { useRoster } from '@/store/RosterContext';
import type {
  GameConfig,
  GameMode,
  GameVariant,
  Participant,
} from '@/domain/types';

type Side = 'A' | 'B';

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-dim)]">
    {children}
  </h2>
);

function Choice({
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
        'flex-1 rounded-xl border px-4 py-4 text-center text-base font-semibold transition-all active:scale-[0.98]',
        active
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white shadow-[0_4px_20px_-6px_var(--color-accent)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-border-strong)]',
      )}
    >
      {children}
    </button>
  );
}

export function SetupScreen() {
  const navigate = useNavigate();
  const { players } = useRoster();

  const [variant, setVariant] = useState<GameVariant>(501);
  const [mode, setMode] = useState<GameMode>('SINGLE');
  const [legsToWin, setLegsToWin] = useState(2);
  const [assign, setAssign] = useState<Record<string, Side | undefined>>({});
  const [policy, setPolicy] = useState<'BULL' | 'MANUAL'>('MANUAL');
  const [manualStarter, setManualStarter] = useState<Side>('A');
  const [bullOpen, setBullOpen] = useState(false);

  const perSide = mode === 'SINGLE' ? 1 : 2;
  const teamA = players.filter((p) => assign[p.id] === 'A');
  const teamB = players.filter((p) => assign[p.id] === 'B');

  const cycle = (id: string) => {
    setAssign((prev) => {
      const cur = prev[id];
      const next: Side | undefined =
        cur === undefined ? 'A' : cur === 'A' ? 'B' : undefined;
      if (next === 'A' && teamA.length >= perSide) {
        return { ...prev, [id]: 'B' };
      }
      if (next === 'B' && teamB.length >= perSide) {
        return { ...prev, [id]: undefined };
      }
      return { ...prev, [id]: next };
    });
  };

  const valid = teamA.length === perSide && teamB.length === perSide;

  const errorHint = useMemo(() => {
    if (players.length < perSide * 2)
      return `You need at least ${perSide * 2} players (add some under "Players").`;
    if (!valid)
      return mode === 'DOUBLE'
        ? `Select ${perSide} players per team (tap to cycle A → B → off).`
        : `Select 2 players (tap to select, tap again to remove).`;
    return null;
  }, [players.length, perSide, valid, mode]);

  /** Build the game with a known starting side and launch it. */
  const startWithStarter = (starterSide: Side) => {
    if (!valid) return;

    const buildParticipant = (side: Side, members: typeof teamA): Participant => ({
      id: createId('part'),
      label: mode === 'DOUBLE' ? `Team ${side}` : members[0]!.name,
      playerIds: members.map((m) => m.id),
    });

    const partA = buildParticipant('A', teamA);
    const partB = buildParticipant('B', teamB);
    const participants = [partA, partB];

    const firstStarterId = starterSide === 'A' ? partA.id : partB.id;

    const config: GameConfig = {
      id: createId('game'),
      createdAt: Date.now(),
      variant,
      outRule: 'DOUBLE',
      mode,
      legsToWin,
      participants,
      players: [...teamA, ...teamB],
      startingPolicy: policy,
      // Starter always alternates each leg.
      alternateStarter: true,
      firstStarterId,
    };

    saveGame(config, []);
    navigate('/game');
  };

  const onStartClick = () => {
    if (!valid) return;
    if (policy === 'BULL') {
      setBullOpen(true);
      return;
    }
    startWithStarter(manualStarter);
  };

  const labelForSide = (side: Side): string =>
    mode === 'DOUBLE'
      ? `Team ${side}`
      : (side === 'A' ? teamA[0]?.name : teamB[0]?.name) ??
        `Player ${side === 'A' ? 1 : 2}`;

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-6">
      <header className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold">New game</h1>
      </header>

      <div className="flex flex-col gap-6">
        <section>
          <SectionTitle>Game type</SectionTitle>
          <div className="flex gap-2">
            <Choice active={variant === 501} onClick={() => setVariant(501)}>
              501 Double Out
            </Choice>
            <Choice active={variant === 601} onClick={() => setVariant(601)}>
              601 Double Out
            </Choice>
          </div>
        </section>

        <section>
          <SectionTitle>Mode</SectionTitle>
          <div className="flex gap-2">
            <Choice
              active={mode === 'SINGLE'}
              onClick={() => {
                setMode('SINGLE');
                setAssign({});
              }}
            >
              Singles (1v1)
            </Choice>
            <Choice
              active={mode === 'DOUBLE'}
              onClick={() => {
                setMode('DOUBLE');
                setAssign({});
              }}
            >
              Doubles (2v2)
            </Choice>
          </div>
        </section>

        <section>
          <SectionTitle>Legs to win (first to)</SectionTitle>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Choice
                key={n}
                active={legsToWin === n}
                onClick={() => setLegsToWin(n)}
              >
                {n}
              </Choice>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>
            {mode === 'DOUBLE'
              ? `Players — Team A (${teamA.length}/${perSide}) · Team B (${teamB.length}/${perSide})`
              : `Players — select 2 (${teamA.length + teamB.length}/2)`}
          </SectionTitle>
          <ul className="flex flex-col gap-2">
            {players.map((p) => {
              const side = assign[p.id];
              return (
                <li key={p.id}>
                  <button
                    onClick={() => cycle(p.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl border px-4 py-4 transition-all active:scale-[0.99]',
                      side
                        ? 'border-[var(--color-accent)] bg-[var(--color-surface-2)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)]',
                    )}
                  >
                    <span className="flex items-center gap-3 text-lg">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ background: p.color }}
                      />
                      {p.name}
                    </span>
                    {side && (
                      <span
                        className={cn(
                          'rounded-lg px-3 py-1 text-sm font-bold',
                          side === 'A'
                            ? 'bg-[var(--color-accent)] text-white'
                            : 'bg-white text-black',
                        )}
                      >
                        {mode === 'DOUBLE'
                          ? `Team ${side}`
                          : `Player ${side === 'A' ? 1 : 2}`}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <SectionTitle>Who starts leg 1?</SectionTitle>
          <div className="mb-2 flex gap-2">
            <Choice active={policy === 'BULL'} onClick={() => setPolicy('BULL')}>
              🎯 Bull-up
            </Choice>
            <Choice
              active={policy === 'MANUAL'}
              onClick={() => setPolicy('MANUAL')}
            >
              Pick manually
            </Choice>
          </div>
          {policy === 'MANUAL' && (
            <div className="flex gap-2">
              <Choice
                active={manualStarter === 'A'}
                onClick={() => setManualStarter('A')}
              >
                {labelForSide('A')}
              </Choice>
              <Choice
                active={manualStarter === 'B'}
                onClick={() => setManualStarter('B')}
              >
                {labelForSide('B')}
              </Choice>
            </div>
          )}
          <p className="mt-2 text-xs text-[var(--color-text-mute)]">
            The starter alternates automatically every leg.
          </p>
        </section>

        {errorHint && (
          <p className="text-center text-sm text-[var(--color-warning)]">
            {errorHint}
          </p>
        )}

        <Button
          variant="accent"
          size="xl"
          fullWidth
          disabled={!valid}
          onClick={onStartClick}
        >
          {policy === 'BULL' ? 'Continue — bull-up' : 'Start game'}
        </Button>
      </div>

      <Modal
        open={bullOpen}
        onClose={() => setBullOpen(false)}
        closeOnBackdrop={false}
        title="🎯 Bull-up"
      >
        <p className="mb-5 text-[var(--color-text-dim)]">
          Each {mode === 'DOUBLE' ? 'team' : 'player'} throws at the bull. Who
          landed closest and starts?
        </p>
        <div className="flex flex-col gap-3">
          <Button
            variant="accent"
            size="xl"
            fullWidth
            onClick={() => startWithStarter('A')}
          >
            {labelForSide('A')}
          </Button>
          <Button
            variant="primary"
            size="xl"
            fullWidth
            onClick={() => startWithStarter('B')}
          >
            {labelForSide('B')}
          </Button>
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onClick={() => setBullOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
