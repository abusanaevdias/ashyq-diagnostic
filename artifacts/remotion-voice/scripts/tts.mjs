// Generates every voice line with Fish Audio and writes public/voice/timeline.json
// with the measured durations, which the Remotion composition uses for its timing.
//   node scripts/tts.mjs            all lines
//   node scripts/tts.mjs --only hook
//   node scripts/tts.mjs --reprocess   re-normalize and re-measure existing files, no API calls
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tts } from './fish.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(root, 'voice.config.json'), 'utf8'));
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const reprocess = process.argv.includes('--reprocess');
const outDir = join(root, 'public', 'voice');
mkdirSync(outDir, { recursive: true });

// ffprobe is not always installed; `ffmpeg -i` prints the duration on stderr
const duration = (file) => {
  const out = spawnSync('ffmpeg', ['-hide_banner', '-i', file]).stderr.toString();
  const [, h, m, s] = out.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return Math.round((Number(h) * 3600 + Number(m) * 60 + Number(s)) * 1000) / 1000;
};

// voices from the library differ by ~10 dB; bring every line to the same loudness
const normalize = (file) => {
  const tmp = `${file}.tmp.mp3`;
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '44100', '-b:a', '192k', tmp]);
  if (r.status !== 0) throw new Error(`loudnorm failed for ${file}: ${r.stderr}`);
  renameSync(tmp, file);
};

// speech segments [start, end] from ffmpeg silencedetect; the composition syncs
// on-screen beats (strike-through, highlight) to the phrases of the voice line
const segments = (file, total) => {
  const out = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'silencedetect=n=-38dB:d=0.12', '-f', 'null', '-']).stderr.toString();
  const marks = [...out.matchAll(/silence_(start|end): ([\d.]+)/g)].map((m) => [m[1], Number(m[2])]);
  const segs = [];
  let from = 0;
  for (const [kind, at] of marks) {
    if (kind === 'start') { if (at - from > 0.05) segs.push([from, at]); }
    else from = at;
  }
  if ((!marks.length || marks[marks.length - 1][0] === 'end') && total - from > 0.05) segs.push([from, total]);
  return segs.map(([a, b]) => [Math.round(a * 1000) / 1000, Math.round(b * 1000) / 1000]);
};

const timelineFile = join(outDir, 'timeline.json');
let timeline = { lines: {} };
try { timeline = JSON.parse(readFileSync(timelineFile, 'utf8')); } catch { /* first run */ }

for (const [id, line] of Object.entries(cfg.lines)) {
  if (only && id !== only) continue;
  const voice = cfg.voices[line.voice];
  if (!voice) throw new Error(`voice.config.json: set voices.${line.voice}`);
  const file = join(outDir, `${id}.mp3`);
  if (!reprocess) writeFileSync(file, await tts({ text: line.text, voice, speed: line.speed, model: process.env.FISH_MODEL || cfg.model }));
  normalize(file);
  const total = duration(file);
  timeline.lines[id] = { file: `voice/${id}.mp3`, duration: total, text: line.text, segments: segments(file, total) };
  console.log(`${id}: ${total}s, ${timeline.lines[id].segments.length} phrases`);
}
writeFileSync(timelineFile, `${JSON.stringify(timeline, null, 2)}\n`);
