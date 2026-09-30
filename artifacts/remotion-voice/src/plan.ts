// Scene plan derived from the real voice-over durations (public/voice/timeline.json,
// written by scripts/tts.mjs). Everything is in seconds; the composition converts.
// segments: speech phrases [start, end] inside the file, from silence detection
export type VoiceLine = {file: string; duration: number; text: string; segments?: [number, number][]};
export type Timeline = {lines: Record<'hook' | 'record' | 'reveal' | 'cta', VoiceLine>};

export type Plan = {
  hook: [number, number];
  record: [number, number];
  pause: [number, number];
  reveal: [number, number];
  cta: [number, number];
  // voice start times
  voice: Record<'hook' | 'record' | 'reveal' | 'cta', number>;
  duration: number;
};

export const PAUSE_SECONDS = 5;

export function makePlan(tl: Timeline): Plan {
  const L = tl.lines;
  const hookVoice = 0.3;
  const hookEnd = hookVoice + L.hook.duration + 0.3;
  const recordVoice = hookEnd + 0.4;
  const recordEnd = recordVoice + L.record.duration + 0.4;
  const pauseEnd = recordEnd + PAUSE_SECONDS;
  const revealVoice = pauseEnd + 0.3;
  // hold the correct answer (50 ✓) on screen before the end card
  const revealEnd = revealVoice + L.reveal.duration + 1.3;
  const ctaVoice = revealEnd + 0.4;
  const duration = ctaVoice + L.cta.duration + 1.4;
  return {
    hook: [0, hookEnd],
    record: [hookEnd, recordEnd],
    pause: [recordEnd, pauseEnd],
    reveal: [pauseEnd, revealEnd],
    cta: [revealEnd, duration],
    voice: {hook: hookVoice, record: recordVoice, reveal: revealVoice, cta: ctaVoice},
    duration,
  };
}
