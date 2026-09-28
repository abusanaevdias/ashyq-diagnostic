// Renders «Искра vs IELTS» episodes from episode.html + episodes.js.
//   node render.mjs                     every episode → ep-<id>.mp4 (runs audio.py first)
//   node render.mjs --ep 1,6            only these episodes
//   node render.mjs --ep 1 --stills 2,6 PNG stills only (for review)
// Needs `playwright` (repo devDependency), `ffmpeg` on PATH and python3 with numpy.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (name) => { const i = process.argv.indexOf(name); return i === -1 ? null : process.argv[i + 1]; };
const data = JSON.parse(readFileSync(join(here, 'episodes.js'), 'utf8').match(/window\.EPISODES = (\{[\s\S]*\});/)[1]);
const ids = (arg('--ep') || Object.keys(data.episodes).join(',')).split(',');
const stills = arg('--stills');
const { fps, duration } = data.timeline;

const browser = await chromium.launch(
  existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {},
);
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });

for (const id of ids) {
  await page.goto(`${pathToFileURL(join(here, 'episode.html')).href}?render&ep=${id}`);
  await page.evaluate(() => window.ready);
  if (stills) {
    for (const t of stills.split(',').map(Number)) {
      await page.evaluate((x) => window.seek(x), t);
      await page.screenshot({ path: join(here, `still-ep${id}-${t.toFixed(2)}.png`) });
    }
    continue;
  }
  const audio = join(here, `soundtrack-ep${id}.wav`);
  const py = spawnSync('python3', [join(here, 'audio.py'), id], { stdio: 'inherit' });
  if (py.status !== 0) throw new Error(`audio.py failed for episode ${id}`);
  const out = join(here, `ep-${id.padStart(2, '0')}.mp4`);
  const ffmpeg = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-i', audio, '-c:a', 'aac', '-b:a', '192k', '-shortest',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < Math.round(fps * duration); i++) {
    await page.evaluate((x) => window.seek(x), i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ffmpeg.stdin.write(buf)) await new Promise((r) => ffmpeg.stdin.once('drain', r));
  }
  ffmpeg.stdin.end();
  await new Promise((r, j) => ffmpeg.on('close', (code) => (code === 0 ? r() : j(new Error(`ffmpeg exited ${code}`)))));
  console.log(out);
}
await browser.close();
