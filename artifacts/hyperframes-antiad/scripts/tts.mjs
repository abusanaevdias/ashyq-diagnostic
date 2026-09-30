// Voice-over for «Антиреклама»: one Fish Audio file per storyboard frame,
// loudness-normalised, durations written to assets/voice/durations.json.
// The API key is read by fish.mjs from FISH_API_KEY or ~/.secrets (never the repo).
//   node scripts/tts.mjs [--only 03-guess] [--reprocess]
import { spawnSync } from 'node:child_process';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tts } from '../../remotion-voice/scripts/fish.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(root, 'voice.config.json'), 'utf8'));
const argv = process.argv;
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;
const reprocess = argv.includes('--reprocess');
const outDir = join(root, 'assets', 'voice');

const ff = (args) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', ...args]);
  return { status: r.status, err: r.stderr.toString() };
};
const duration = (file) => {
  const [, h, m, s] = ff(['-i', file]).err.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return Math.round((Number(h) * 3600 + Number(m) * 60 + Number(s)) * 1000) / 1000;
};
// trim edge silence, then loudnorm so every line sits at the same level
const polish = (file) => {
  const tmp = `${file}.tmp.mp3`;
  const trim = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse';
  const r = ff(['-loglevel', 'error', '-y', '-i', file, '-af', `${trim},loudnorm=I=-16:TP=-1.5:LRA=11`, '-ar', '44100', '-b:a', '192k', tmp]);
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${file}: ${r.err}`);
  renameSync(tmp, file);
};

const durFile = join(outDir, 'durations.json');
let durations = {};
try { durations = JSON.parse(readFileSync(durFile, 'utf8')); } catch { /* first run */ }
for (const [id, text] of Object.entries(cfg.lines)) {
  if (only && id !== only) continue;
  const file = join(outDir, `${id}.mp3`);
  if (!reprocess) writeFileSync(file, await tts({ text, voice: cfg.voice, speed: cfg.speed, model: process.env.FISH_MODEL || cfg.model }));
  polish(file);
  durations[id] = duration(file);
  console.log(`${id}: ${durations[id]}s`);
}
writeFileSync(durFile, `${JSON.stringify(durations, null, 2)}\n`);
