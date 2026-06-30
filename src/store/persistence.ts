/**
 * LocalStorage persistence. We ONLY persist the source of truth:
 *  - the roster (players)
 *  - the current game as { config, events }
 * Everything else is recomputed by the engine on load.
 */
import {
  SCHEMA_VERSION,
  type GameConfig,
  type GameEvent,
  type PersistedGame,
  type PersistedRoster,
  type Player,
} from '@/domain/types';

const GAME_KEY = 'darts:game:v1';
const ROSTER_KEY = 'darts:roster:v1';

// --- Game ------------------------------------------------------------------

export function saveGame(config: GameConfig, events: GameEvent[]): void {
  try {
    const payload: PersistedGame = {
      schemaVersion: SCHEMA_VERSION,
      config,
      events,
    };
    localStorage.setItem(GAME_KEY, JSON.stringify(payload));
  } catch {
    // storage full / unavailable — non-fatal
  }
}

export function loadGame(): PersistedGame | null {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedGame;
    if (!isValidPersistedGame(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(GAME_KEY);
  } catch {
    /* noop */
  }
}

function isValidPersistedGame(g: unknown): g is PersistedGame {
  if (!g || typeof g !== 'object') return false;
  const obj = g as Record<string, unknown>;
  if (!obj.config || typeof obj.config !== 'object') return false;
  if (!Array.isArray(obj.events)) return false;
  const config = obj.config as Record<string, unknown>;
  return (
    typeof config.id === 'string' &&
    Array.isArray(config.participants) &&
    (config.variant === 501 || config.variant === 601)
  );
}

// --- Roster ----------------------------------------------------------------

export function saveRoster(players: Player[]): void {
  try {
    const payload: PersistedRoster = {
      schemaVersion: SCHEMA_VERSION,
      players,
    };
    localStorage.setItem(ROSTER_KEY, JSON.stringify(payload));
  } catch {
    /* noop */
  }
}

export function loadRoster(): Player[] {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedRoster;
    if (!parsed || !Array.isArray(parsed.players)) return [];
    return parsed.players.filter(
      (p) => p && typeof p.id === 'string' && typeof p.name === 'string',
    );
  } catch {
    return [];
  }
}
