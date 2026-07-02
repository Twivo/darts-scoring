/**
 * Local cache of matches (LocalStorage). Acts as an offline-resilient mirror:
 * every save writes here synchronously, so a crash / network drop / closed tab
 * never loses the in-progress game. The cloud (Supabase) is the source of
 * truth across devices; the cache is the safety net.
 */
import type { MatchRecord } from './types';

const INDEX_KEY = 'darts:match-index';
const key = (id: string) => `darts:match:${id}`;

function readIndex(): string[] {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}
function writeIndex(ids: string[]): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    /* ignore */
  }
}

export function cacheMatch(record: MatchRecord): void {
  try {
    localStorage.setItem(key(record.id), JSON.stringify(record));
    writeIndex([...readIndex(), record.id]);
  } catch {
    /* quota — ignore */
  }
}

export function getCachedMatch(id: string): MatchRecord | null {
  try {
    const raw = localStorage.getItem(key(id));
    return raw ? (JSON.parse(raw) as MatchRecord) : null;
  } catch {
    return null;
  }
}

export function removeCachedMatch(id: string): void {
  try {
    localStorage.removeItem(key(id));
    writeIndex(readIndex().filter((x) => x !== id));
  } catch {
    /* ignore */
  }
}

export function listCachedInProgress(): MatchRecord[] {
  return readIndex()
    .map((id) => getCachedMatch(id))
    .filter(
      (m): m is MatchRecord =>
        // regular matches only — championship matches resume via the encounter
        !!m && m.status === 'IN_PROGRESS' && !m.encounterId,
    );
}
