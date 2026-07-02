import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { shareResult, type SharePayload } from '@/lib/share';

/**
 * Share button: opens the native share sheet, or copies to the clipboard as a
 * fallback. Shows brief confirmation feedback. `payload` is built lazily so the
 * text reflects the latest state at click time.
 */
export function ShareButton({ payload }: { payload: () => SharePayload }) {
  const [status, setStatus] = useState<'idle' | 'shared' | 'copied' | 'unsupported'>('idle');

  const onClick = async () => {
    const result = await shareResult(payload());
    setStatus(result);
    window.setTimeout(() => setStatus('idle'), 2500);
  };

  const label =
    status === 'copied'
      ? 'Copied to clipboard ✓'
      : status === 'shared'
        ? 'Shared ✓'
        : status === 'unsupported'
          ? 'Copy not available'
          : 'Share result';

  return (
    <Button variant="surface" size="xl" fullWidth onClick={onClick}>
      {label}
    </Button>
  );
}
