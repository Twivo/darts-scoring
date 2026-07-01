import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/store/AuthContext';

export function AdminLogin() {
  const navigate = useNavigate();
  const { signIn, adminAvailable } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <div className="mb-2 text-5xl">🔒</div>
        <h1 className="text-2xl font-black">Admin sign in</h1>
        <p className="mt-1 text-sm text-[var(--color-text-dim)]">
          Restricted area — authorized staff only.
        </p>
      </div>

      {!adminAvailable && (
        <p className="rounded-lg bg-[var(--color-accent-soft)] px-4 py-2 text-center text-sm text-[var(--color-accent)]">
          Cloud backend not configured — admin is unavailable.
        </p>
      )}

      <form onSubmit={submit} className="flex w-full flex-col gap-3">
        <input
          type="email"
          autoComplete="username"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 outline-none focus:border-[var(--color-accent)]"
        />
        {error && (
          <p className="text-center text-sm text-[var(--color-accent)]">{error}</p>
        )}
        <Button
          type="submit"
          variant="accent"
          size="lg"
          fullWidth
          disabled={busy || !adminAvailable || !email || !password}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <button
        onClick={() => navigate('/')}
        className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
      >
        ← Back to app
      </button>
    </div>
  );
}
