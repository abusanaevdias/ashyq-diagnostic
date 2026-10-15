/** Leave response/cleanup headroom inside the route's 40-second platform limit. */
export const WRITING_REQUEST_BUDGET_MS = 35_000;
export const writingRequestSignal = (request: Request) =>
  AbortSignal.any([request.signal, AbortSignal.timeout(WRITING_REQUEST_BUDGET_MS)]);
export const writingStepSignal = (signal: AbortSignal | undefined, milliseconds: number) =>
  signal ? AbortSignal.any([signal, AbortSignal.timeout(milliseconds)]) : AbortSignal.timeout(milliseconds);
export class WritingBodyTooLargeError extends Error {}
/** The same deadline bounds a slow/chunked body; the limit is actual UTF-8 bytes. */
export async function readWritingBody(request: Request, signal: AbortSignal): Promise<string> {
  signal.throwIfAborted();
  if (!request.body) return '';
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let text = '';
  // Cancelling closes a pending read. One listener avoids retaining a reaction per chunk.
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  try {
    while (true) {
      signal.throwIfAborted();
      const chunk = await reader.read();
      signal.throwIfAborted();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 50_000) throw new WritingBodyTooLargeError('Body exceeds 50000 bytes');
      text += decoder.decode(chunk.value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    signal.removeEventListener('abort', abort);
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
