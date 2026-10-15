export const SPEAKING_SAMPLE_RATE = 16_000;
export const MAX_SPEAKING_SECONDS = 120;
export const MAX_SPEAKING_WAV_BYTES = 44 + SPEAKING_SAMPLE_RATE * 2 * MAX_SPEAKING_SECONDS;
export class SpeakingAudioError extends Error {}
/** Only this canonical PCM envelope is accepted; duration never comes from client metadata. */
export function inspectSpeakingWav(bytes: Uint8Array): { seconds: number; frames: number } {
  if (bytes.byteLength < 44 || bytes.byteLength > MAX_SPEAKING_WAV_BYTES) throw new SpeakingAudioError('Для распознавания нужна запись от 0,2 до 120 секунд.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), label = (at: number) => String.fromCharCode(...bytes.slice(at, at + 4));
  if (label(0) !== 'RIFF' || label(8) !== 'WAVE' || label(12) !== 'fmt ' || label(36) !== 'data' || view.getUint32(4, true) !== bytes.byteLength - 8 || view.getUint32(16, true) !== 16 || view.getUint16(20, true) !== 1 || view.getUint16(22, true) !== 1 || view.getUint32(24, true) !== SPEAKING_SAMPLE_RATE || view.getUint32(28, true) !== SPEAKING_SAMPLE_RATE * 2 || view.getUint16(32, true) !== 2 || view.getUint16(34, true) !== 16 || view.getUint32(40, true) !== bytes.byteLength - 44 || (bytes.byteLength - 44) % 2 !== 0) throw new SpeakingAudioError('Не удалось подтвердить формат аудио. Сохрани оригинал и попробуй новую запись.');
  const frames = (bytes.byteLength - 44) / 2, seconds = frames / SPEAKING_SAMPLE_RATE;
  if (seconds < 0.2 || seconds > MAX_SPEAKING_SECONDS) throw new SpeakingAudioError('Для распознавания нужна запись от 0,2 до 120 секунд.');
  return { seconds, frames };
}
export function encodeSpeakingWav(samples: Float32Array): Uint8Array {
  if (samples.length < SPEAKING_SAMPLE_RATE * 0.2 || samples.length > SPEAKING_SAMPLE_RATE * MAX_SPEAKING_SECONDS || samples.some(n => !Number.isFinite(n))) throw new SpeakingAudioError('Запись несовместима или длиннее 120 секунд. Аудио не обрезано.');
  const bytes = new Uint8Array(44 + samples.length * 2), view = new DataView(bytes.buffer), label = (at: number, text: string) => { for (let i = 0; i < text.length; i++) bytes[at + i] = text.charCodeAt(i); };
  label(0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); label(8, 'WAVE'); label(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, SPEAKING_SAMPLE_RATE, true); view.setUint32(28, SPEAKING_SAMPLE_RATE * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); label(36, 'data'); view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) { const sample = Math.max(-1, Math.min(1, samples[i])); view.setInt16(44 + i * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true); }
  inspectSpeakingWav(bytes); return bytes;
}
