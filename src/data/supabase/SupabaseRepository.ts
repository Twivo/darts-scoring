/** Supabase-backed implementation of DartsRepository. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DartsRepository, PlayerInput } from '../repository';
import type {
  MatchQuery,
  MatchRecord,
  PlayerQuery,
  PlayerRecord,
  Season,
} from '../types';

interface DbPlayer {
  id: string;
  name: string;
  color: string | null;
  active: boolean;
  created_at: string;
}
interface DbSeason {
  id: string;
  name: string;
  starts_on: string | null;
  ends_on: string | null;
  is_current: boolean;
}
interface DbMatch {
  id: string;
  season_id: string;
  config: MatchRecord['config'];
  events: MatchRecord['events'];
  mode: MatchRecord['mode'];
  variant: MatchRecord['variant'];
  status: MatchRecord['status'];
  winner_participant: string | null;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
}

const toPlayer = (r: DbPlayer): PlayerRecord => ({
  id: r.id,
  name: r.name,
  color: r.color,
  active: r.active,
  createdAt: r.created_at,
});
const toSeason = (r: DbSeason): Season => ({
  id: r.id,
  name: r.name,
  startsOn: r.starts_on,
  endsOn: r.ends_on,
  isCurrent: r.is_current,
});
const toMatch = (r: DbMatch): MatchRecord => ({
  id: r.id,
  seasonId: r.season_id,
  config: r.config,
  events: r.events,
  mode: r.mode,
  variant: r.variant,
  status: r.status,
  winnerParticipant: r.winner_participant,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  finishedAt: r.finished_at,
});

export class SupabaseRepository implements DartsRepository {
  constructor(private readonly sb: SupabaseClient) {}

  async listPlayers(query: PlayerQuery = {}): Promise<PlayerRecord[]> {
    let q = this.sb.from('players').select('*');
    if (query.activeOnly) q = q.eq('active', true);
    if (query.search) q = q.ilike('name', `%${query.search}%`);
    q = q.order(query.sortBy === 'createdAt' ? 'created_at' : 'name', {
      ascending: (query.sortDir ?? 'asc') === 'asc',
    });
    const { data, error } = await q;
    if (error) throw error;
    return (data as DbPlayer[]).map(toPlayer);
  }

  async createPlayer(input: PlayerInput): Promise<PlayerRecord> {
    const { data, error } = await this.sb
      .from('players')
      .insert({
        name: input.name,
        color: input.color ?? null,
        active: input.active ?? true,
      })
      .select('*')
      .single();
    if (error) throw error;
    return toPlayer(data as DbPlayer);
  }

  async updatePlayer(
    id: string,
    patch: Partial<PlayerInput>,
  ): Promise<PlayerRecord> {
    const { data, error } = await this.sb
      .from('players')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return toPlayer(data as DbPlayer);
  }

  async deletePlayer(id: string): Promise<void> {
    const { error } = await this.sb.from('players').delete().eq('id', id);
    if (error) throw error;
  }

  async listSeasons(): Promise<Season[]> {
    const { data, error } = await this.sb
      .from('seasons')
      .select('*')
      .order('name', { ascending: false });
    if (error) throw error;
    return (data as DbSeason[]).map(toSeason);
  }

  async getCurrentSeason(): Promise<Season | null> {
    const { data, error } = await this.sb
      .from('seasons')
      .select('*')
      .eq('is_current', true)
      .maybeSingle();
    if (error) throw error;
    return data ? toSeason(data as DbSeason) : null;
  }

  async listMatches(query: MatchQuery = {}): Promise<MatchRecord[]> {
    let q = this.sb.from('matches').select('*');
    if (query.seasonId) q = q.eq('season_id', query.seasonId);
    if (query.mode) q = q.eq('mode', query.mode);
    if (query.status) q = q.eq('status', query.status);
    if (query.from) q = q.gte('created_at', query.from);
    if (query.to) q = q.lte('created_at', query.to);
    q = q.order('created_at', { ascending: false });
    const { data, error } = await q;
    if (error) throw error;
    let rows = (data as DbMatch[]).map(toMatch);
    // player filter: match_players is the source of truth, but for simplicity
    // we filter on the config snapshot which contains the real player ids.
    if (query.playerId) {
      rows = rows.filter((m) =>
        m.config.players.some((p) => p.id === query.playerId),
      );
    }
    return rows;
  }

  async getMatch(id: string): Promise<MatchRecord | null> {
    const { data, error } = await this.sb
      .from('matches')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? toMatch(data as DbMatch) : null;
  }

  async saveMatch(record: MatchRecord): Promise<void> {
    const { error } = await this.sb.from('matches').upsert({
      id: record.id,
      season_id: record.seasonId,
      config: record.config,
      events: record.events,
      mode: record.mode,
      variant: record.variant,
      status: record.status,
      winner_participant: record.winnerParticipant ?? null,
      finished_at: record.finishedAt ?? null,
    });
    if (error) throw error;

    // Link players for fast per-player queries (idempotent).
    const links = record.config.participants.flatMap((part) =>
      part.playerIds.map((pid) => ({
        match_id: record.id,
        player_id: pid,
        participant_id: part.id,
      })),
    );
    if (links.length) {
      await this.sb
        .from('match_players')
        .upsert(links, { onConflict: 'match_id,player_id', ignoreDuplicates: true });
    }
  }

  async listInProgress(): Promise<MatchRecord[]> {
    const { data, error } = await this.sb
      .from('matches')
      .select('*')
      .eq('status', 'IN_PROGRESS')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data as DbMatch[]).map(toMatch);
  }
}
