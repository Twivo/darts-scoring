import { Navigate, Route, Routes } from 'react-router-dom';
import { HomeScreen } from './features/home/HomeScreen';
import { PlayersScreen } from './features/players/PlayersScreen';
import { SetupScreen } from './features/setup/SetupScreen';
import { GameRoute } from './features/game/GameRoute';

export function App() {
  return (
    <div className="min-h-full bg-[var(--color-bg)] text-[var(--color-text)]">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/players" element={<PlayersScreen />} />
        <Route path="/new" element={<SetupScreen />} />
        <Route path="/game" element={<GameRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
