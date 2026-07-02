/**
 * Championship encounter persistence & orchestration helpers.
 *
 * The database is the single source of truth — nothing is cached locally.
 * Encounter saves happen at discrete transitions (compose / advance), so a
 * failed write is retried a few times before surfacing. Each fixture reuses
 * the normal match engine.
 */
import { getRepository } from '@/data';
import type { EncounterRecord } from '@/data/types';
import { persistMatch } from '@/store/matchService';
import { createId, createUuid } from '@/lib/id';
import {
  ENCOUNTER_FORMAT,
  DEFAULT_ENCOUNTER_SETTINGS,
} from '@/domain/championship/format';
import {
  createFixtures,
  withFixtureCompositionMany,
  withFixtureWinner,
} from '@/domain/championship/encounter';
import type {
  ComposeBlock,
  Fixture,
  Side,
  TeamSnapshot,
} from '@/domain/championship/types';
import type { GameConfig } from '@/domain/types';

/** Save to the DB, retrying a few times to ride out a brief network blip. */
export async function persistEncounter(record: EncounterRecord): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await getRepository().saveEncounter(record);
      return;
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function loadEncounter(
  id: string,
): Promise<EncounterRecord | null> {
  try {
    return await getRepository().getEncounter(id);
  } catch {
    return null;
  }
}

export async function listResumableEncounters(): Promise<EncounterRecord[]> {
  try {
    return await getRepository().listEncountersInProgress();
  } catch {
    return [];
  }
}

export function createEncounter(
  seasonId: string,
  teamA: TeamSnapshot,
  teamB: TeamSnapshot,
): EncounterRecord {
  return {
    id: createUuid(),
    seasonId,
    teamAId: teamA.id,
    teamBId: teamB.id,
    plan: {
      format: ENCOUNTER_FORMAT,
      settings: DEFAULT_ENCOUNTER_SETTINGS,
      teams: { A: teamA, B: teamB },
      fixtures: createFixtures(ENCOUNTER_FORMAT),
    },
    status: 'IN_PROGRESS',
    currentIndex: 0,
    scoreA: 0,
    scoreB: 0,
    winner: null,
  };
}

/** Build a normal match config for a fixture (participant ids = 'A' / 'B'). */
export function fixtureMatchConfig(
  encounter: EncounterRecord,
  fixture: Fixture,
): GameConfig {
  const { settings, teams } = encounter.plan;
  const all = [...teams.A.players, ...teams.B.players];
  const nameOf = (id: string) => all.find((p) => p.id === id)?.name ?? '???';
  const isDouble = fixture.kind === 'DOUBLE';

  return {
    id: createId('cfg'),
    createdAt: Date.now(),
    variant: 501,
    outRule: 'DOUBLE',
    mode: fixture.kind,
    legsToWin: settings.legsToWin,
    participants: [
      {
        id: 'A',
        label: isDouble ? teams.A.name : nameOf(fixture.aPlayerIds[0] ?? ''),
        playerIds: fixture.aPlayerIds,
      },
      {
        id: 'B',
        label: isDouble ? teams.B.name : nameOf(fixture.bPlayerIds[0] ?? ''),
        playerIds: fixture.bPlayerIds,
      },
    ],
    players: [...fixture.aPlayerIds, ...fixture.bPlayerIds].map((id) => ({
      id,
      name: nameOf(id),
    })),
    startingPolicy: settings.startingPolicy,
    alternateStarter: settings.alternateStarter,
    // Bull winner for this match, else the encounter default.
    firstStarterId: fixture.starterSide ?? settings.starterSide ?? 'A',
  };
}

/** Ensure the fixture has a linked match; create it on first launch. */
export async function launchFixture(
  encounter: EncounterRecord,
  fixture: Fixture,
): Promise<{ encounter: EncounterRecord; matchId: string }> {
  if (fixture.matchId) return { encounter, matchId: fixture.matchId };

  const config = fixtureMatchConfig(encounter, fixture);
  const matchId = createUuid();
  await persistMatch({
    id: matchId,
    seasonId: encounter.seasonId,
    config,
    events: [],
    mode: config.mode,
    variant: config.variant,
    status: 'IN_PROGRESS',
    encounterId: encounter.id,
    fixtureIndex: fixture.index,
  });

  const plan = {
    ...encounter.plan,
    fixtures: encounter.plan.fixtures.map((f) =>
      f.index === fixture.index ? { ...f, matchId } : f,
    ),
  };
  const updated = { ...encounter, plan };
  await persistEncounter(updated);
  return { encounter: updated, matchId };
}

/** Record the winner of a fixture (called when its match finishes). */
export async function recordFixtureResult(
  encounter: EncounterRecord,
  fixtureIndex: number,
  winner: Side,
): Promise<EncounterRecord> {
  const plan = withFixtureWinner(encounter.plan, fixtureIndex, winner);
  const scoreA = plan.fixtures.filter((f) => f.winner === 'A').length;
  const scoreB = plan.fixtures.filter((f) => f.winner === 'B').length;
  const played = plan.fixtures.filter((f) => f.winner !== null).length;
  const finished = played >= plan.fixtures.length;
  const updated: EncounterRecord = {
    ...encounter,
    plan,
    scoreA,
    scoreB,
    status: finished ? 'FINISHED' : 'IN_PROGRESS',
    winner: finished ? (scoreA === scoreB ? null : scoreA > scoreB ? 'A' : 'B') : null,
    finishedAt: finished ? new Date().toISOString() : null,
  };
  await persistEncounter(updated);
  return updated;
}

/** Move on to the next fixture (the "Next match" action). */
export async function advanceEncounter(
  encounter: EncounterRecord,
): Promise<EncounterRecord> {
  const updated = { ...encounter, currentIndex: encounter.currentIndex + 1 };
  await persistEncounter(updated);
  return updated;
}

/** Compose a block's fixtures (assign players), then persist. */
export async function composeBlock(
  encounter: EncounterRecord,
  block: ComposeBlock,
  compositions: { index: number; a: string[]; b: string[] }[],
): Promise<EncounterRecord> {
  void block;
  const plan = withFixtureCompositionMany(encounter.plan, compositions);
  const updated = { ...encounter, plan };
  await persistEncounter(updated);
  return updated;
}
