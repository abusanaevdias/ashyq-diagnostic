// Generates every voice line with Fish Audio and writes public/voice/timeline.json
// with the measured durations, which the Remotion composition uses for its timing.
//   node scripts/tts.mjs            all lines
//   node scripts/tts.mjs --only hook
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tts } from './fish.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(root, 'voice.config.json'), 'utf8'));
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const outDir = join(root, 'public', 'voice');
mkdirSync(outDir, { recursive: true });

// ffprobe is not always installed; `ffmpeg -i` prints the duration on stderr
const duration = (file) => {
  const out = spawnSync('ffmpeg', ['-hide_banner', '-i', file]).stderr.toString();
  const [, h, m, s] = out.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return Math.round((Number(h) * 3600 + Number(m) * 60 + Number(s)) * 1000) / 1000;
};

const timelineFile = join(outDir, 'timeline.json');
let timeline = { lines: {} };
try { timeline = JSON.parse(readFileSync(timelineFile, 'utf8')); } catch { /* first run */ }

for (const [id, line] of Object.entries(cfg.lines)) {
  if (only && id !== only) continue;
  const voice = cfg.voices[line.voice];
  if (!voice) throw new Error(`voice.config.json: set voices.${line.voice}`);
  const file = join(outDir, `${id}.mp3`);
  writeFileSync(file, await tts({ text: line.text, voice, speed: line.speed }));
  timeline.lines[id] = { file: `voice/${id}.mp3`, duration: duration(file), text: line.text };
  console.log(`${id}: ${timeline.lines[id].duration}s`);
}
writeFileSync(timelineFile, `${JSON.stringify(timeline, null, 2)}\n`);
