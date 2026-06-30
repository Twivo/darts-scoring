import { useGame } from '@/store/GameContext';
import { participantLabel, playerName } from '@/domain/presentation';

export function Header() {
  const { config, state } = useGame();
  const { activeParticipantId, activePlayerId, legStarterId } = state;

  const isDouble = config.mode === 'DOUBLE';
  const legNumber = state.currentLegIndex + 1;
  const starterName = isDouble
    ? participantLabel(config, legStarterId)
    : playerName(
        config,
        config.participants.find((p) => p.id === legStarterId)?.playerIds[0] ??
          '',
      );

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs">
      <div
        key={activePlayerId}
        className="animate-player-switch flex items-baseline gap-1.5 truncate"
      >
        <span className="text-base font-black">
          {playerName(config, activePlayerId)}
        </span>
        {isDouble && (
          <span className="rounded bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">
            {participantLabel(config, activeParticipantId)}
          </span>
        )}
        <span className="text-[var(--color-text-dim)]">to throw</span>
      </div>

      <div className="shrink-0 text-right text-[var(--color-text-dim)]">
        <span className="font-semibold text-[var(--color-accent)]">
          Leg {legNumber}
        </span>{' '}
        · {starterName} starts
        <span className="ml-1 hidden sm:inline">
          · {config.variant} DO · first to {config.legsToWin}
        </span>
      </div>
    </header>
  );
}
