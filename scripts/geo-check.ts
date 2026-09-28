/** Public, read-only GEO trust regression; no search submissions or private data. */
import assert from 'node:assert/strict';
import { CONTACT_EMAIL, SITE_FULL_NAME } from '../src/lib/site';

const base = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

async function read(route: string, userAgent?: string) {
  const response = await fetch(`${base}${route}`, {
    headers: userAgent ? { 'user-agent': userAgent } : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  assert.equal(response.status, 200, `${route}: HTTP status`);
  return response.text();
}

function schemas(html: string) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]) as Record<string, unknown>);
}

async function main() {
  const routes = ['/', '/about', '/diagnostic', '/contacts', '/program', '/courses', '/mentoring'];
  for (const route of routes) {
    const html = await read(route);
    assert(!/12[ \u00a0]?000\+|>4\.8<|90%|год основания|Est\. 2024/.test(html), `${route}: unsupported club statistics`);
    assert(!html.includes('какой балл вы получили бы сегодня'), `${route}: unsupported exam score prediction`);
    assert(!/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/.test(html), `${route}: noindex`);
    const organization = schemas(html).find((item) => item['@type'] === 'EducationalOrganization');
    assert(organization, `${route}: organization missing`);
    assert.equal(organization.alternateName, SITE_FULL_NAME);
    assert.equal(organization.email, CONTACT_EMAIL);
    assert(!('aggregateRating' in organization || 'foundingDate' in organization), `${route}: unverified structured proof`);
    console.log(`PASS ${route}: public, precise organization, no unsupported aggregate proof`);
  }
  const about = await read('/about');
  const organization = schemas(about).find((item) => item['@type'] === 'EducationalOrganization')!;
  const aboutPage = schemas(about).find((item) => item['@type'] === 'AboutPage');
  assert.equal((aboutPage?.mainEntity as { '@id'?: string })?.['@id'], organization['@id']);
  assert(about.includes('без оценки Writing и Speaking') && about.includes('не полный адаптивный экзамен'));
  assert(about.includes(`href="mailto:${CONTACT_EMAIL}"`));
  const contacts = await read('/contacts');
  assert(contacts.includes(`href="mailto:${CONTACT_EMAIL}"`));
  assert(contacts.includes('Telegram — связь с командой') && contacts.includes('Telegram-канал'));
  assert((await read('/')).includes('Иллюстративный пример, не результат ученика'));
  const courses = await read('/courses');
  assert(courses.includes('независимый аудит статистики не проведён') && courses.includes('не подтверждают среднее'));
  assert(courses.includes('Период оплаты, применимость цены') && courses.includes('не обновляется автоматически'));
  assert(courses.includes('Группа 08') && courses.includes('21:00–23:00'));
  for (const id of [1, 2, 3, 5]) assert.equal((await fetch(`${base}/images/results/cohort-result-${id}.jpg`)).status, 200);
  const robots = await read('/robots.txt');
  assert(/User-Agent:\s*\*/i.test(robots) && /Allow:\s*\//i.test(robots));
  assert(!/Disallow:\s*\/$/m.test(robots), 'public crawler access disallowed');
  // A simulated header checks HTTP compatibility only, not actual crawler IP access or indexing.
  await read('/about', 'Mozilla/5.0 compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot');
  console.log('PASS about identity/limits/email, visible sample label, robots and simulated search-agent HTTP');
  console.log('NOT MEASURED: actual crawler visits, Google/Bing indexing, search rank or ChatGPT recommendations.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
