import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { GameProvider } from '@/store/GameContext';
import { loadMatch } from '@/store/matchService';
import type { MatchRecord } from '@/data/types';
import { GameScreen } from './GameScreen';

export function GameRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--color-text-dim)]">
        Loading match…
      </div>
    );
  }
  if (!id || !match) return <Navigate to="/" replace />;

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
