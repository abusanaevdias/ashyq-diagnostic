import { BLOG_POSTS, type BlogPost } from '../src/data/blog';

const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const EXPECTED_ORIGIN = (process.env.EXPECTED_ORIGIN ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const STATIC_CANONICAL_ROUTES = [
  '/',
  '/about',
  '/blog',
  '/career',
  '/career/intj',
  '/community',
  '/contacts',
  '/courses',
  '/courses/ielts',
  '/courses/sat',
  '/courses/ielts/lessons',
  '/courses/sat/lessons',
  '/courses/ielts/lessons/how-ielts-works',
  '/diagnostic',
  '/faq',
  '/privacy',
  '/program',
  '/progress',
  '/season',
  '/season/current',
  '/terms',
] as const;

const CANONICAL_ROUTES = [...new Set([
  ...STATIC_CANONICAL_ROUTES,
  ...BLOG_POSTS.map((post) => `/blog/${post.slug}`),
])];

const NOINDEX_ROUTES = ['/season/current', '/crm'] as const;

function attribute(tag: string, name: string): string | null {
  return tag.match(new RegExp(`${name}="([^"]+)"`, 'i'))?.[1] ?? null;
}

function tags(html: string, name: string): string[] {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
}

async function checkCanonical(route: string) {
  const response = await fetch(`${BASE_URL}${route}`);
  if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`);
  const html = await response.text();
  const canonicals = tags(html, 'link').filter((tag) => attribute(tag, 'rel') === 'canonical');
  if (canonicals.length !== 1) throw new Error(`${route}: expected one canonical, got ${canonicals.length}`);

  const actual = attribute(canonicals[0], 'href');
  const expected = new URL(route, `${EXPECTED_ORIGIN}/`).toString();
  const normalize = (value: string) => value.replace(/\/$/, '');
  if (!actual || normalize(actual) !== normalize(expected)) {
    throw new Error(`${route}: canonical ${actual}, expected ${expected}`);
  }

  const ogImage = tags(html, 'meta').find((tag) => attribute(tag, 'property') === 'og:image');
  if (!ogImage || !attribute(ogImage, 'content')) throw new Error(`${route}: og:image is missing`);
  console.log(`PASS canonical ${route} -> ${actual}`);
}

async function checkNoindex(route: string) {
  const response = await fetch(`${BASE_URL}${route}`);
  const html = await response.text();
  const robots = tags(html, 'meta').find((tag) => attribute(tag, 'name') === 'robots');
  if (!robots || !attribute(robots, 'content')?.includes('noindex')) throw new Error(`${route}: noindex is missing`);
  console.log(`PASS noindex ${route}`);
}

async function checkOgImage(route = '/opengraph-image') {
  const response = await fetch(`${BASE_URL}${route}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!response.ok || response.headers.get('content-type') !== 'image/png') throw new Error(`OG image ${route}: HTTP ${response.status} ${response.headers.get('content-type')}`);
  if (!signature.every((value, index) => bytes[index] === value)) throw new Error(`OG image ${route}: invalid PNG signature`);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (width !== 1200 || height !== 630) throw new Error(`OG image ${route}: ${width}x${height}, expected 1200x630`);
  console.log(`PASS OG image ${route} ${width}x${height}, ${bytes.byteLength} bytes`);
}

/**
 * Профили «Компаса» переопределяют корневую картинку своей: результатом
 * делятся ссылкой, и превью должно показывать конкретный профиль.
 */
async function checkCareerOgImage(route: string) {
  const html = await (await fetch(`${BASE_URL}${route}`)).text();
  const ogImage = tags(html, 'meta').find((tag) => attribute(tag, 'property') === 'og:image');
  const src = ogImage ? attribute(ogImage, 'content') : null;
  if (!src || !src.includes(`${route}/opengraph-image`)) {
    throw new Error(`${route}: og:image ${src ?? '—'}, expected own image under ${route}`);
  }
  await checkOgImage(new URL(src).pathname);
}

