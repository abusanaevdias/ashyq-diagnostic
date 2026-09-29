// Renders the product ads: node render.mjs compass errors library
//   node render.mjs compass --stills 1,5   PNG stills only (for review)
// Each <ad>.html holds its own #timeline; audio.py <ad> makes soundtrack-<ad>.wav.
// Needs `playwright` (repo devDependency), `ffmpeg` on PATH and python3 with numpy.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const si = argv.indexOf('--stills');
const stills = si === -1 ? null : argv.splice(si, 2)[1];
const ads = argv.length ? argv : ['compass', 'errors', 'library'];

const browser = await chromium.launch(existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
for (const ad of ads) {
  await page.goto(`${pathToFileURL(join(here, `${ad}.html`)).href}?render`);
  await page.evaluate(() => window.ready);
  const { fps, duration } = await page.evaluate(() => JSON.parse(document.getElementById('timeline').textContent));
  if (stills) {
    for (const t of stills.split(',').map(Number)) {
      await page.evaluate((x) => window.seek(x), t);
      await page.screenshot({ path: join(here, `still-${ad}-${t.toFixed(2)}.png`) });
    }
    continue;
  }
  if (spawnSync('python3', [join(here, 'audio.py'), ad], { stdio: 'inherit' }).status !== 0) throw new Error(`audio.py failed for ${ad}`);
  const out = join(here, `ad-${ad}.mp4`);
  const ffmpeg = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-i', join(here, `soundtrack-${ad}.wav`), '-c:a', 'aac', '-b:a', '192k', '-shortest',
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
