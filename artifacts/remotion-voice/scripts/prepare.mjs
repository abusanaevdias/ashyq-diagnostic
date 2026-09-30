// Copies brand fonts and the wordmark into public/ and synthesises the sound
// effects and music bed (no third-party audio).  node scripts/prepare.mjs
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(root, '..', '..');
const pub = join(root, 'public');
for (const d of ['fonts', 'brand', 'sfx', 'voice']) mkdirSync(join(pub, d), { recursive: true });

for (const f of ['manrope-800-cyrillic', 'manrope-800-latin', 'inter-500-cyrillic', 'inter-500-latin', 'inter-600-cyrillic', 'inter-600-latin', 'caveat-700-cyrillic', 'caveat-700-latin']) {
  copyFileSync(join(repo, 'public', 'fonts', `${f}.woff2`), join(pub, 'fonts', `${f}.woff2`));
}
copyFileSync(join(repo, 'public', 'brand', 'wordmark-ink.png'), join(pub, 'brand', 'wordmark-ink.png'));

const ff = (args) => {
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${args.join(' ')}`);
};
// clock tick, rising chime, soft whoosh
ff(['-f', 'lavfi', '-i', 'sine=frequency=3200:duration=0.04', '-af', 'afade=t=out:st=0:d=0.04', join(pub, 'sfx', 'tick.wav')]);
ff(['-f', 'lavfi', '-i', 'sine=frequency=1046:duration=0.7', '-f', 'lavfi', '-i', 'sine=frequency=1568:duration=0.7',
  '-filter_complex', '[1]adelay=90|90[b];[0][b]amix=inputs=2,afade=t=out:st=0.05:d=0.65', join(pub, 'sfx', 'chime.wav')]);
ff(['-f', 'lavfi', '-i', 'anoisesrc=color=pink:duration=0.5:amplitude=0.5', '-af', 'lowpass=f=2500,afade=t=in:d=0.25,afade=t=out:st=0.25:d=0.25', join(pub, 'sfx', 'whoosh.wav')]);
// 60 s music bed: soft pad + pulse, looped under the video and ducked in the composition
ff(['-f', 'lavfi', '-i', 'sine=frequency=130.8:duration=60', '-f', 'lavfi', '-i', 'sine=frequency=196:duration=60', '-f', 'lavfi', '-i', 'sine=frequency=329.6:duration=60',
  '-filter_complex', '[0][1][2]amix=inputs=3,volume=0.6,tremolo=f=2:d=0.35,afade=t=in:d=1', join(pub, 'sfx', 'bed.wav')]);
console.log('prepared public/');