/** JSON-LD Schema.org (SEO-SCHEMA-001): блок разбирается как JSON и содержит нужный @type. */
async function checkJsonLd(route: string, type: string) {
  const html = await (await fetch(`${BASE_URL}${route}`)).text();
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]) as { '@type'?: string });
  if (!blocks.some((block) => block['@type'] === type)) throw new Error(`${route}: JSON-LD ${type} is missing (found: ${blocks.map((b) => b['@type']).join(', ') || 'none'})`);
  console.log(`PASS JSON-LD ${type} ${route}`);
}

async function checkEditorialArticle(post: BlogPost) {
  const route = `/blog/${post.slug}`;
  const response = await fetch(`${BASE_URL}${route}`);
  if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`);
  const html = await response.text();
  const robots = tags(html, 'meta').find((tag) => attribute(tag, 'name') === 'robots');
  if (attribute(robots ?? '', 'content')?.includes('noindex')) throw new Error(`${route}: published article is noindex`);
  const language = post.language ?? 'ru';
  if (!tags(html, 'article').some((tag) => attribute(tag, 'lang') === language)) {
    throw new Error(`${route}: article language is missing or not ${language}`);
  }

  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
  if (!title?.trim()) throw new Error(`${route}: title metadata is missing`);
  const description = tags(html, 'meta').find((tag) => attribute(tag, 'name') === 'description');
  if (!description || !attribute(description, 'content')?.trim()) throw new Error(`${route}: description metadata is missing`);

  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]) as { '@type'?: string; headline?: string; inLanguage?: string });
  const blogPosting = jsonLd.find((block) => block['@type'] === 'BlogPosting');
  if (!blogPosting) throw new Error(`${route}: BlogPosting JSON-LD is missing`);
  if (blogPosting.inLanguage !== language) throw new Error(`${route}: BlogPosting language ${blogPosting.inLanguage ?? '—'}, expected ${language}`);
  if (blogPosting.headline !== post.title) throw new Error(`${route}: BlogPosting headline does not match the published title`);

  const editorialImages = tags(html, 'img').filter((tag) => attribute(tag, 'src')?.includes('/blog/'));
  for (const image of editorialImages) {
    const src = attribute(image, 'src');
    if (!attribute(image, 'alt')?.trim()) throw new Error(`${route}: editorial image has no descriptive alt text (${src ?? 'unknown source'})`);
    const assetPath = new URL(src!, BASE_URL).pathname;
    const assetResponse = await fetch(`${BASE_URL}${assetPath}`);
    if (!assetResponse.ok) throw new Error(`${route}: editorial image ${assetPath} returned HTTP ${assetResponse.status}`);
  }

  const sitemap = await fetch(`${BASE_URL}/sitemap.xml`);
  if (!sitemap.ok || !(await sitemap.text()).includes(route)) throw new Error(`${route}: sitemap entry is missing`);
  const blog = await (await fetch(`${BASE_URL}/blog`)).text();
  if (!blog.includes(`href="${route}"`)) throw new Error(`${route}: blog index link is missing`);
  console.log(`PASS published article ${route}: indexable, ${language}, metadata, BlogPosting, ${editorialImages.length} image(s), linked from blog and in sitemap`);
}

async function main() {
  await checkJsonLd('/', 'EducationalOrganization');
  await checkJsonLd('/courses/ielts', 'Course');
  await checkJsonLd('/faq', 'FAQPage');
  for (const post of BLOG_POSTS) {
    const route = `/blog/${post.slug}`;
    await checkJsonLd(route, 'BlogPosting');
    await checkEditorialArticle(post);
  }
  for (const route of CANONICAL_ROUTES) await checkCanonical(route);
  for (const route of NOINDEX_ROUTES) await checkNoindex(route);
  await checkOgImage();
  await checkCareerOgImage('/career');
  await checkCareerOgImage('/career/intj');
  console.log(`PASS SEO metadata: ${CANONICAL_ROUTES.length} canonical routes`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
