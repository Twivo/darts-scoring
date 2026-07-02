import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { GameProvider } from '@/store/GameContext';
import { loadMatch } from '@/store/matchService';
import { acquireLock, releaseLock, LOCK_HEARTBEAT_MS } from '@/store/matchLock';
import { Button } from '@/components/ui/Button';
import type { MatchRecord } from '@/data/types';
import { GameScreen } from './GameScreen';

export function GameRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [loading, setLoading] = useState(true);
  /** True when another device is actively scoring this match. */
  const [lockedOut, setLockedOut] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!id) {
      setLoading(false);
      return;
    }
    loadMatch(id)
      .then((m) => alive && setMatch(m))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  // Take control of the match, then hold it with a heartbeat. Another device
  // can only watch (read-only) until we release it or the heartbeat goes stale.
  useEffect(() => {
    if (!id || !match) return;
    let alive = true;
    let beat: number | undefined;
    void acquireLock(id).then((r) => {
      if (!alive) return;
      if (!r.held) {
        setLockedOut(true);
        return;
      }
      setLockedOut(false);
      beat = window.setInterval(() => {
        void acquireLock(id).then((hb) => {
          if (alive && hb.byOther) {
            setLockedOut(true);
            if (beat) window.clearInterval(beat);
          }
        });
      }, LOCK_HEARTBEAT_MS);
    });
    return () => {
      alive = false;
      if (beat) window.clearInterval(beat);
      void releaseLock(id);
    };
  }, [id, match]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--color-text-dim)]">
        Loading match…
      </div>
    );
  }
  if (!id || !match) return <Navigate to="/" replace />;

  if (lockedOut) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="text-5xl">🔒</div>
        <div>
          <h1 className="text-xl font-black">Match in progress elsewhere</h1>
          <p className="mt-2 text-sm text-[var(--color-text-dim)]">
            This match is being scored on another device. You can follow it live,
            or take over once that device stops.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <Button variant="accent" size="xl" fullWidth onClick={() => navigate(`/live/${id}`)}>
            📺 Watch live
          </Button>
          <Button variant="surface" size="lg" fullWidth onClick={() => navigate('/')}>
            Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <GameProvider
      matchId={match.id}
      seasonId={match.seasonId}
      config={match.config}
      initialEvents={match.events}
      onEnd={() => navigate('/', { replace: true })}
    >
      <GameScreen />
    </GameProvider>
  );
}
