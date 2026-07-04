import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import { createId, createUuid } from '@/lib/id';
import { getRepository } from '@/data';
import { persistMatch } from '@/store/matchService';
import { useRoster } from '@/store/RosterContext';
import type { MatchRecord } from '@/data/types';
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
  // Only active players can be picked for a match.
  const { activePlayers: players } = useRoster();

  const [variant, setVariant] = useState<GameVariant>(501);
  const [mode, setMode] = useState<GameMode>('SINGLE');
  const [legsToWin, setLegsToWin] = useState(2);
  const [assign, setAssign] = useState<Record<string, Side | undefined>>({});
  const [policy, setPolicy] = useState<'BULL' | 'MANUAL'>('MANUAL');
  const [manualStarter, setManualStarter] = useState<Side>('A');
  const [bullOpen, setBullOpen] = useState(false);
  const [picker, setPicker] = useState<Side | null>(null);
  const [query, setQuery] = useState('');

  const perSide = mode === 'SINGLE' ? 1 : 2;
  const teamA = players.filter((p) => assign[p.id] === 'A');
  const teamB = players.filter((p) => assign[p.id] === 'B');

  const add = (side: Side, id: string) => {
    setAssign((prev) => ({ ...prev, [id]: side }));
    setPicker(null);
    setQuery('');
  };
  const remove = (id: string) =>
    setAssign((prev) => ({ ...prev, [id]: undefined }));
  // Players available to add: not already picked, matching the live search.
  const available = players.filter(
    (p) =>
      !assign[p.id] &&
      p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const valid = teamA.length === perSide && teamB.length === perSide;

  const errorHint = useMemo(() => {
    if (players.length < perSide * 2)
      return `You need at least ${perSide * 2} players (add some under "Players").`;
    if (!valid)
      return mode === 'DOUBLE'
        ? `Add ${perSide} players to each team.`
        : `Add a player to each side.`;
    return null;
  }, [players.length, perSide, valid, mode]);

  const [starting, setStarting] = useState(false);

  /** Build the game with a known starting side and launch it. */
  const startWithStarter = async (starterSide: Side) => {
    if (!valid || starting) return;
    setStarting(true);

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
      players: [...teamA, ...teamB].map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color ?? undefined,
      })),
      startingPolicy: policy,
      // Starter always alternates each leg.
      alternateStarter: true,
      firstStarterId,
    };

    // Attach the match to the current season, then create + auto-save it.
    const season = await getRepository()
      .getCurrentSeason()
      .catch(() => null);

    const matchId = createUuid();
    const record: MatchRecord = {
      id: matchId,
      seasonId: season?.id ?? 'local-2026-2027',
      config,
      events: [],
      mode,
      variant,
      status: 'IN_PROGRESS',
      winnerParticipant: null,
    };
    await persistMatch(record);
    navigate(`/game/${matchId}`);
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
          <SectionTitle>Players</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {(['A', 'B'] as Side[]).map((side) => {
              const members = side === 'A' ? teamA : teamB;
              const full = members.length >= perSide;
              const label =
                mode === 'DOUBLE'
                  ? `Team ${side}`
                  : `Player ${side === 'A' ? 1 : 2}`;
              return (
                <div
                  key={side}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                >
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-dim)]">
                    {label} ({members.length}/{perSide})
                  </div>
                  <div className="flex flex-col gap-2">
                    {members.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-[var(--color-surface-2)] px-3 py-2"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ background: p.color ?? '#666' }}
                          />
                          <span className="truncate">{p.name}</span>
                        </span>
                        <button
                          onClick={() => remove(p.id)}
                          className="shrink-0 text-[var(--color-text-dim)] hover:text-[var(--color-accent)]"
                          aria-label="Remove player"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {!full && (
                      <button
                        onClick={() => {
                          setPicker(side);
                          setQuery('');
                        }}
                        className="rounded-lg border border-dashed border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-accent)] hover:bg-[var(--color-surface-2)]"
                      >
                        + Add player
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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

      <Modal
        open={picker !== null}
        onClose={() => setPicker(null)}
        title="Add a player"
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players…"
          className="mb-3 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5 outline-none focus:border-[var(--color-accent)]"
        />
        <ul className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto">
          {available.length === 0 ? (
            <li className="py-6 text-center text-sm text-[var(--color-text-dim)]">
              No player found.
            </li>
          ) : (
            available.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => picker && add(picker, p.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-surface-2)]"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ background: p.color ?? '#666' }}
                  />
                  <span className="truncate">{p.name}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </Modal>
    </div>
  );
}
