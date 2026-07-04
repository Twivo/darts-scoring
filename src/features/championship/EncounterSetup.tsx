import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { getRepository } from '@/data';
import type { TeamWithPlayers } from '@/data/types';
import { useRoster } from '@/store/RosterContext';
import { createEncounter, persistEncounter } from '@/store/encounterService';
import type { TeamSnapshot } from '@/domain/championship/types';

function isJedisTeam(team: TeamWithPlayers) {
  return team.name.trim().toLowerCase().includes('jedis');
}

export function EncounterSetup() {
  const navigate = useNavigate();
  const repo = useMemo(() => getRepository(), []);
  const { players } = useRoster();

  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const autoSelectedHome = useRef(false);

  useEffect(() => {
    void repo
      .listTeams()
      .then(setTeams)
      .catch(() => setTeams([]));
  }, [repo]);

  useEffect(() => {
    if (autoSelectedHome.current || teamAId || teams.length === 0) return;
    const jedis = teams.find(isJedisTeam);
    if (!jedis) return;

    autoSelectedHome.current = true;
    setTeamAId(jedis.id);
    if (teamBId === jedis.id) setTeamBId('');
  }, [teamAId, teamBId, teams]);

  const jediTeamId = useMemo(
    () => teams.find(isJedisTeam)?.id ?? '',
    [teams],
  );

  const snapshot = (t: TeamWithPlayers): TeamSnapshot => ({
    id: t.id,
    name: t.name,
    players: t.playerIds.map((id) => ({
      id,
      name: players.find((p) => p.id === id)?.name ?? '???',
    })),
  });

  const teamA = teams.find((t) => t.id === teamAId);
  const teamB = teams.find((t) => t.id === teamBId);
  const valid =
    teamA && teamB && teamAId !== teamBId &&
    teamA.playerIds.length >= 4 && teamB.playerIds.length >= 4;

  const hint = !teamA || !teamB
    ? 'Pick both teams.'
    : teamAId === teamBId
      ? 'Teams must be different.'
      : teamA.playerIds.length < 4 || teamB.playerIds.length < 4
        ? 'Each team needs at least 4 players (add them under Admin → Teams).'
        : null;

  const start = async () => {
    if (!valid || !teamA || !teamB || busy) return;
    setBusy(true);
    setError(null);
    try {
      const season = await repo.getCurrentSeason();
      if (!season) throw new Error('No current season.');
      const encounter = createEncounter(
        season.id,
        snapshot(teamA),
        snapshot(teamB),
      );
      await persistEncounter(encounter);
      navigate(`/championship/${encounter.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create encounter');
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-5 py-6">
      <header className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold">Championship match</h1>
      </header>

      <p className="mb-4 text-sm text-[var(--color-text-dim)]">
        Team tie — 4 singles, 2 doubles, 4 singles (10 matches), first to 2 legs.
      </p>

      <TeamPicker
        label="Home team"
        teams={teams}
        value={teamAId}
        exclude={teamBId}
        featuredId={jediTeamId}
        preferFeatured
        onChange={setTeamAId}
      />
      <div className="my-3 text-center text-sm font-bold text-[var(--color-text-dim)]">
        vs
      </div>
      <TeamPicker
        label="Opponent"
        teams={teams}
        value={teamBId}
        exclude={teamAId}
        featuredId={jediTeamId}
        onChange={setTeamBId}
      />

      {teams.length === 0 && (
        <p className="mt-4 text-center text-sm text-[var(--color-warning)]">
          No teams yet — create them under Admin → Teams.
        </p>
      )}
      {hint && teams.length > 0 && (
        <p className="mt-4 text-center text-sm text-[var(--color-warning)]">
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-3 text-center text-sm text-[var(--color-accent)]">
          {error}
        </p>
      )}

      <Button
        variant="accent"
        size="xl"
        fullWidth
        className="mt-6"
        disabled={!valid || busy}
        onClick={start}
      >
        {busy ? 'Creating…' : 'Compose first singles →'}
      </Button>
    </div>
  );
}

function TeamPicker({
  label,
  teams,
  value,
  exclude,
  featuredId,
  preferFeatured = false,
  onChange,
}: {
  label: string;
  teams: TeamWithPlayers[];
  value: string;
  exclude: string;
  featuredId?: string;
  preferFeatured?: boolean;
  onChange: (id: string) => void;
}) {
  const orderedTeams = [...teams].sort((a, b) => {
    const aFeatured = a.id === featuredId;
    const bFeatured = b.id === featuredId;
    if (aFeatured !== bFeatured) {
      if (preferFeatured) return aFeatured ? -1 : 1;
      return aFeatured ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-dim)]">
        {label}
      </h2>
      <div className="flex flex-col gap-2">
        {orderedTeams.map((t) => {
          const featured = t.id === featuredId;
          const selected = value === t.id;
          const subdued =
            !selected && !!featuredId && (preferFeatured ? !featured : featured);

          return (
            <button
              key={t.id}
              disabled={t.id === exclude}
              onClick={() => onChange(t.id)}
              className={cn(
                'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all disabled:opacity-30',
                selected
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                  : featured && preferFeatured
                    ? 'border-[var(--color-accent)] bg-[var(--color-surface-2)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]',
                subdued && 'opacity-70',
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate font-semibold">{t.name}</span>
                {featured && (
                  <span
                    className={cn(
                      'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      selected
                        ? 'bg-white/20 text-white'
                        : 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
                    )}
                  >
                    Home
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'shrink-0 text-xs',
                  selected ? 'text-white/80' : 'text-[var(--color-text-dim)]',
                )}
              >
                {t.playerIds.length} players
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
