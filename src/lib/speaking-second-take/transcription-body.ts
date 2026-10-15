export class SpeakingBodyTooLargeError extends Error {}
export const MAX_TRANSCRIPTION_BODY_BYTES = 4_000_000;
/** A bounded wire buffer avoids Node's async FormData producer enqueueing after cancellation. */
export function speakingMultipartPayload(audio: Uint8Array, boundary: string): { body: Uint8Array; contentType: string } {
  if (!/^[A-Za-z0-9-]{20,100}$/.test(boundary)) throw Error('Invalid internal multipart boundary');
  const encoder = new TextEncoder();
  const pieces: Uint8Array[] = [encoder.encode(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="take.wav"\r\nContent-Type: audio/wav\r\n\r\n`), audio];
  for (const [name, value] of [['model', 'whisper-1'], ['language', 'en'], ['response_format', 'verbose_json'], ['timestamp_granularities[]', 'word']]) pieces.push(encoder.encode(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}`));
  pieces.push(encoder.encode(`\r\n--${boundary}--\r\n`));
  const size = pieces.reduce((sum, bytes) => sum + bytes.byteLength, 0);
  if (size > MAX_TRANSCRIPTION_BODY_BYTES) throw new SpeakingBodyTooLargeError('Provider request exceeds byte limit');
  const body = new Uint8Array(size); let offset = 0;
  for (const piece of pieces) { body.set(piece, offset); offset += piece.length; }
  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}
/** Bounded binary read, including pending-read cancellation. No request/audio logging. */
export async function readSpeakingBytes(body: ReadableStream<Uint8Array> | null, signal: AbortSignal, max = MAX_TRANSCRIPTION_BODY_BYTES): Promise<Uint8Array> {
  signal.throwIfAborted();
  if (!body) return new Uint8Array();
  const reader = body.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', abort, { once: true }); if (signal.aborted) abort();
  try {
    while (true) {
      signal.throwIfAborted(); const chunk = await reader.read(); signal.throwIfAborted();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > max) throw new SpeakingBodyTooLargeError('Audio request exceeds byte limit');
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(size); let at = 0;
    for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.byteLength; }
    return bytes;
  } finally { signal.removeEventListener('abort', abort); void reader.cancel().catch(() => {}); reader.releaseLock(); }
}
