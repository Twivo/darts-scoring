import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { buildGameState } from '@/domain/engine';
import { clearGame, loadGame } from '@/store/persistence';

export function HomeScreen() {
  const navigate = useNavigate();
  const saved = useMemo(() => loadGame(), []);

  const resumable = useMemo(() => {
    if (!saved) return null;
    const state = buildGameState(saved.config, saved.events);
    return state.status !== 'GAME_OVER' ? state : null;
  }, [saved]);

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

      {resumable && saved && (
        <div className="w-full rounded-2xl border border-[var(--color-accent)] bg-[var(--color-surface)] p-6 shadow-[0_8px_40px_-12px_var(--color-accent)]">
          <p className="mb-1 text-lg font-bold">Game in progress</p>
          <p className="mb-5 text-sm text-[var(--color-text-dim)]">
            {saved.config.variant}{' '}
            {saved.config.mode === 'DOUBLE' ? 'Doubles' : 'Singles'}
            {' · legs '}
            {Object.values(resumable.legsWon).join(' – ')}
          </p>
          <div className="flex flex-col gap-3">
            <Button
              variant="accent"
              size="xl"
              fullWidth
              onClick={() => navigate('/game')}
            >
              Resume
            </Button>
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onClick={() => {
                clearGame();
                navigate('/new');
              }}
            >
              New game
            </Button>
          </div>
        </div>
      )}

      {!resumable && (
        <Button
          variant="accent"
          size="xl"
          fullWidth
          onClick={() => navigate('/new')}
        >
          New game
        </Button>
      )}

      <Button
        variant="surface"
        size="lg"
        fullWidth
        onClick={() => navigate('/players')}
      >
        Manage players
      </Button>
    </div>
  );
}
