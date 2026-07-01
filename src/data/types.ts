/**
 * Data-layer types — the persistence model shared by every repository
 * implementation (local or Supabase). The domain stays untouched: a match
 * still persists exactly { config, events } and the engine recomputes the rest.
 */
import type { GameConfig, GameEvent } from '@/domain/types';

export interface Season {
  id: string;
  name: string; // "2026/2027"
  startsOn?: string | null;
  endsOn?: string | null;
  isCurrent: boolean;
}

export interface PlayerRecord {
  id: string;
  name: string;
  color?: string | null;
  active: boolean;
  createdAt?: string;
}

export type MatchStatus = 'IN_PROGRESS' | 'GAME_OVER' | 'ABANDONED';

export interface MatchRecord {
  id: string;
  seasonId: string;
  config: GameConfig;
  events: GameEvent[];
  mode: GameConfig['mode'];
  variant: GameConfig['variant'];
  status: MatchStatus;
  winnerParticipant?: string | null;
  createdAt?: string;
  updatedAt?: string;
  finishedAt?: string | null;
}

// --- query inputs ----------------------------------------------------------

export interface PlayerQuery {
  search?: string;
  activeOnly?: boolean;
  sortBy?: 'name' | 'createdAt';
  sortDir?: 'asc' | 'desc';
}

export interface MatchQuery {
  seasonId?: string;
  playerId?: string;
  mode?: GameConfig['mode'];
  status?: MatchStatus;
  /** ISO date range on created_at. */
  from?: string;
  to?: string;
}
