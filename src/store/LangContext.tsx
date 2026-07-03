/**
 * Lightweight FR / EN internationalisation. A tiny dictionary + `t(key)` hook.
 * The chosen language is a UI preference (kept in localStorage — not match
 * data), defaulting to the browser language. Covers the player-facing flows
 * (home, live, TV); `t` falls back to the key so untranslated strings are safe.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';

export type Lang = 'fr' | 'en';
const KEY = 'darts:lang';

const DICT: Record<string, { en: string; fr: string }> = {
  'home.tagline': {
    en: 'Match scoring — 501 / 601 Double Out',
    fr: 'Scoring de match — 501 / 601 Double Out',
  },
  'home.new': { en: 'New game', fr: 'Nouvelle partie' },
  'home.championship': { en: '🏆 Championship match', fr: '🏆 Match de championnat' },
  'home.live': { en: '📺 Watch live', fr: '📺 En direct' },
  'home.tv': { en: '📺 Club TV mode', fr: '📺 Mode TV du club' },
  'home.admin': { en: 'Admin', fr: 'Admin' },
  'home.resume': { en: 'Resume →', fr: 'Reprendre →' },
  'home.gameInProgress': { en: 'Game in progress', fr: 'Partie en cours' },
  'home.gamesInProgress': { en: 'games in progress', fr: 'parties en cours' },
  'home.champInProgress': {
    en: '🏆 Championship in progress',
    fr: '🏆 Championnat en cours',
  },
  'home.match': { en: 'match', fr: 'match' },
  'home.syncing': { en: 'Syncing…', fr: 'Synchronisation…' },
  'common.home': { en: '← Home', fr: '← Accueil' },
  'common.loading': { en: 'Loading…', fr: 'Chargement…' },
  'live.title': { en: '📺 Live matches', fr: '📺 Matchs en direct' },
  'live.none': {
    en: 'No match is being played right now.',
    fr: 'Aucun match en cours pour le moment.',
  },
  'live.back': { en: '← Live matches', fr: '← Matchs en direct' },
  'live.gone': {
    en: 'This match is no longer available.',
    fr: 'Ce match n’est plus disponible.',
  },
  'live.championship': { en: 'championship', fr: 'championnat' },
  'live.finished': {
    en: '🏆 Championship finished — see the full recap below.',
    fr: '🏆 Championnat terminé — voir le récapitulatif ci-dessous.',
  },
  'live.waiting': {
    en: 'Match finished — waiting for the next match…',
    fr: 'Match terminé — en attente du match suivant…',
  },
  'live.scan': { en: 'Scan to watch live', fr: 'Scanne pour suivre en direct' },
  'tv.title': { en: 'Club TV', fr: 'TV du club' },
  'tv.exit': { en: 'Exit', fr: 'Quitter' },
  'tv.live': { en: 'live', fr: 'en direct' },
  'tv.idle': {
    en: 'No live match right now',
    fr: 'Aucun match en direct pour le moment',
  },
  'tv.idleHint': {
    en: 'This screen updates automatically when a match starts.',
    fr: 'Cet écran se met à jour automatiquement quand un match démarre.',
  },
};

interface LangValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}
const LangContext = createContext<LangValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s === 'fr' || s === 'en') return s;
    } catch {
      /* ignore */
    }
    return typeof navigator !== 'undefined' &&
      navigator.language?.toLowerCase().startsWith('fr')
      ? 'fr'
      : 'en';
  });
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  }, []);
  const t = useCallback((key: string) => DICT[key]?.[lang] ?? key, [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useT(): LangValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useT must be used within a LangProvider');
  return ctx;
}

/** FR / EN switch. */
export function LangToggle() {
  const { lang, setLang } = useT();
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-[var(--color-border)] text-xs">
      {(['fr', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            'px-2.5 py-1 font-bold uppercase transition-colors',
            lang === l
              ? 'bg-[var(--color-accent)] text-white'
              : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
