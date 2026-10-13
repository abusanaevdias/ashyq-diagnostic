import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import audio from '../src/data/trainer-drafts/listening-audio-02.json';
import audio10 from '../src/data/trainer-drafts/listening-audio-10.json';

async function main() {
  const base = process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
  assert.ok(['localhost', '127.0.0.1', 'ashyq-diagnostic.vercel.app'].includes(new URL(base).hostname));
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext(), page = await context.newPage();
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/trainers/material-review');
    await page.getByRole('heading', { name: 'Нужно войти', exact: true }).waitFor();
    const results = [];
    const assets=[...audio.assets,...audio10.assets];
    for (const asset of assets) {
      assert.ok(/^\/audio\/trainers\/drafts\/l\d{2}-[12]-(full|segment)\.wav$/.test(asset.url));
      const result = await page.evaluate(async url => {
        const response = await fetch(url), bytes = await response.arrayBuffer();
        const digest = await crypto.subtle.digest('SHA-256', bytes.slice(0));
        const sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
        const ctx = new AudioContext();
        try { const decoded = await ctx.decodeAudioData(bytes.slice(0)); return { url, status: response.status, contentType: response.headers.get('content-type'), bytes: bytes.byteLength, sha256, duration: decoded.duration }; }
        finally { await ctx.close(); }
      }, asset.url);
      assert.ok([200,206].includes(result.status));
      assert.ok(result.contentType?.startsWith('audio/'));
      assert.equal(result.bytes, asset.bytes); assert.equal(result.sha256, asset.sha256); assert.ok(result.duration > 1);
      results.push(result);
    }
    assert.deepEqual(errors, []);
    await fs.mkdir('artifacts/trainers-complete-033', { recursive: true });
    await fs.writeFile('artifacts/trainers-complete-033/draft-listening-served-assets.json', JSON.stringify({ checkedAt: new Date().toISOString(), base, releaseSHA: process.env.TRAINER_RELEASE_SHA ?? null, results, limits: 'Anonymous asset/gate check only; no authenticated preview, physical audio device, pronunciation or pedagogical certification.' }, null, 2));
    console.log(`PASS ${assets.length} served draft WAV assets at ${base}: exact bytes/SHA-256, audio MIME and browser decoding; anonymous review gate retained. No authenticated teacher, native-device or quality certification.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
