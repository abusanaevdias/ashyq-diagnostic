import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import raw from '../src/data/free-library-content.json';
import { LIBRARY_CHAPTERS, LIBRARY_DOWNLOADS } from '../src/data/free-library';
import { FREE_STARTERS } from '../src/data/free-starters';

async function main() {
assert.equal(raw.sections.length, 198);
assert.equal(new Set(LIBRARY_CHAPTERS.map((chapter) => chapter.slug)).size, LIBRARY_CHAPTERS.length);
for (const section of raw.sections) {
  assert.equal(LIBRARY_CHAPTERS.filter((chapter) => chapter.source === section.source && chapter.start <= section.page && chapter.end >= section.page).length, 1, `exactly one chapter for ${section.source}/${section.code}`);
  assert.ok(section.blocks.length);
}
for (const chapter of LIBRARY_CHAPTERS) {
  assert.equal(raw.sections.filter((section) => section.source === chapter.source && section.page >= chapter.start && section.page <= chapter.end).length, chapter.end - chapter.start + 1);
}
const exerciseText = raw.sections.filter((section) => section.exercise).map((section) => section.blocks.map((block) => 'text' in block ? block.text : '').join(' ')).join(' ');
const codes = new Set(exerciseText.match(/\b(?:E0[1-6]|T1[ABC]|R0[1-3]|G[1-3]|C[1-2]|L0[1-3]|SP[1-3]|NEW[1-4]|U0[1-4]|TR|CC|LR|GR)-\d{2}\b/g));
const xCodes = new Set(exerciseText.match(/\bX\d{2}\b/g));
assert.equal(codes.size + xCodes.size, 322, '222 original + 100 new unique exercises');
assert.equal(xCodes.size, 12);
assert.equal(raw.sections.filter((section) => /^(E0[1-6]-[AC]|U0[1-4]-[ABC])$/.test(section.code)).length, 24);
assert.equal(raw.sections.filter((section) => /^T1[ABC]-[AC]$/.test(section.code)).length, 6);
for (const section of raw.sections.filter((section) => /^U0[1-4]-C$/.test(section.code))) assert.equal(section.answer, false, 'C is an essay version, not exercise key');
const speaking = raw.sections.find((section) => section.code === 'S-P1')!;
assert.equal(speaking.blocks.length, 19, 'intro + 18 separately ordered questions');
assert.ok(('text' in speaking.blocks[2] ? speaking.blocks[2].text ?? '' : '').includes('elsewhere?'));
for (let i = 0; i < LIBRARY_DOWNLOADS.length; i++) {
  const source = ['library', 'lab', 'workbook'][i] as keyof typeof raw.sources;
  const bytes = await readFile(`public${LIBRARY_DOWNLOADS[i].href}`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), raw.sources[source].sha256);
}
const base = (process.env.BASE_URL || 'http://127.0.0.1:3032').replace(/\/$/, '');
const canonicalBase = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const home = await (await fetch(`${base}/`)).text();
assert.ok(home.includes('Бесплатная библиотека'));
assert.ok(home.includes('Первые шаги: диагностика и библиотека'));
for (const entry of FREE_STARTERS) {
  assert.equal((await fetch(`${base}${entry.href}`)).status, 200, `direct start: ${entry.id}`);
  if (entry.home) assert.ok(home.includes(`href="${entry.href}"`), `home direct link: ${entry.id}`);
}
for (const slug of ['', ...LIBRARY_CHAPTERS.map((chapter) => `/${chapter.slug}`)]) {
  const response = await fetch(`${base}/library${slug}`);
  assert.equal(response.status, 200, slug);
  const html = await response.text();
  assert.ok(!/<meta[^>]+content="[^"]*noindex/.test(html), `indexable ${slug}`);
  assert.ok(html.includes(`<link rel="canonical" href="${canonicalBase}/library${slug}"`), `canonical ${slug}`);
  assert.ok(html.includes('application/ld+json'));
  if (!slug) for (const entry of FREE_STARTERS) assert.ok(html.includes(`href="${entry.href}"`), `catalog direct link: ${entry.id}`);
  if (slug) {
    const chapter = LIBRARY_CHAPTERS.find((chapter) => `/${chapter.slug}` === slug)!;
    assert.ok(html.includes('Этапы занятия'), `visible lesson stages ${slug}`);
    for (const section of raw.sections.filter((section) => section.source === chapter.source && section.page >= chapter.start && section.page <= chapter.end)) {
      assert.ok(html.includes(`href="#${section.code.toLowerCase()}"`), `direct block link ${section.code}`);
      assert.ok(html.includes(`id="${section.code.toLowerCase()}"`), `anchor target ${section.code}`);
    }
  }
  assert.ok(sitemap.includes(`/library${slug}<`), `sitemap ${slug}`);
}
for (const file of LIBRARY_DOWNLOADS) {
  const response = await fetch(`${base}${file.href}`);
  assert.equal(response.status, 200);
  assert.ok(response.headers.get('content-type')?.includes('pdf'));
}
assert.equal((await fetch(`${base}/library/not-a-real-chapter`)).status, 404);
console.log(`PASS: ${LIBRARY_CHAPTERS.length} chapters, 198 sections, 322 unique exercises, 24 Task 2 / 6 Task 1 texts, digests, HTTP/SEO/sitemap/downloads/404`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
