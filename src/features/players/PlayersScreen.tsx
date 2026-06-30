import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { useRoster } from '@/store/RosterContext';

export function PlayersScreen() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { players, addPlayer, updatePlayer, removePlayer, reorder } =
    useRoster();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const submitAdd = () => {
    if (!name.trim()) return;
    addPlayer(name);
    setName('');
  };

  const startEdit = (id: string, current: string) => {
    setEditingId(id);
    setEditName(current);
  };

  const commitEdit = () => {
    if (editingId && editName.trim()) {
      updatePlayer(editingId, { name: editName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-6">
      <header className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          ← Back
        </Button>
        <h1 className="text-2xl font-bold">Players</h1>
      </header>

      <div className="mb-5 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
          placeholder="Player name"
          className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-base outline-none focus:border-[var(--color-accent)]"
        />
        <Button variant="accent" size="md" onClick={submitAdd}>
          Add
        </Button>
      </div>

      <ul className="flex flex-col gap-2">
        {players.length === 0 && (
          <li className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-[var(--color-text-dim)]">
            No players yet. Add one to get started.
          </li>
        )}
        {players.map((p, i) => (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: p.color }}
            />
            {editingId === p.id ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                onBlur={commitEdit}
                className="flex-1 rounded-lg bg-[var(--color-surface-2)] px-2 py-1 outline-none"
              />
            ) : (
              <button
                className="flex-1 text-left text-lg"
                onClick={() => startEdit(p.id, p.name)}
              >
                {p.name}
              </button>
            )}

            <div className="flex items-center gap-1">
              <button
                disabled={i === 0}
                onClick={() => reorder(i, i - 1)}
                className="rounded-md px-3 py-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] disabled:opacity-25"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                disabled={i === players.length - 1}
                onClick={() => reorder(i, i + 1)}
                className="rounded-md px-3 py-2 text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)] disabled:opacity-25"
                aria-label="Move down"
              >
                ▼
              </button>
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: `Delete ${p.name}?`,
                    danger: true,
                    confirmLabel: 'Delete',
                  });
                  if (ok) removePlayer(p.id);
                }}
                className="rounded-md px-3 py-2 text-[var(--color-accent)] hover:bg-[var(--color-surface-2)]"
                aria-label="Delete"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
