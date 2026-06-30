import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { GameProvider } from '@/store/GameContext';
import { loadGame } from '@/store/persistence';
import { GameScreen } from './GameScreen';

export function GameRoute() {
  const navigate = useNavigate();
  const saved = useMemo(() => loadGame(), []);

  if (!saved) return <Navigate to="/" replace />;

  return (
    <GameProvider
      config={saved.config}
      initialEvents={saved.events}
      onEnd={() => navigate('/', { replace: true })}
    >
      <GameScreen />
    </GameProvider>
  );
}
