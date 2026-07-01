import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { buildGameState } from '@/domain/engine';
import { listResumable } from '@/store/matchService';
import { participantLabel } from '@/domain/presentation';
import type { MatchRecord } from '@/data/types';

export function HomeScreen() {
  const navigate = useNavigate();
  const [resumable, setResumable] = useState<MatchRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    listResumable()
      .then((m) => alive && setResumable(m))
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  const describe = (m: MatchRecord) => {
    const state = buildGameState(m.config, m.events);
    const sides = m.config.participants
      .map((p) => participantLabel(m.config, p.id))
      .join(' vs ');
    const legs = Object.values(state.legsWon).join(' – ');
    return { sides, legs };
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-10 px-6 py-12">
      <div className="text-center">
        <div className="mb-3 text-7xl">🎯</div>
        <h1 className="text-5xl font-black tracking-tight">
          DARTS<span className="text-[var(--color-accent)]">SCORE</span>
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-dim)]">
          Match scoring — 501 / 601 Double Out
        </p>
      </div>

      {resumable.length > 0 && (
        <div className="w-full rounded-2xl border border-[var(--color-accent)] bg-[var(--color-surface)] p-5 shadow-[0_8px_40px_-12px_var(--color-accent)]">
          <p className="mb-3 text-lg font-bold">
            {resumable.length === 1
              ? 'Game in progress'
              : `${resumable.length} games in progress`}
          </p>
          <div className="flex flex-col gap-2">
            {resumable.map((m) => {
              const { sides, legs } = describe(m);
              return (
                <button
                  key={m.id}
                  onClick={() => navigate(`/game/${m.id}`)}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-left transition-colors hover:border-[var(--color-accent)]"
                >
                  <span>
                    <span className="block font-semibold">{sides}</span>
                    <span className="text-xs text-[var(--color-text-dim)]">
                      {m.variant} {m.mode === 'DOUBLE' ? 'Doubles' : 'Singles'} ·
                      legs {legs}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-[var(--color-accent)]">
                    Resume →
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Button
        variant="accent"
        size="xl"
        fullWidth
        onClick={() => navigate('/new')}
      >
        New game
      </Button>

      <Button
        variant="surface"
        size="lg"
        fullWidth
        onClick={() => navigate('/admin')}
      >
        Admin
      </Button>

      {!loaded && (
        <p className="text-xs text-[var(--color-text-mute)]">Syncing…</p>
      )}
    </div>
  );
}
