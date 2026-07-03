import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { buildGameState } from '@/domain/engine';
import { listResumable } from '@/store/matchService';
import { listResumableEncounters } from '@/store/encounterService';
import { listLiveMatches } from '@/store/liveMatch';
import { useT, LangToggle } from '@/store/LangContext';
import { participantLabel } from '@/domain/presentation';
import type { EncounterRecord, MatchRecord } from '@/data/types';

export function HomeScreen() {
  const navigate = useNavigate();
  const { t } = useT();
  const [resumable, setResumable] = useState<MatchRecord[]>([]);
  const [encounters, setEncounters] = useState<EncounterRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    let alive = true;
    const refresh = () =>
      listLiveMatches().then((m) => alive && setLiveCount(m.length));
    void refresh();
    const poll = window.setInterval(() => void refresh(), 8000);
    return () => {
      alive = false;
      window.clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([listResumable(), listResumableEncounters()])
      .then(([m, e]) => {
        if (!alive) return;
        setResumable(m);
        setEncounters(e);
      })
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  const describe = (m: MatchRecord) => {
    const state = buildGameState(m.config, m.events);
    const sides = m.config.participants
      .map((p) => participantLabel(m.config, p.id))
      .join(' vs ');
    const legs = Object.values(state.legsWon).join(' – ');
    return { sides, legs };
  };

  return (
    <div className="relative mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-10 px-6 py-12">
      <div className="absolute right-4 top-4">
        <LangToggle />
      </div>
      <div className="text-center">
        <div className="mb-3 text-7xl">🎯</div>
        <h1 className="text-5xl font-black tracking-tight">
          DARTS<span className="text-[var(--color-accent)]">SCORE</span>
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-dim)]">
          {t('home.tagline')}
        </p>
      </div>

      {encounters.length > 0 && (
        <div className="w-full rounded-2xl border border-[var(--color-accent)] bg-[var(--color-surface)] p-5 shadow-[0_8px_40px_-12px_var(--color-accent)]">
          <p className="mb-3 text-lg font-bold">{t('home.champInProgress')}</p>
          <div className="flex flex-col gap-2">
            {encounters.map((e) => (
              <button
                key={e.id}
                onClick={() => navigate(`/championship/${e.id}`)}
                className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-left transition-colors hover:border-[var(--color-accent)]"
              >
                <span>
                  <span className="block font-semibold">
                    {e.plan.teams.A.name} vs {e.plan.teams.B.name}
                  </span>
                  <span className="text-xs text-[var(--color-text-dim)]">
                    {e.scoreA} – {e.scoreB} · {t('home.match')}{' '}
                    {Math.min(e.currentIndex + 1, e.plan.fixtures.length)}/
                    {e.plan.fixtures.length}
                  </span>
                </span>
                <span className="text-sm font-bold text-[var(--color-accent)]">
                  {t('home.resume')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {resumable.length > 0 && (
        <div className="w-full rounded-2xl border border-[var(--color-accent)] bg-[var(--color-surface)] p-5 shadow-[0_8px_40px_-12px_var(--color-accent)]">
          <p className="mb-3 text-lg font-bold">
            {resumable.length === 1
              ? t('home.gameInProgress')
              : `${resumable.length} ${t('home.gamesInProgress')}`}
          </p>
          <div className="flex flex-col gap-2">
            {resumable.map((m) => {
              const { sides, legs } = describe(m);
              return (
                <button
                  key={m.id}
                  onClick={() => navigate(`/game/${m.id}`)}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-left transition-colors hover:border-[var(--color-accent)]"
                >
                  <span>
                    <span className="block font-semibold">{sides}</span>
                    <span className="text-xs text-[var(--color-text-dim)]">
                      {m.variant} {m.mode === 'DOUBLE' ? 'Doubles' : 'Singles'} ·
                      legs {legs}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-[var(--color-accent)]">
                    {t('home.resume')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Button
        variant="accent"
        size="xl"
        fullWidth
        onClick={() => navigate('/new')}
      >
        {t('home.new')}
      </Button>

      <Button
        variant="surface"
        size="xl"
        fullWidth
        onClick={() => navigate('/championship/new')}
      >
        {t('home.championship')}
      </Button>

      <Button
        variant="surface"
        size="lg"
        fullWidth
        onClick={() => navigate('/live')}
      >
        {t('home.live')}
        {liveCount > 0 && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-xs font-bold text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            {liveCount}
          </span>
        )}
      </Button>

      <Button
        variant="surface"
        size="lg"
        fullWidth
        onClick={() => navigate('/live/tv')}
      >
        {t('home.tv')}
      </Button>

      <Button
        variant="surface"
        size="lg"
        fullWidth
        onClick={() => navigate('/admin')}
      >
        {t('home.admin')}
      </Button>

      {!loaded && (
        <p className="text-xs text-[var(--color-text-mute)]">{t('home.syncing')}</p>
      )}
    </div>
  );
}
