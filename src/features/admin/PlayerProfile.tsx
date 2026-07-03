import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRepository } from '@/data';
import { buildGameState } from '@/domain/engine';
import { aggregatePlayerStats } from '@/domain/playerStats';
import { participantDisplay } from '@/domain/presentation';
import { cn } from '@/lib/cn';
import { MatchDetail } from './MatchDetail';
import type { MatchRecord, Season } from '@/data/types';

/**
 * Player profile: career overview, per-match average trend, personal records,
 * match history, and head-to-head against any opponent. Championship matches
 * only (training games never count), reusing the pure engine — nothing stored.
 */
export function PlayerProfile() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const repo = useMemo(() => getRepository(), []);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState<string>('');
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [opponent, setOpponent] = useState('ALL');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rosterName, setRosterName] = useState('');

  useEffect(() => {
    void repo
      .listPlayers()
      .then((ps) => setRosterName(ps.find((p) => p.id === id)?.name ?? ''));
  }, [repo, id]);

  useEffect(() => {
    void repo.listSeasons().then((s) => {
      setSeasons(s);
      const cur = s.find((x) => x.isCurrent) ?? s[0];
      if (cur) setSeasonId(cur.id);
    });
  }, [repo]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void repo
      .listMatches({ championship: true, ...(seasonId ? { seasonId } : {}) })
      .then((m) => alive && setMatches(m))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [repo, seasonId]);

  // Everything derives from the player's matches (recomputed by the engine).
  const data = useMemo(() => {
    const mine = matches.filter((m) => m.config.players.some((p) => p.id === id));
    const name =
      mine.flatMap((m) => m.config.players).find((p) => p.id === id)?.name ?? '—';

    const per = mine
      .map((m) => {
        const state = buildGameState(m.config, m.events);
        const mySide = m.config.participants.find((p) => p.playerIds.includes(id));
        const oppSide = m.config.participants.find((p) => p.id !== mySide?.id);
        const stats = aggregatePlayerStats([{ config: m.config, events: m.events }]);
        const myAvg = stats.find((s) => s.playerId === id)?.average3 ?? 0;
        const won = state.status === 'GAME_OVER' && state.winnerId === mySide?.id;
        const decided = state.status === 'GAME_OVER';
        return {
          m,
          state,
          stats,
          mySideId: mySide?.id ?? '',
          oppSideId: oppSide?.id ?? '',
          myLegs: state.legsWon[mySide?.id ?? ''] ?? 0,
          oppLegs: state.legsWon[oppSide?.id ?? ''] ?? 0,
          myAvg,
          won,
          decided,
          date: m.createdAt ?? '',
        };
      })
      .sort((a, b) => (a.date < b.date ? -1 : 1)); // chronological

    const overall = aggregatePlayerStats(
      mine.map((m) => ({ config: m.config, events: m.events })),
    ).find((s) => s.playerId === id);

    // personal records (best single-match figures)
    const bestMatchAvg = Math.max(0, ...per.map((p) => p.myAvg));
    const most180Match = Math.max(
      0,
      ...per.map((p) => p.stats.find((s) => s.playerId === id)?.count180 ?? 0),
    );

    // opponents ever faced (individual players on the other side)
    const opponents = new Map<string, string>();
    for (const p of per) {
      for (const part of p.m.config.participants) {
        if (part.id === p.mySideId) continue;
        for (const pid of part.playerIds) {
          if (!opponents.has(pid))
            opponents.set(
              pid,
              p.m.config.players.find((pl) => pl.id === pid)?.name ?? '—',
            );
        }
      }
    }

    return { mine, name, per, overall, bestMatchAvg, most180Match, opponents };
  }, [matches, id]);

  const trend = data.per.filter((p) => p.decided).map((p) => p.myAvg);

  // head-to-head vs the selected opponent
  const h2h = useMemo(() => {
    if (opponent === 'ALL') return null;
    const rows = data.per.filter((p) =>
      p.m.config.participants.some(
        (part) => part.id === p.oppSideId && part.playerIds.includes(opponent),
      ),
    );
    let wins = 0,
      legsFor = 0,
      legsAgainst = 0;
    let sumMyAvg = 0,
      sumOppAvg = 0,
      avgN = 0;
    for (const p of rows) {
      if (p.won) wins += 1;
      legsFor += p.myLegs;
      legsAgainst += p.oppLegs;
      const oppAvg = p.stats.find((s) => s.playerId === opponent)?.average3 ?? 0;
      if (p.myAvg || oppAvg) {
        sumMyAvg += p.myAvg;
        sumOppAvg += oppAvg;
        avgN += 1;
      }
    }
    const decided = rows.filter((p) => p.decided).length;
    return {
      rows: [...rows].reverse(),
      played: rows.length,
      wins,
      losses: decided - wins,
      legsFor,
      legsAgainst,
      avgFor: avgN ? sumMyAvg / avgN : 0,
      avgAgainst: avgN ? sumOppAvg / avgN : 0,
      name: data.opponents.get(opponent) ?? '—',
    };
  }, [opponent, data]);

  const historyDesc = [...data.per].reverse();
  const displayName = rosterName || data.name;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate('/admin/stats')}
          className="rounded-lg px-2 py-1 text-sm text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)]"
        >
          ← Statistics
        </button>
        <h2 className="text-2xl font-black">{displayName}</h2>
        <select
          value={seasonId}
          onChange={(e) => setSeasonId(e.target.value)}
          className="ml-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm outline-none"
        >
          <option value="">All seasons</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.isCurrent ? ' (current)' : ''}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="py-8 text-center text-[var(--color-text-dim)]">Loading…</p>
      ) : data.mine.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center text-[var(--color-text-dim)]">
          No championship match for this player in this period.
        </p>
      ) : (
        <>
          {/* overview */}
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Matches" value={`${data.overall?.matchesPlayed ?? 0}`} />
            <Metric
              label="Won / Lost"
              value={`${data.overall?.matchesWon ?? 0} / ${(data.overall?.matchesPlayed ?? 0) - (data.overall?.matchesWon ?? 0)}`}
            />
            <Metric
              label="Win rate"
              value={`${Math.round((data.overall?.winRatio ?? 0) * 100)}%`}
            />
            <Metric label="3-dart avg" value={(data.overall?.average3 ?? 0).toFixed(1)} accent />
          </div>

          {/* key stats */}
          <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
            <Metric small label="First 9" value={(data.overall?.first9Average ?? 0).toFixed(1)} />
            <Metric small label="180s" value={`${data.overall?.count180 ?? 0}`} />
            <Metric small label="140+" value={`${data.overall?.count140plus ?? 0}`} />
            <Metric small label="Best CO" value={`${data.overall?.bestCheckout ?? 0}`} />
            <Metric
              small
              label="Best leg"
              value={
                data.overall?.bestLegDarts != null && data.overall.bestLegDarts >= 9
                  ? `${data.overall.bestLegDarts}`
                  : '—'
              }
            />
            <Metric small label="Legs won" value={`${data.overall?.legsWon ?? 0}`} />
          </div>

          {/* average trend */}
          <Section title="Average over time (per match)">
            <Sparkline values={trend} />
          </Section>

          {/* personal records */}
          <Section title="Records">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Record label="Best checkout" value={`${data.overall?.bestCheckout ?? 0}`} />
              <Record label="Best match avg" value={data.bestMatchAvg.toFixed(1)} />
              <Record label="Most 180s (match)" value={`${data.most180Match}`} />
              <Record
                label="Best leg (darts)"
                value={
                  data.overall?.bestLegDarts != null && data.overall.bestLegDarts >= 9
                    ? `${data.overall.bestLegDarts}`
                    : '—'
                }
              />
            </div>
          </Section>

          {/* head-to-head */}
          <Section title="Head-to-head">
            <div className="mb-3 flex items-center gap-2 text-sm">
              <span className="text-[var(--color-text-dim)]">vs</span>
              <select
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 outline-none"
              >
                <option value="ALL">Select an opponent…</option>
                {[...data.opponents.entries()]
                  .sort((a, b) => a[1].localeCompare(b[1]))
                  .map(([pid, n]) => (
                    <option key={pid} value={pid}>
                      {n}
                    </option>
                  ))}
              </select>
            </div>

            {h2h && (
              <>
                <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  <Metric small label="Matches" value={`${h2h.played}`} />
                  <Metric small label="W – L" value={`${h2h.wins} – ${h2h.losses}`} />
                  <Metric small label="Legs" value={`${h2h.legsFor} – ${h2h.legsAgainst}`} />
                  <Metric small label={`${displayName} avg`} value={h2h.avgFor.toFixed(1)} />
                  <Metric small label={`${h2h.name} avg`} value={h2h.avgAgainst.toFixed(1)} />
                </div>
                <ul className="flex flex-col gap-1.5">
                  {h2h.rows.map((p) => (
                    <li key={p.m.id}>
                      <button
                        onClick={() => setDetailId(p.m.id)}
                        className="flex w-full items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-left text-sm transition-colors hover:border-[var(--color-accent)]"
                      >
                        <ResultBadge result={p.decided ? (p.won ? 'W' : 'L') : '…'} />
                        <span className="min-w-0 flex-1 truncate text-[var(--color-text-dim)]">
                          {p.date ? new Date(p.date).toLocaleDateString() : '—'} ·{' '}
                          {p.m.mode === 'DOUBLE' ? 'Doubles' : 'Singles'}
                        </span>
                        <span className="font-black tnum">
                          {p.myLegs}–{p.oppLegs}
                        </span>
                        <span className="text-[var(--color-text-dim)]">›</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Section>

          {/* match history */}
          <Section title={`Match history (${data.per.length})`}>
            <ul className="flex flex-col gap-1.5">
              {historyDesc.map((p) => (
                <li key={p.m.id}>
                  <button
                    onClick={() => setDetailId(p.m.id)}
                    className="flex w-full items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-left text-sm transition-colors hover:border-[var(--color-accent)]"
                  >
                    <ResultBadge result={p.decided ? (p.won ? 'W' : 'L') : '…'} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        vs {participantDisplay(p.m.config, p.oppSideId)}
                      </span>
                      <span className="text-xs text-[var(--color-text-dim)]">
                        {p.date ? new Date(p.date).toLocaleDateString() : '—'} ·{' '}
                        {p.m.mode === 'DOUBLE' ? 'Doubles' : 'Singles'}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-black tnum">
                        {p.myLegs}–{p.oppLegs}
                      </span>
                      <span className="text-xs text-[var(--color-text-dim)]">
                        avg {p.myAvg.toFixed(1)}
                      </span>
                    </span>
                    <span className="text-[var(--color-text-dim)]">›</span>
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}

      <MatchDetail
        match={data.mine.find((m) => m.id === detailId) ?? null}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[var(--color-surface)] p-3 text-center">
      <div className="text-[11px] uppercase tracking-wide text-[var(--color-text-dim)]">
        {label}
      </div>
      <div
        className={cn(
          'font-black tnum',
          small ? 'text-lg' : 'text-2xl',
          accent && 'text-[var(--color-accent)]',
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Record({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-center">
      <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-dim)]">
        {label}
      </div>
      <div className="text-xl font-black text-[var(--color-accent)] tnum">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-dim)]">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ResultBadge({ result }: { result: 'W' | 'L' | '…' }) {
  return (
    <span
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-black',
        result === 'W'
          ? 'bg-[var(--color-success-dim)] text-[var(--color-success)]'
          : result === 'L'
            ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
            : 'bg-[var(--color-surface-2)] text-[var(--color-text-dim)]',
      )}
    >
      {result}
    </span>
  );
}

/** Minimal dependency-free SVG line chart of a value series. */
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--color-border)] p-4 text-center text-xs text-[var(--color-text-dim)]">
        Not enough finished matches for a trend yet.
      </p>
    );
  }
  const w = 600;
  const h = 64;
  const pad = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const x = (i: number) => pad + (i / (values.length - 1)) * (w - 2 * pad);
  const y = (v: number) => pad + (1 - (v - min) / range) * (h - 2 * pad);
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = values.length - 1;
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex items-center justify-between text-[11px] text-[var(--color-text-dim)]">
        <span>max {max.toFixed(1)}</span>
        <span>{values.length} matches</span>
        <span>min {min.toFixed(1)}</span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="mt-1 w-full"
        style={{ height: 64 }}
      >
        <polyline
          points={points}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={x(last)} cy={y(values[last]!)} r="3" fill="var(--color-accent)" />
      </svg>
    </div>
  );
}
