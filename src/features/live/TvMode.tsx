import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildGameState } from '@/domain/engine';
import { loadMatch } from '@/store/matchService';
import { loadEncounter } from '@/store/encounterService';
import { listLiveMatches, subscribeMatch } from '@/store/liveMatch';
import { useT, LangToggle } from '@/store/LangContext';
import { QrCode } from '@/components/QrCode';
import { cn } from '@/lib/cn';
import type { EncounterRecord, MatchRecord } from '@/data/types';
import { LiveBoard, type EncounterContext } from './LiveBoard';

const ROTATE_MS = 12000;

/**
 * Club TV mode: a hands-off fullscreen board that auto-rotates through every
 * live match, updated in real time, with a QR code so anyone in the room can
 * scan and follow along on their phone. Leave it running on the club screen.
 */
export function TvMode() {
  const { t } = useT();
  const navigate = useNavigate();
  const [live, setLive] = useState<MatchRecord[]>([]);
  const [idx, setIdx] = useState(0);
  const [current, setCurrent] = useState<MatchRecord | null>(null);
  const [encounter, setEncounter] = useState<EncounterRecord | null>(null);

  // Poll the list of live matches.
  useEffect(() => {
    let alive = true;
    const refresh = () =>
      listLiveMatches().then((m) => alive && setLive(m));
    void refresh();
    const p = window.setInterval(() => void refresh(), 5000);
    return () => {
      alive = false;
      window.clearInterval(p);
    };
  }, []);

  // Auto-rotate between matches.
  useEffect(() => {
    if (live.length <= 1) return;
    const r = window.setInterval(
      () => setIdx((i) => (i + 1) % live.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(r);
  }, [live.length]);

  const safeIdx = live.length ? idx % live.length : 0;
  const currentId = live[safeIdx]?.id;

  // Load the shown match (full record) + realtime + polling fallback.
  useEffect(() => {
    if (!currentId) {
      setCurrent(null);
      return;
    }
    let alive = true;
    const refresh = () =>
      loadMatch(currentId).then((m) => alive && m && setCurrent(m));
    void refresh();
    const unsub = subscribeMatch(currentId, () => void refresh());
    const p = window.setInterval(() => void refresh(), 4000);
    return () => {
      alive = false;
      unsub();
      window.clearInterval(p);
    };
  }, [currentId]);

  // Championship context for the shown match.
  const encId = current?.encounterId ?? null;
  useEffect(() => {
    if (!encId) {
      setEncounter(null);
      return;
    }
    let alive = true;
    const refresh = () =>
      loadEncounter(encId).then((e) => {
        if (alive && e) setEncounter(e);
      });
    void refresh();
    const p = window.setInterval(() => void refresh(), 5000);
    return () => {
      alive = false;
      window.clearInterval(p);
    };
  }, [encId]);

  const state = useMemo(
    () => (current ? buildGameState(current.config, current.events) : null),
    [current],
  );

  const context: EncounterContext | null = useMemo(() => {
    if (!encounter || !current) return null;
    const total = encounter.plan.fixtures.length;
    const n = (current.fixtureIndex ?? 0) + 1;
    return {
      aName: encounter.plan.teams.A.name,
      bName: encounter.plan.teams.B.name,
      scoreA: encounter.scoreA,
      scoreB: encounter.scoreB,
      label: `match ${n}/${total}`,
    };
  }, [encounter, current]);

  const base =
    typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  const matchUrl = currentId ? `${base}#/live/${currentId}` : `${base}#/live`;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--color-bg)] px-4 py-4 sm:px-8 sm:py-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-sm font-black uppercase tracking-wide text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            {t('tv.title')}
          </span>
          {live.length > 0 && (
            <span className="text-sm text-[var(--color-text-dim)]">
              {live.length} {t('tv.live')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <LangToggle />
          <button
            onClick={() => navigate('/')}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)]"
          >
            {t('tv.exit')}
          </button>
        </div>
      </header>

      {!state ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="text-6xl">📺</div>
          <h1 className="text-2xl font-black">{t('tv.idle')}</h1>
          <p className="max-w-md text-[var(--color-text-dim)]">{t('tv.idleHint')}</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 lg:flex-row lg:items-center lg:gap-10">
          {/* big live board */}
          <div className="w-full max-w-4xl scale-100 sm:scale-105 lg:scale-110">
            <LiveBoard state={state} encounter={context} />
          </div>

          {/* QR to watch on a phone */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            <QrCode value={matchUrl} size={168} />
            <span className="text-center text-sm font-semibold text-[var(--color-text-dim)]">
              {t('live.scan')}
            </span>
          </div>
        </div>
      )}

      {/* rotation dots */}
      {live.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {live.map((m, i) => (
            <span
              key={m.id}
              className={cn(
                'h-2 rounded-full transition-all',
                i === safeIdx
                  ? 'w-6 bg-[var(--color-accent)]'
                  : 'w-2 bg-[var(--color-border)]',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
