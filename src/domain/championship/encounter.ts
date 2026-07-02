/**
 * Championship encounter state machine — pure and testable.
 *
 * The encounter drives a fixed sequence of fixtures (composition blocks derived
 * from the format). Each played fixture reuses the normal match engine; here we
 * only orchestrate composition → play → per-match stats → next → final.
 */
import type {
  ComposeBlock,
  EncounterPlan,
  EncounterState,
  Fixture,
  FixtureFormatSlot,
  Side,
} from './types';

export function totalFixtures(format: FixtureFormatSlot[]): number {
  return format.reduce((s, f) => s + f.count, 0);
}

/** Composition blocks (one per format slot): [singles 0-3][doubles 4-5][singles 6-9]. */
export function computeBlocks(format: FixtureFormatSlot[]): ComposeBlock[] {
  const blocks: ComposeBlock[] = [];
  let start = 0;
  format.forEach((slot, slotIndex) => {
    blocks.push({ slotIndex, kind: slot.kind, start, end: start + slot.count });
    start += slot.count;
  });
  return blocks;
}

/** Empty fixtures for a format (compositions filled in later, block by block). */
export function createFixtures(format: FixtureFormatSlot[]): Fixture[] {
  const fixtures: Fixture[] = [];
  let index = 0;
  for (const slot of format) {
    for (let k = 0; k < slot.count; k++) {
      fixtures.push({
        index: index++,
        kind: slot.kind,
        aPlayerIds: [],
        bPlayerIds: [],
        matchId: null,
        winner: null,
      });
    }
  }
  return fixtures;
}

function blockAt(blocks: ComposeBlock[], index: number): ComposeBlock | null {
  return blocks.find((b) => index >= b.start && index < b.end) ?? null;
}

export function isBlockComposed(plan: EncounterPlan, block: ComposeBlock): boolean {
  return plan.fixtures
    .slice(block.start, block.end)
    .every((f) => f.aPlayerIds.length > 0 && f.bPlayerIds.length > 0);
}

export function buildEncounterState(
  plan: EncounterPlan,
  currentIndex: number,
): EncounterState {
  const blocks = computeBlocks(plan.format);
  const total = plan.fixtures.length;
  const played = plan.fixtures.filter((f) => f.winner !== null).length;
  const scoreA = plan.fixtures.filter((f) => f.winner === 'A').length;
  const scoreB = plan.fixtures.filter((f) => f.winner === 'B').length;

  if (currentIndex >= total) {
    const finalWinner: Side | 'DRAW' =
      scoreA === scoreB ? 'DRAW' : scoreA > scoreB ? 'A' : 'B';
    return {
      phase: 'FINAL',
      total,
      played,
      remaining: 0,
      scoreA,
      scoreB,
      currentIndex,
      currentFixture: null,
      composeBlock: null,
      finalWinner,
    };
  }

  const fixture = plan.fixtures[currentIndex]!;
  const block = blockAt(blocks, currentIndex)!;
  let phase: EncounterState['phase'];
  let composeBlock: ComposeBlock | null = null;

  if (fixture.winner !== null) {
    phase = 'MATCH_DONE';
  } else if (!isBlockComposed(plan, block)) {
    phase = 'COMPOSE';
    composeBlock = block;
  } else {
    phase = 'PLAY';
  }

  return {
    phase,
    total,
    played,
    remaining: total - played,
    scoreA,
    scoreB,
    currentIndex,
    currentFixture: fixture,
    composeBlock,
    finalWinner: null,
  };
}

/** Immutably set a fixture's winner (called when its match finishes). */
export function withFixtureWinner(
  plan: EncounterPlan,
  index: number,
  winner: Side,
): EncounterPlan {
  return {
    ...plan,
    fixtures: plan.fixtures.map((f) => (f.index === index ? { ...f, winner } : f)),
  };
}

/** Immutably compose a fixture (assign players + a match id). */
export function withFixtureComposition(
  plan: EncounterPlan,
  index: number,
  aPlayerIds: string[],
  bPlayerIds: string[],
): EncounterPlan {
  return {
    ...plan,
    fixtures: plan.fixtures.map((f) =>
      f.index === index ? { ...f, aPlayerIds, bPlayerIds } : f,
    ),
  };
}

/** Compose several fixtures at once (a whole block). */
export function withFixtureCompositionMany(
  plan: EncounterPlan,
  compositions: { index: number; a: string[]; b: string[] }[],
): EncounterPlan {
  const byIndex = new Map(compositions.map((c) => [c.index, c]));
  return {
    ...plan,
    fixtures: plan.fixtures.map((f) => {
      const c = byIndex.get(f.index);
      return c ? { ...f, aPlayerIds: c.a, bPlayerIds: c.b } : f;
    }),
  };
}
