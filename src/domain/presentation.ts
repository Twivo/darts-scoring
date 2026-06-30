/** Display helpers derived from a self-contained GameConfig. */
import type { GameConfig, Participant } from './types';

export function playerName(config: GameConfig, playerId: string): string {
  return config.players.find((p) => p.id === playerId)?.name ?? '???';
}

export function participantById(
  config: GameConfig,
  participantId: string,
): Participant | undefined {
  return config.participants.find((p) => p.id === participantId);
}

export function participantLabel(
  config: GameConfig,
  participantId: string,
): string {
  return participantById(config, participantId)?.label ?? '???';
}

/** Full player roster names for a participant (team members in DOUBLE). */
export function participantPlayers(
  config: GameConfig,
  participantId: string,
): string[] {
  const p = participantById(config, participantId);
  if (!p) return [];
  return p.playerIds.map((id) => playerName(config, id));
}
