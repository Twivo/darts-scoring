import { useEffect, useState } from 'react';
import { GameProvider } from '@/store/GameContext';
import { GameScreen } from '@/features/game/GameScreen';
import { launchFixture, persistEncounter } from '@/store/encounterService';
import { loadMatch } from '@/store/matchService';
import type { EncounterRecord, MatchRecord } from '@/data/types';
import type { Fixture, Side } from '@/domain/championship/types';
import { PreMatchSetup } from './PreMatchSetup';

/** Plays one fixture: pre-match (bull + order) then the full match engine. */
export function EncounterPlay({
  encounter,
  fixture,
  onEncounterUpdate,
  onResult,
  onBack,
}: {
  encounter: EncounterRecord;
  fixture: Fixture;
  onEncounterUpdate: (e: EncounterRecord) => void;
  onResult: (winner: Side) => void;
  onBack: () => void;
}) {
  const [match, setMatch] = useState<MatchRecord | null>(null);

  // Resume: if the match was already launched, load it and skip the bull screen.
  // Reload it too when the fixture's players change (edited from Configure while
  // no visit has been recorded) so the scoring screen reflects the new lineup.
  const compKey = `${fixture.aPlayerIds.join(',')}|${fixture.bPlayerIds.join(',')}`;
  useEffect(() => {
    let alive = true;
    if (fixture.matchId) {
      void loadMatch(fixture.matchId).then((m) => alive && setMatch(m));
    } else {
      setMatch(null);
    }
    return () => {
      alive = false;
    };
  }, [fixture.matchId, compKey]);

  const startMatch = async (v: {
    aOrder: string[];
    bOrder: string[];
    starter: Side;
  }) => {
    // Persist the chosen order + bull winner on the fixture, then launch.
    const plan = {
      ...encounter.plan,
      fixtures: encounter.plan.fixtures.map((f) =>
        f.index === fixture.index
          ? {
              ...f,
              aPlayerIds: v.aOrder,
              bPlayerIds: v.bOrder,
              starterSide: v.starter,
            }
          : f,
      ),
    };
    const enc = { ...encounter, plan };
    await persistEncounter(enc);
    const launched = await launchFixture(
      enc,
      plan.fixtures.find((f) => f.index === fixture.index)!,
    );
    onEncounterUpdate(launched.encounter);
    const m = await loadMatch(launched.matchId);
    setMatch(m);
  };

  if (!fixture.matchId && !match) {
    return (
      <PreMatchSetup
        encounter={encounter}
        fixture={fixture}
        onConfirm={startMatch}
        onBack={onBack}
      />
    );
  }

  if (!match) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--color-text-dim)]">
        Loading match…
      </div>
    );
  }

  return (
    <GameProvider
      key={match.config.participants.map((p) => p.playerIds.join('-')).join('|')}
      matchId={match.id}
      seasonId={encounter.seasonId}
      config={match.config}
      initialEvents={match.events}
      encounterId={encounter.id}
      fixtureIndex={fixture.index}
    >
      <GameScreen
        embedded
        onGameOver={(winnerId) => {
          if (winnerId === 'A' || winnerId === 'B') onResult(winnerId);
        }}
        gameOverContent={
          <div className="flex flex-1 items-center justify-center text-[var(--color-text-dim)]">
            Match finished — saving…
          </div>
        }
      />
    </GameProvider>
  );
}
