import { Navigate, Route, Routes } from 'react-router-dom';
import { HomeScreen } from './features/home/HomeScreen';
import { SetupScreen } from './features/setup/SetupScreen';
import { GameRoute } from './features/game/GameRoute';
import { AdminLayout } from './features/admin/AdminLayout';
import { AdminPlayers } from './features/admin/AdminPlayers';
import { AdminDashboard } from './features/admin/AdminDashboard';

export function App() {
  return (
    <div className="min-h-full bg-[var(--color-bg)] text-[var(--color-text)]">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/new" element={<SetupScreen />} />
        <Route path="/game/:id" element={<GameRoute />} />

        {/* Admin — fully gated by RequireAuth inside AdminLayout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/players" replace />} />
          <Route path="players" element={<AdminPlayers />} />
          <Route path="stats" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
