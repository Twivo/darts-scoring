import { describe, it, expect } from 'vitest';
import {
  buildEncounterState,
  computeBlocks,
  createFixtures,
  totalFixtures,
  withFixtureComposition,
  withFixtureWinner,
} from '../encounter';
import { DEFAULT_ENCOUNTER_SETTINGS, ENCOUNTER_FORMAT } from '../format';
import type { EncounterPlan } from '../types';

function basePlan(): EncounterPlan {
  return {
    format: ENCOUNTER_FORMAT,
    settings: DEFAULT_ENCOUNTER_SETTINGS,
    teams: {
      A: { id: 'ta', name: 'Team A', players: [] },
      B: { id: 'tb', name: 'Team B', players: [] },
    },
    fixtures: createFixtures(ENCOUNTER_FORMAT),
  };
}

/** Compose every fixture of a block with placeholder players. */
function composeBlock(plan: EncounterPlan, start: number, end: number): EncounterPlan {
  let p = plan;
  for (let i = start; i < end; i++) {
    const kind = p.fixtures[i]!.kind;
    const a = kind === 'DOUBLE' ? ['a1', 'a2'] : ['a1'];
    const b = kind === 'DOUBLE' ? ['b1', 'b2'] : ['b1'];
    p = withFixtureComposition(p, i, a, b);
  }
  return p;
}

describe('encounter format', () => {
  it('is 10 matches: 4 singles, 2 doubles, 4 singles', () => {
    expect(totalFixtures(ENCOUNTER_FORMAT)).toBe(10);
    const blocks = computeBlocks(ENCOUNTER_FORMAT);
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toMatchObject({ kind: 'SINGLE', start: 0, end: 4 });
    expect(blocks[1]).toMatchObject({ kind: 'DOUBLE', start: 4, end: 6 });
    expect(blocks[2]).toMatchObject({ kind: 'SINGLE', start: 6, end: 10 });
  });
});

describe('encounter state machine', () => {
  it('asks to compose the first singles block before playing', () => {
    const s = buildEncounterState(basePlan(), 0);
    expect(s.phase).toBe('COMPOSE');
    expect(s.composeBlock).toMatchObject({ start: 0, end: 4 });
  });

  it('plays once the current block is composed', () => {
    const plan = composeBlock(basePlan(), 0, 4);
    const s = buildEncounterState(plan, 0);
    expect(s.phase).toBe('PLAY');
    expect(s.currentFixture?.index).toBe(0);
  });

  it('shows MATCH_DONE after a fixture has a winner', () => {
    let plan = composeBlock(basePlan(), 0, 4);
    plan = withFixtureWinner(plan, 0, 'A');
    const s = buildEncounterState(plan, 0);
    expect(s.phase).toBe('MATCH_DONE');
    expect(s.scoreA).toBe(1);
    expect(s.remaining).toBe(9);
  });

  it('requires composing the doubles block when reaching index 4', () => {
    let plan = composeBlock(basePlan(), 0, 4);
    for (let i = 0; i < 4; i++) plan = withFixtureWinner(plan, i, 'A');
    const s = buildEncounterState(plan, 4);
    expect(s.phase).toBe('COMPOSE');
    expect(s.composeBlock).toMatchObject({ kind: 'DOUBLE', start: 4, end: 6 });
  });

  it('reaches FINAL with the right winner after 10 matches', () => {
    let plan = composeBlock(basePlan(), 0, 4);
    plan = composeBlock(plan, 4, 6);
    plan = composeBlock(plan, 6, 10);
    // A wins 6, B wins 4
    for (let i = 0; i < 10; i++) plan = withFixtureWinner(plan, i, i < 6 ? 'A' : 'B');
    const s = buildEncounterState(plan, 10);
    expect(s.phase).toBe('FINAL');
    expect(s.scoreA).toBe(6);
    expect(s.scoreB).toBe(4);
    expect(s.finalWinner).toBe('A');
  });
});
