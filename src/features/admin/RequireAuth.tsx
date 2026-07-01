import type { ReactNode } from 'react';
import { useAuth } from '@/store/AuthContext';
import { AdminLogin } from './AdminLogin';

/** Gate that makes everything inside totally inaccessible without auth. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--color-text-dim)]">
        Loading…
      </div>
    );
  }
  if (!user) return <AdminLogin />;
  return <>{children}</>;
}
