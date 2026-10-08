import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { prefersMarkdown } from '../src/lib/agent-content';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
let checks = 0;
const pass = (name: string) => { checks++; console.log(`PASS ${name}`); };

async function read(path: string, accept = 'text/markdown') {
  const response = await fetch(new URL(path, base), { headers: { Accept: accept } });
  const body = await response.text();
  return { response, body };
}

function markdown(response: Response, body: string, status: number) {
  assert.equal(response.status, status);
  assert.match(response.headers.get('content-type') ?? '', /^text\/markdown(?:;|$)/i);
  assert(response.headers.get('vary')?.toLowerCase().split(/\s*,\s*/).includes('accept'));
  assert(body.trim().length >= 20);
  assert.match(body, /^# /);
  assert(!body.includes('<!DOCTYPE html>'));
}

async function main() {
  for (const [accept, expected] of [
    [null, false], ['*/*', false], ['text/html', false], ['text/markdown', true],
    ['TEXT/MARKDOWN; charset=utf-8', true], ['text/markdown;q=0', false],
    ['text/markdown;q=0.5, text/html;q=1', false],
    ['text/html;q=0.2, text/markdown;q=0.9', true],
    ['text/markdown;q=nope', false], ['text/markdown;q=1.1', false],
  ] as const) assert.equal(prefersMarkdown(accept), expected, String(accept));
  pass('Accept negotiation preferences and exclusions');

  const home = await read('/');
  markdown(home.response, home.body, 200);
  assert.match(home.body, /ASHYQ.*IELTS.*SAT/);
  assert.match(home.body, /not official IELTS bands or SAT scores/);
  assert.match(home.body, /Writing and Speaking are not scored/);
  pass('homepage Markdown, Vary, identity and diagnostic limits');

  for (const accept of ['text/html', '*/*', 'text/markdown;q=0', 'text/markdown;q=0.1,text/html;q=1']) {
    const { response, body } = await read('/', accept);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /^text\/html/);
    assert.match(body, /<h1[\s>]/);
    assert.match(body, /ASHYQ/);
    assert.match(response.headers.get('link') ?? '', /rel="alternate"; type="text\/markdown"/);
  }
  pass('HTML homepage, wildcard, q=0 and HTML preference preserve UI');

  for (const path of ['/__ora-404-probe-agent-readiness', '/missing/nested/page', '/absent-file.md']) {
    const { response, body } = await read(path);
    markdown(response, body, 404);
    assert.match(body, /\[.*\]\(.*\/(?:llms\.txt|docs\/index\.md|sitemap\.xml)\)/);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex');
  }
  pass('unknown routes and files return linked Markdown 404');
  const html404 = await read('/__ora-404-probe-agent-readiness', 'text/html');
  assert.equal(html404.response.status, 404);
  assert.match(html404.response.headers.get('content-type') ?? '', /^text\/html/);
  assert.match(html404.body, /Такой страницы нет/);
  pass('existing branded HTML 404 preserved');
  const excluded404 = await read('/missing/nested/page', 'text/markdown;q=0');
  assert.equal(excluded404.response.status, 404);
  assert.match(excluded404.response.headers.get('content-type') ?? '', /^text\/html/);
  const missingHead = await fetch(new URL('/missing/nested/page', base), {
    method: 'HEAD', headers: { Accept: 'text/markdown' },
  });
  assert.equal(missingHead.status, 404);
  assert.match(missingHead.headers.get('content-type') ?? '', /^text\/markdown/);
  assert.equal(await missingHead.text(), '');
  pass('404 negotiation excludes q=0 and supports HEAD');

  const resources = ['/index.md', '/llms.txt', '/docs/index.md', '/docs/agent-instructions.md'];
  for (const path of resources) {
    const { response, body } = await read(path);
    markdown(response, body, 200);
    assert.match(body, /ASHYQ/);
    assert.match(response.headers.get('link') ?? '', /rel="describedby"/);
    const head = await fetch(new URL(path, base), { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.match(head.headers.get('content-type') ?? '', /^text\/markdown/);
    assert.equal(await head.text(), '');
  }
  assert.equal((await read('/index.md')).body, home.body);
  const homeHead = await fetch(base, { method: 'HEAD', headers: { Accept: 'text/markdown' } });
  assert.equal(homeHead.status, 200);
  assert.match(homeHead.headers.get('content-type') ?? '', /^text\/markdown/);
  assert.equal(await homeHead.text(), '');
  pass('all Markdown resources and HEAD behavior');

  const llms = (await read('/llms.txt')).body;
  assert.match(llms, /^# ASHYQ\n\n> /);
  assert.equal((llms.match(/^# /gm) ?? []).length, 1);
  const sections = llms.split(/^## /m).slice(1);
  for (const section of sections) {
    const lines = section.split('\n').slice(1).filter((line) => line.trim());
    assert(lines.length > 0);
    for (const line of lines) assert.match(line, /^- \[[^\]]+\]\(https?:\/\/[^)]+\)(?:: .+)?$/);
  }
  const instructions = (await read('/docs/agent-instructions.md')).body;
  assert.match(instructions, /## When to use this/);
  assert.match(instructions, /## How an agent should call/);
  assert.match(instructions, /explicit consent/);
  pass('llms.txt format and actionable when-to-use guidance');

  for (const path of ['/docs', '/docs/index.md', '/docs/agent-instructions.md', '/index.md', '/llms.txt']) {
    const body = (await read(path, 'text/html')).body;
    for (const match of body.matchAll(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g)) {
      const url = new URL(match[1]);
      const target = await fetch(new URL(url.pathname + url.search, base));
      assert.equal(target.status, 200, `broken resource link ${match[1]}`);
    }
  }
  const docs = await read('/docs', 'text/html');
  assert.match(docs.body, /<title>ASHYQ developer documentation/);
  assert.match(docs.body, /<h1[^>]*>ASHYQ developer documentation/);
  assert.match(docs.body, /rel="canonical"[^>]*\/docs/);
  const robots = await read('/robots.txt', 'text/plain');
  assert.equal(robots.response.status, 200);
  assert.match(robots.body, /Sitemap:/);
  const sitemap = await read('/sitemap.xml', 'application/xml');
  assert.equal(sitemap.response.status, 200);
  assert.match(sitemap.body, /<loc>[^<]+\/docs<\/loc>/);
  // Verify every indexed public page, rather than only the newly linked ones.
  const urls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)];
  for (const [, url] of urls) {
    const response = await fetch(new URL(new URL(url).pathname, base));
    assert.equal(response.status, 200, url);
  }
  pass(`resource links, docs identity, robots and ${urls.length} sitemap endpoints`);

  for (const path of ['/api/health', '/api/validate']) {
    const { response, body } = await read(path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /^application\/json/);
    assert.doesNotThrow(() => JSON.parse(body));
  }
  for (const path of ['/api/crm', '/api/leads']) {
    const { response } = await read(path);
    assert.equal(response.status, 404, `${path}: unauthenticated access must remain hidden`);
    assert(!response.headers.get('content-type')?.startsWith('text/markdown'));
  }
  const course = await read('/courses/sat');
  assert.equal(course.response.status, 200);
  assert.match(course.response.headers.get('content-type') ?? '', /^text\/html/);
  const forged = await fetch(new URL('/__ora-404-probe-agent-readiness', base), {
    headers: { Accept: 'text/html', 'x-ashyq-markdown': '1' },
  });
  assert.equal(forged.status, 404);
  assert.match(forged.headers.get('content-type') ?? '', /^text\/html/);
  pass('API contracts and caller-supplied fallback marker preserved');

  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  try {
    const page = await browser.newPage();
    await page.goto(`${base}/search`);
    await page.getByRole('textbox').fill('vercel');
    const link = page.getByRole('link', { name: /ASHYQ developer documentation/ });
    await link.waitFor();
    assert.equal(await link.getAttribute('href'), '/docs');
    await link.click();
    await page.getByRole('heading', { level: 1, name: 'ASHYQ developer documentation' }).waitFor();
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    }
    await page.goto(`${base}/?start=sat`);
    await page.getByRole('heading', { name: /Какой результат тебе нужен/ }).waitFor();
    pass('name-based developer search, docs navigation/layout and SAT deep link');
  } finally { await browser.close(); }
  console.log(`${checks}/${checks} agent readiness groups passed`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
