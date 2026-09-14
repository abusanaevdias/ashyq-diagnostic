const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const EXPECTED_ORIGIN = (process.env.EXPECTED_ORIGIN ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const CANONICAL_ROUTES = [
  '/',
  '/about',
  '/blog',
  '/community',
  '/contacts',
  '/courses',
  '/courses/ielts',
  '/courses/sat',
  '/diagnostic',
  '/faq',
  '/privacy',
  '/program',
  '/progress',
  '/season',
  '/season/current',
  '/terms',
] as const;

const NOINDEX_ROUTES = ['/blog', '/season/current', '/crm'] as const;

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

async function checkOgImage() {
  const response = await fetch(`${BASE_URL}/opengraph-image`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!response.ok || response.headers.get('content-type') !== 'image/png') throw new Error(`OG image: HTTP ${response.status} ${response.headers.get('content-type')}`);
  if (!signature.every((value, index) => bytes[index] === value)) throw new Error('OG image: invalid PNG signature');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (width !== 1200 || height !== 630) throw new Error(`OG image: ${width}x${height}, expected 1200x630`);
  console.log(`PASS OG image ${width}x${height}, ${bytes.byteLength} bytes`);
}

async function main() {
  for (const route of CANONICAL_ROUTES) await checkCanonical(route);
  for (const route of NOINDEX_ROUTES) await checkNoindex(route);
  await checkOgImage();
  console.log(`PASS SEO metadata: ${CANONICAL_ROUTES.length} canonical routes`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
