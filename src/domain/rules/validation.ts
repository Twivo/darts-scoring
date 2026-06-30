/**
 * Input validation for a typed visit score (501/601 Double Out).
 *
 * Unlike the engine's defensive bust handling, this validates user INPUT
 * before it is recorded: an overshoot or a score that leaves 1 is treated as
 * a typing mistake and blocked with a clear message (real busts are entered
 * via the dedicated BUST button instead).
 */
import { MAX_VISIT_SCORE } from './bust';
import { minDartsToCheckout } from './checkout';

export type VisitErrorCode =
  | 'SCORE_RANGE' // not an integer in 0..180
  | 'OVER_REMAINING' // scored more than what's left
  | 'LEAVES_ONE' // would leave exactly 1 (impossible to finish)
  | 'INVALID_CHECKOUT'; // exact finish on a non-checkoutable number

export interface VisitValidation {
  ok: boolean;
  code?: VisitErrorCode;
  /** True when the (valid) score finishes the leg. */
  isCheckout: boolean;
}

export function validateVisitInput(
  remainingBefore: number,
  gross: number,
): VisitValidation {
  if (!Number.isInteger(gross) || gross < 0 || gross > MAX_VISIT_SCORE) {
    return { ok: false, code: 'SCORE_RANGE', isCheckout: false };
  }
  if (gross > remainingBefore) {
    return { ok: false, code: 'OVER_REMAINING', isCheckout: false };
  }
  const after = remainingBefore - gross;
  if (after === 1) {
    return { ok: false, code: 'LEAVES_ONE', isCheckout: false };
  }
  if (after === 0 && minDartsToCheckout(remainingBefore) === null) {
    return { ok: false, code: 'INVALID_CHECKOUT', isCheckout: false };
  }
  return { ok: true, isCheckout: after === 0 };
}

/** Human-readable (English) message for an error code. */
export function visitErrorMessage(
  code: VisitErrorCode,
  remainingBefore: number,
): string {
  switch (code) {
    case 'SCORE_RANGE':
      return 'Score must be between 0 and 180.';
    case 'OVER_REMAINING':
      return `Score is higher than what's left (${remainingBefore}).`;
    case 'LEAVES_ONE':
      return 'Cannot leave 1 — a double is required to finish.';
    case 'INVALID_CHECKOUT':
      return `${remainingBefore} cannot be checked out.`;
  }
}

/** A player is "on a finish" when the remaining can be checked out in one visit. */
export function isOnFinish(remaining: number): boolean {
  return remaining <= 170 && minDartsToCheckout(remaining) !== null;
}
