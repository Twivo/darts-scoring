/**
 * Repository & Auth contracts. The whole app depends on these interfaces, not
 * on a concrete backend — so we can swap LocalStorage (offline / dev) and
 * Supabase (cloud) without touching feature code, and add new backends later.
 */
import type {
  MatchQuery,
  MatchRecord,
  PlayerQuery,
  PlayerRecord,
  Season,
} from './types';

export interface PlayerInput {
  name: string;
  color?: string | null;
  active?: boolean;
}

export interface DartsRepository {
  // players ---------------------------------------------------------------
  listPlayers(query?: PlayerQuery): Promise<PlayerRecord[]>;
  createPlayer(input: PlayerInput): Promise<PlayerRecord>;
  updatePlayer(id: string, patch: Partial<PlayerInput>): Promise<PlayerRecord>;
  deletePlayer(id: string): Promise<void>;

  // seasons ---------------------------------------------------------------
  listSeasons(): Promise<Season[]>;
  getCurrentSeason(): Promise<Season | null>;

  // matches (event-sourced) ----------------------------------------------
  listMatches(query?: MatchQuery): Promise<MatchRecord[]>;
  getMatch(id: string): Promise<MatchRecord | null>;
  /** Upsert — used by the transparent auto-save on every important action. */
  saveMatch(record: MatchRecord): Promise<void>;
  /** Matches still in progress (for the resume prompt). */
  listInProgress(): Promise<MatchRecord[]>;
}

// --- Authentication --------------------------------------------------------

export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthProvider {
  getUser(): Promise<AuthUser | null>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  /** Subscribe to auth changes; returns an unsubscribe function. */
  onChange(cb: (user: AuthUser | null) => void): () => void;
}
