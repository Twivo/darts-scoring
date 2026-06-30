import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/store/GameContext';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { playerName } from '@/domain/presentation';
import {
  isOnFinish,
  validateVisitInput,
  visitErrorMessage,
} from '@/domain/rules/validation';
import { minDartsToCheckout } from '@/domain/rules/checkout';
import { StatsScreen } from '@/features/stats/StatsScreen';
import { Header } from './Header';
import { ScoreBoard } from './ScoreBoard';
import { FinishControls } from './FinishControls';
import { Keypad } from './Keypad';
import { LegEndModal } from './LegEndModal';
import { VisitHistory } from './VisitHistory';
import { EditVisitModal } from './EditVisitModal';

export function GameScreen() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { config, state, addVisit, addBust, undo, forfeitLeg, forfeitGame } =
    useGame();

  const [buffer, setBuffer] = useState('');
  const [pendingCheckout, setPendingCheckout] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (state.status === 'GAME_OVER') {
    return <StatsScreen />;
  }

  const activeId = state.activeParticipantId;
  const remainingBefore = state.remaining[activeId] ?? 0;
  const legNumber = state.currentLegIndex + 1;

  const parsed = buffer === '' ? null : parseInt(buffer, 10);

  // A visit can never score more than 180, so anything above that can only be
  // an entry of the REMAINING score (type-the-remaining), not a score thrown.
  const isRemainingEntry = parsed !== null && parsed > 180;

  // Score interpretation: buffer = points SCORED this visit (live decrement).
  const scoreValidation =
    parsed !== null && !isRemainingEntry
      ? validateVisitInput(remainingBefore, parsed)
      : null;

  // Remaining interpretation: buffer = the REMAINING after the visit.
  const remainingValidation =
    parsed !== null
      ? validateVisitInput(remainingBefore, remainingBefore - parsed)
      : null;
  const leaveEnabled = !!remainingValidation?.ok;

  const liveRemaining =
    parsed === null
      ? remainingBefore
      : isRemainingEntry
        ? parsed
        : remainingBefore - parsed;

  let error: string | null = null;
  if (parsed !== null) {
    if (isRemainingEntry) {
      if (!remainingValidation?.ok) {
        error =
          parsed > remainingBefore
            ? `You can't leave more than ${remainingBefore}.`
            : parsed === 1
              ? 'Cannot leave 1 — a double is required.'
              : 'That visit would exceed 180.';
      }
    } else if (scoreValidation && !scoreValidation.ok && scoreValidation.code) {
      error = visitErrorMessage(scoreValidation.code, remainingBefore);
    }
  }

  const onFinish = isOnFinish(remainingBefore);
  const finishMinDarts = minDartsToCheckout(remainingBefore) ?? 3;

  // --- input -------------------------------------------------------------
  const onDigit = (d: string) => {
    setBuffer((b) => {
      const next = (b + d).replace(/^0+(?=\d)/, '');
      return next.length > 3 ? b : next;
    });
  };
  const onBackspace = () => setBuffer((b) => b.slice(0, -1));

  /** Validate and record a gross visit score (or open the checkout modal). */
  const commitGross = (gross: number) => {
    const v = validateVisitInput(remainingBefore, gross);
    if (!v.ok) {
      setBuffer(String(gross)); // surface the failing score + its error
      return;
    }
    if (v.isCheckout) {
      setPendingCheckout(gross);
      setBuffer('');
      return;
    }
    addVisit(gross);
    setBuffer('');
  };

  /** Commit the buffer as the REMAINING after the visit (type-the-remaining). */
  const commitRemaining = () => {
    if (parsed === null || !leaveEnabled) return;
    commitGross(remainingBefore - parsed);
  };

  /**
   * Primary commit (VALIDATE / central tap / ✓): interprets the buffer as a
   * score thrown, unless it's > 180 in which case it can only be a remaining.
   */
  const commitSmart = () => {
    if (parsed === null) return;
    if (isRemainingEntry) commitRemaining();
    else commitGross(parsed);
  };

  const confirmCheckout = (darts: number) => {
    if (pendingCheckout === null) return;
    addVisit(pendingCheckout, darts);
    setPendingCheckout(null);
  };

  /** Long-press finish: close the leg with the held number of darts. */
  const finishWith = (darts: number) => {
    if (!onFinish || darts < finishMinDarts) return;
    addVisit(remainingBefore, darts);
    setBuffer('');
  };

  /** Miss in a finish: a no-score visit (0), not a bust. */
  const onMiss = () => {
    addVisit(0, 3);
    setBuffer('');
  };

  const onBust = () => {
    addBust();
    setBuffer('');
  };

  // --- forfeits ----------------------------------------------------------
  const forfeitCurrentLeg = async () => {
    const ok = await confirm({
      title: 'Forfeit this leg?',
      message: `The leg will be awarded to the opponent. ${playerName(
        config,
        state.activePlayerId,
      )} forfeits.`,
      danger: true,
      confirmLabel: 'Forfeit leg',
    });
    if (ok) {
      forfeitLeg(activeId);
      setBuffer('');
    }
  };

  const forfeitCurrentGame = async () => {
    const ok = await confirm({
      title: 'Forfeit the match?',
      message:
        'The match ends immediately. The opponent wins and partial stats are generated.',
      danger: true,
      confirmLabel: 'Forfeit match',
    });
    if (ok) forfeitGame(activeId);
  };

  return (
    <div className="mx-auto flex h-[100dvh] max-w-6xl flex-col bg-[var(--color-bg)]">
      {/* top control bar (compact single line) */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-xs">
        <button
          onClick={() => navigate('/')}
          className="rounded-md px-2 py-1 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)]"
        >
          ← Home
        </button>
        <div className="flex items-center gap-0.5">
          <button
            onClick={undo}
            className="rounded-md px-2 py-1 font-semibold hover:bg-[var(--color-surface-2)]"
          >
            ↩ Undo
          </button>
          <button
            onClick={forfeitCurrentLeg}
            className="rounded-md px-2 py-1 text-[var(--color-warning)] hover:bg-[var(--color-surface-2)]"
          >
            Forfeit leg
          </button>
          <button
            onClick={forfeitCurrentGame}
            className="rounded-md px-2 py-1 text-[var(--color-accent)] hover:bg-[var(--color-surface-2)]"
          >
            Forfeit match
          </button>
        </div>
      </div>

      <Header />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* scores + finish + history (right under the remaining score) */}
        <div className="flex min-h-0 flex-1 flex-col">
          <ScoreBoard
            liveRemaining={liveRemaining}
            hasInput={parsed !== null}
            error={error}
            onCommit={commitRemaining}
          />
          {onFinish && (
            <FinishControls
              minDarts={finishMinDarts}
              onFinishWith={finishWith}
              onMiss={onMiss}
            />
          )}
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-[var(--color-border)]">
            <VisitHistory onEdit={(id) => setEditingId(id)} />
          </div>
        </div>

        {/* keypad */}
        <div className="shrink-0 border-t border-[var(--color-border)] lg:flex lg:w-[440px] lg:flex-col lg:justify-center lg:border-l lg:border-t-0">
          <Keypad
            buffer={buffer}
            remainingBefore={remainingBefore}
            onDigit={onDigit}
            onBackspace={onBackspace}
            onCommit={commitSmart}
            onQuickScore={commitGross}
            onBust={onBust}
          />
        </div>
      </div>

      <LegEndModal
        open={pendingCheckout !== null}
        playerName={playerName(config, state.activePlayerId)}
        legNumber={legNumber}
        checkoutScore={pendingCheckout ?? 0}
        onConfirm={confirmCheckout}
        onCancel={() => setPendingCheckout(null)}
      />

      <EditVisitModal eventId={editingId} onClose={() => setEditingId(null)} />
    </div>
  );
}
