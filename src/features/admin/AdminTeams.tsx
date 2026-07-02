import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { cn } from '@/lib/cn';
import { getRepository } from '@/data';
import type { TeamWithPlayers } from '@/data/types';
import { useRoster } from '@/store/RosterContext';

export function AdminTeams() {
  const confirm = useConfirm();
  const repo = useMemo(() => getRepository(), []);
  const { players } = useRoster();

  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTeams(await repo.listTeams());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    return teams.filter((t) => !s || t.name.toLowerCase().includes(s));
  }, [teams, search]);

  const playerName = (id: string) =>
    players.find((p) => p.id === id)?.name ?? '???';

  const toggleMember = (team: TeamWithPlayers, playerId: string) => {
    const next = team.playerIds.includes(playerId)
      ? team.playerIds.filter((id) => id !== playerId)
      : [...team.playerIds, playerId];
    void run(() => repo.setTeamPlayers(team.id, next));
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newName.trim()) {
              void run(async () => {
                await repo.createTeam(newName);
                setNewName('');
              });
            }
          }}
          placeholder="New team name"
          className="min-w-40 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 outline-none focus:border-[var(--color-accent)]"
        />
        <Button
          variant="accent"
          size="md"
          disabled={busy || !newName.trim()}
          onClick={() =>
            void run(async () => {
              await repo.createTeam(newName);
              setNewName('');
            })
          }
        >
          Add team
        </Button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search teams…"
        className="mb-3 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
      />

      {error && (
        <p className="mb-3 rounded-lg bg-[var(--color-accent-soft)] px-3 py-2 text-sm text-[var(--color-accent)]">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-6 text-center text-[var(--color-text-dim)]">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-[var(--color-text-dim)]">
          {teams.length === 0 ? 'No teams yet.' : 'No match.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((t) => {
            const expanded = expandedId === t.id;
            return (
              <li
                key={t.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  {editingId === t.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')
                          void run(async () => {
                            if (editName.trim())
                              await repo.updateTeam(t.id, { name: editName.trim() });
                            setEditingId(null);
                          });
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={() => setEditingId(null)}
                      className="flex-1 rounded-lg bg-[var(--color-surface-2)] px-2 py-1 outline-none"
                    />
                  ) : (
                    <button
                      className="flex-1 text-left"
                      onClick={() => {
                        setEditingId(t.id);
                        setEditName(t.name);
                      }}
                    >
                      <span className="text-lg font-semibold">{t.name}</span>
                      <span className="ml-2 text-xs text-[var(--color-text-dim)]">
                        {t.playerIds.length} player
                        {t.playerIds.length === 1 ? '' : 's'}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedId(expanded ? null : t.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-surface-2)]"
                  >
                    {expanded ? 'Close' : 'Players'}
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await confirm({
                        title: `Delete ${t.name}?`,
                        danger: true,
                        confirmLabel: 'Delete',
                      });
                      if (ok) void run(() => repo.deleteTeam(t.id));
                    }}
                    className="rounded-lg px-2.5 py-1.5 text-[var(--color-accent)] hover:bg-[var(--color-surface-2)]"
                    aria-label="Delete team"
                  >
                    ✕
                  </button>
                </div>

                {expanded && (
                  <div className="border-t border-[var(--color-border)] p-3">
                    {t.playerIds.length > 0 && (
                      <p className="mb-2 text-xs text-[var(--color-text-dim)]">
                        Members: {t.playerIds.map(playerName).join(', ')}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {players.length === 0 && (
                        <span className="text-sm text-[var(--color-text-dim)]">
                          No players — add some under “Players”.
                        </span>
                      )}
                      {players.map((p) => {
                        const member = t.playerIds.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            disabled={busy}
                            onClick={() => toggleMember(t, p.id)}
                            className={cn(
                              'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                              member
                                ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                                : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-dim)]',
                            )}
                          >
                            {member ? '✓ ' : '+ '}
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
