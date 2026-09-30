// Renders composition.html frame by frame and encodes the MP4.
//   node render.mjs                 full render → ashyq-ad-15s-quiz.mp4
//   node render.mjs --stills 1.2,5  PNG stills only (for review)
// Needs `playwright` (repo devDependency) and `ffmpeg` on PATH.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'ashyq-ad-15s-quiz.mp4');
const audio = join(here, 'soundtrack.wav');
const stillsArg = process.argv.indexOf('--stills');

const browser = await chromium.launch(
  existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {},
);
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(here, 'composition.html')).href + '?render');
await page.evaluate(() => window.ready);
const { fps, duration } = await page.evaluate(() => JSON.parse(document.getElementById('timeline').textContent));

if (stillsArg !== -1) {
  for (const t of process.argv[stillsArg + 1].split(',').map(Number)) {
    await page.evaluate((x) => window.seek(x), t);
    await page.screenshot({ path: join(here, `still-${t.toFixed(2)}.png`) });
  }
  await browser.close();
  process.exit(0);
}

const args = ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-'];
if (existsSync(audio)) args.push('-i', audio, '-c:a', 'aac', '-b:a', '192k', '-shortest');
args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out);
const ffmpeg = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });

const frames = Math.round(fps * duration);
for (let i = 0; i < frames; i++) {
  await page.evaluate((x) => window.seek(x), i / fps);
  const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
  if (!ffmpeg.stdin.write(buf)) await new Promise((r) => ffmpeg.stdin.once('drain', r));
  if (i % fps === 0) process.stdout.write(`\r${i / fps}s / ${duration}s`);
}
ffmpeg.stdin.end();
await new Promise((r, j) => ffmpeg.on('close', (code) => (code === 0 ? r() : j(new Error(`ffmpeg exited ${code}`)))));
await browser.close();
console.log(`\n${out}`);
