import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buildGameState } from '@/domain/engine';
import { loadMatch } from '@/store/matchService';
import { loadEncounter } from '@/store/encounterService';
import { subscribeMatch } from '@/store/liveMatch';
import type { MatchRecord } from '@/data/types';
import { LiveBoard, type EncounterContext } from './LiveBoard';

/** Read-only live view of one match. Never scores — pure spectating. */
export function LiveMatch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [encounter, setEncounter] = useState<EncounterContext | null>(null);
  const [loading, setLoading] = useState(true);

  // Live updates: realtime push + a polling fallback, both just refetch.
  useEffect(() => {
    if (!id) return;
    let alive = true;
    const refresh = () =>
      loadMatch(id).then((m) => {
        if (alive && m) setMatch(m);
      });
    void refresh().finally(() => alive && setLoading(false));
    const unsub = subscribeMatch(id, () => void refresh());
    const poll = window.setInterval(() => void refresh(), 4000);
    return () => {
      alive = false;
      unsub();
      window.clearInterval(poll);
    };
  }, [id]);

  // Championship context (team tie score + which fixture).
  useEffect(() => {
    let alive = true;
    if (match?.encounterId) {
      void loadEncounter(match.encounterId).then((enc) => {
        if (!alive || !enc) return;
        const total = enc.plan.fixtures.length;
        const n = (match.fixtureIndex ?? 0) + 1;
        setEncounter({
          aName: enc.plan.teams.A.name,
          bName: enc.plan.teams.B.name,
          scoreA: enc.scoreA,
          scoreB: enc.scoreB,
          label: `match ${n} of ${total} · ${match.mode === 'DOUBLE' ? 'doubles' : 'singles'}`,
        });
      });
    } else {
      setEncounter(null);
    }
    return () => {
      alive = false;
    };
  }, [match?.encounterId, match?.fixtureIndex, match?.mode]);

  const state = useMemo(
    () => (match ? buildGameState(match.config, match.events) : null),
    [match],
  );

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-3 py-4">
      <div className="mb-3 flex items-center">
        <button
          onClick={() => navigate('/live')}
          className="rounded-lg px-2 py-1 text-sm text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)]"
        >
          ← Live matches
        </button>
      </div>

      {loading ? (
        <p className="py-16 text-center text-[var(--color-text-dim)]">Loading…</p>
      ) : !state ? (
        <p className="py-16 text-center text-[var(--color-text-dim)]">
          This match is no longer available.
        </p>
      ) : (
        <LiveBoard state={state} encounter={encounter} />
      )}
    </div>
  );
}
