/**
 * LocalStorage fallback (used when Supabase isn't configured, and as an
 * offline cache). Keeps the app fully usable with no backend.
 */
import { createId } from '@/lib/id';
import type { DartsRepository, PlayerInput } from '../repository';
import type {
  MatchQuery,
  MatchRecord,
  PlayerQuery,
  PlayerRecord,
  Season,
} from '../types';

const PLAYERS_KEY = 'darts:players:v2';
const MATCHES_KEY = 'darts:matches:v2';

const LOCAL_SEASON: Season = {
  id: 'local-2026-2027',
  name: '2026/2027',
  isCurrent: true,
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

export class LocalRepository implements DartsRepository {
  async listPlayers(query: PlayerQuery = {}): Promise<PlayerRecord[]> {
    let players = read<PlayerRecord[]>(PLAYERS_KEY, []);
    if (query.activeOnly) players = players.filter((p) => p.active);
    if (query.search) {
      const s = query.search.toLowerCase();
      players = players.filter((p) => p.name.toLowerCase().includes(s));
    }
    const dir = (query.sortDir ?? 'asc') === 'asc' ? 1 : -1;
    players.sort((a, b) =>
      query.sortBy === 'createdAt'
        ? ((a.createdAt ?? '') < (b.createdAt ?? '') ? -1 : 1) * dir
        : a.name.localeCompare(b.name) * dir,
    );
    return players;
  }

  async createPlayer(input: PlayerInput): Promise<PlayerRecord> {
    const players = read<PlayerRecord[]>(PLAYERS_KEY, []);
    const player: PlayerRecord = {
      id: createId('p'),
      name: input.name,
      color: input.color ?? null,
      active: input.active ?? true,
      createdAt: new Date().toISOString(),
    };
    write(PLAYERS_KEY, [...players, player]);
    return player;
  }

  async updatePlayer(
    id: string,
    patch: Partial<PlayerInput>,
  ): Promise<PlayerRecord> {
    const players = read<PlayerRecord[]>(PLAYERS_KEY, []);
    const next = players.map((p) => (p.id === id ? { ...p, ...patch } : p));
    write(PLAYERS_KEY, next);
    return next.find((p) => p.id === id)!;
  }

  async deletePlayer(id: string): Promise<void> {
    const players = read<PlayerRecord[]>(PLAYERS_KEY, []);
    write(
      PLAYERS_KEY,
      players.filter((p) => p.id !== id),
    );
  }

  async listSeasons(): Promise<Season[]> {
    return [LOCAL_SEASON];
  }
  async getCurrentSeason(): Promise<Season> {
    return LOCAL_SEASON;
  }

  async listMatches(query: MatchQuery = {}): Promise<MatchRecord[]> {
    let matches = read<MatchRecord[]>(MATCHES_KEY, []);
    if (query.mode) matches = matches.filter((m) => m.mode === query.mode);
    if (query.status) matches = matches.filter((m) => m.status === query.status);
    if (query.playerId)
      matches = matches.filter((m) =>
        m.config.players.some((p) => p.id === query.playerId),
      );
    return matches.sort((a, b) =>
      (a.createdAt ?? '') < (b.createdAt ?? '') ? 1 : -1,
    );
  }

  async getMatch(id: string): Promise<MatchRecord | null> {
    return read<MatchRecord[]>(MATCHES_KEY, []).find((m) => m.id === id) ?? null;
  }

  async saveMatch(record: MatchRecord): Promise<void> {
    const matches = read<MatchRecord[]>(MATCHES_KEY, []);
    const idx = matches.findIndex((m) => m.id === record.id);
    const stamped = { ...record, updatedAt: new Date().toISOString() };
    if (idx >= 0) matches[idx] = stamped;
    else matches.push({ ...stamped, createdAt: new Date().toISOString() });
    write(MATCHES_KEY, matches);
  }

  async listInProgress(): Promise<MatchRecord[]> {
    return (await this.listMatches({ status: 'IN_PROGRESS' })).sort((a, b) =>
      (a.updatedAt ?? '') < (b.updatedAt ?? '') ? 1 : -1,
    );
  }
}
