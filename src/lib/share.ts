/**
 * Share a text result via the native share sheet (Web Share API) when
 * available — WhatsApp, Messages, etc. — falling back to copying to the
 * clipboard. Returns what actually happened so the UI can give feedback.
 */
export interface SharePayload {
  title: string;
  text: string;
  url?: string;
}

export type ShareResult = 'shared' | 'copied' | 'unsupported';

export async function shareResult(payload: SharePayload): Promise<ShareResult> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(payload);
      return 'shared';
    } catch (err) {
      // User dismissed the share sheet — treat as done, don't also copy.
      if ((err as DOMException)?.name === 'AbortError') return 'shared';
      // Otherwise fall through to the clipboard fallback.
    }
  }

  const blob = payload.url ? `${payload.text}\n${payload.url}` : payload.text;
  try {
    await navigator.clipboard.writeText(blob);
    return 'copied';
  } catch {
    return 'unsupported';
  }
}
