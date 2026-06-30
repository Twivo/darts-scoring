/**
 * Game store provider. Holds { config, events } in a reducer, derives the
 * full GameState via the engine (memoized), and auto-saves to LocalStorage
 * after every change.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
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
import { clearGame, saveGame } from './persistence';
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
  config,
  initialEvents,
  onEnd,
  children,
}: {
  config: GameConfig;
  initialEvents: GameEvent[];
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

  // Auto-save after every change to the source of truth.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
    }
    saveGame(store.config, store.events);
  }, [store.config, store.events]);

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
        clearGame();
        onEnd?.();
      },
    };
  }, [store.config, store.events, state, onEnd]);

  return (
    <GameContext.Provider value={value}>{children}</GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
