/**
 * Game store provider. Holds { config, events } in a reducer, derives the
 * full GameState via the engine (memoized), and auto-saves the match after
 * every change (local cache + cloud, transparently).
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { buildGameState } from '@/domain/engine';
import {
  makeBust,
  makeGameForfeit,
  makeLegForfeit,
  makeVisit,
} from '@/domain/events';
import type { GameConfig, GameEvent, GameState } from '@/domain/types';
import type { MatchRecord } from '@/data/types';
import { forgetCachedMatch, persistMatch } from './matchService';
import { gameReducer, type GameStore } from './reducer';

interface GameContextValue {
  config: GameConfig;
  events: GameEvent[];
  state: GameState;
  /** Add a normal scoring visit for the currently active thrower. */
  addVisit: (scored: number, darts?: number) => void;
  /** Add a bust for the currently active thrower. */
  addBust: (darts?: number) => void;
  forfeitLeg: (participantId: string) => void;
  forfeitGame: (participantId: string) => void;
  undo: () => void;
  editVisit: (eventId: string, scored: number, darts?: number) => void;
  deleteEvent: (eventId: string) => void;
  endGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({
  matchId,
  seasonId,
  config,
  initialEvents,
  encounterId,
  fixtureIndex,
  onEnd,
  children,
}: {
  matchId: string;
  seasonId: string;
  config: GameConfig;
  initialEvents: GameEvent[];
  /** Championship link, preserved on every auto-save. */
  encounterId?: string | null;
  fixtureIndex?: number | null;
  onEnd?: () => void;
  children: ReactNode;
}) {
  const [store, dispatch] = useReducer(gameReducer, {
    config,
    events: initialEvents,
  } satisfies GameStore);

  // Derived state — recomputed from scratch whenever events change.
  const state = useMemo(
    () => buildGameState(store.config, store.events),
    [store.config, store.events],
  );

  // Transparent auto-save after every change to the source of truth.
  useEffect(() => {
    const record: MatchRecord = {
      id: matchId,
      seasonId,
      config: store.config,
      events: store.events,
      mode: store.config.mode,
      variant: store.config.variant,
      status: state.status === 'GAME_OVER' ? 'GAME_OVER' : 'IN_PROGRESS',
      winnerParticipant: state.winnerId ?? null,
      encounterId: encounterId ?? null,
      fixtureIndex: fixtureIndex ?? null,
      finishedAt:
        state.status === 'GAME_OVER' ? new Date().toISOString() : null,
    };
    void persistMatch(record);
  }, [
    matchId,
    seasonId,
    store.config,
    store.events,
    state.status,
    state.winnerId,
    encounterId,
    fixtureIndex,
  ]);

  const value = useMemo<GameContextValue>(() => {
    const append = (event: GameEvent) =>
      dispatch({ type: 'APPEND_EVENT', event });

    return {
      config: store.config,
      events: store.events,
      state,
      addVisit: (scored, darts) => {
        if (state.status !== 'IN_PROGRESS') return;
        append(
          makeVisit({
            participantId: state.activeParticipantId,
            playerId: state.activePlayerId,
            scored,
            darts,
          }),
        );
      },
      addBust: (darts) => {
        if (state.status !== 'IN_PROGRESS') return;
        append(
          makeBust({
            participantId: state.activeParticipantId,
            playerId: state.activePlayerId,
            darts,
          }),
        );
      },
      forfeitLeg: (participantId) =>
        append(makeLegForfeit(participantId)),
      forfeitGame: (participantId) =>
        append(makeGameForfeit(participantId)),
      undo: () => dispatch({ type: 'UNDO' }),
      editVisit: (eventId, scored, darts) =>
        dispatch({ type: 'EDIT_VISIT', eventId, scored, darts }),
      deleteEvent: (eventId) =>
        dispatch({ type: 'DELETE_EVENT', eventId }),
      endGame: () => {
        forgetCachedMatch(matchId);
        onEnd?.();
      },
    };
  }, [store.config, store.events, state, onEnd, matchId]);

  return (
    <GameContext.Provider value={value}>{children}</GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
