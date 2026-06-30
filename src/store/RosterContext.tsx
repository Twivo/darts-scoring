/** Roster store: CRUD over players, persisted to LocalStorage. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createId } from '@/lib/id';
import type { Player } from '@/domain/types';
import { loadRoster, saveRoster } from './persistence';

interface RosterContextValue {
  players: Player[];
  addPlayer: (name: string) => Player;
  updatePlayer: (id: string, patch: Partial<Omit<Player, 'id'>>) => void;
  removePlayer: (id: string) => void;
  reorder: (from: number, to: number) => void;
}

const RosterContext = createContext<RosterContextValue | null>(null);

const PALETTE = [
  '#e10600',
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#9333ea',
  '#0891b2',
];

export function RosterProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(() => loadRoster());

  useEffect(() => {
    saveRoster(players);
  }, [players]);

  const addPlayer = useCallback((name: string): Player => {
    const player: Player = {
      id: createId('p'),
      name: name.trim(),
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    };
    setPlayers((prev) => [...prev, player]);
    return player;
  }, []);

  const updatePlayer = useCallback(
    (id: string, patch: Partial<Omit<Player, 'id'>>) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
    },
    [],
  );

  const removePlayer = useCallback((id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    setPlayers((prev) => {
      if (from === to || from < 0 || to < 0) return prev;
      if (from >= prev.length || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      if (!moved) return prev;
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const value = useMemo<RosterContextValue>(
    () => ({ players, addPlayer, updatePlayer, removePlayer, reorder }),
    [players, addPlayer, updatePlayer, removePlayer, reorder],
  );

  return (
    <RosterContext.Provider value={value}>{children}</RosterContext.Provider>
  );
}

export function useRoster(): RosterContextValue {
  const ctx = useContext(RosterContext);
  if (!ctx) throw new Error('useRoster must be used within a RosterProvider');
  return ctx;
}
