/**
 * Resilient match persistence: writes to the local cache synchronously, then
 * pushes to the cloud (best-effort). Reads prefer the cloud but fall back to
 * the cache. This is what makes auto-save survive restarts, network drops,
 * closed tabs, dead batteries — and still sync across devices.
 */
import { getRepository } from '@/data';
import {
  cacheMatch,
  getCachedMatch,
  listCachedInProgress,
  removeCachedMatch,
} from '@/data/matchCache';
import type { MatchRecord } from '@/data/types';

/** Save everywhere. Never throws — the cache guarantees no data loss. */
export async function persistMatch(record: MatchRecord): Promise<void> {
  cacheMatch(record);
  try {
    await getRepository().saveMatch(record);
  } catch {
    // Offline or not yet allowed by policy — kept safely in the cache and
    // retried on the next save.
  }
}

/** Load a match by id (cloud first, cache fallback, newest events wins). */
export async function loadMatch(id: string): Promise<MatchRecord | null> {
  const cached = getCachedMatch(id);
  let remote: MatchRecord | null = null;
  try {
    remote = await getRepository().getMatch(id);
  } catch {
    remote = null;
  }
  if (remote && cached) {
    return remote.events.length >= cached.events.length ? remote : cached;
  }
  return remote ?? cached;
}

/** In-progress matches for the resume prompt (cloud ∪ cache, deduped). */
export async function listResumable(): Promise<MatchRecord[]> {
  let remote: MatchRecord[] = [];
  try {
    remote = await getRepository().listInProgress();
  } catch {
    remote = [];
  }
  const byId = new Map<string, MatchRecord>();
  for (const m of listCachedInProgress()) byId.set(m.id, m);
  for (const m of remote) {
    const local = byId.get(m.id);
    if (!local || m.events.length >= local.events.length) byId.set(m.id, m);
  }
  return [...byId.values()].sort((a, b) =>
    (a.updatedAt ?? a.createdAt ?? '') < (b.updatedAt ?? b.createdAt ?? '')
      ? 1
      : -1,
  );
}

/** A finished/closed match no longer needs the local safety copy. */
export function forgetCachedMatch(id: string): void {
  removeCachedMatch(id);
}
