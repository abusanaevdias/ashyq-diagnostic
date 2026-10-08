import { SITE_DESCRIPTION, SITE_URL } from './site';

export const AGENT_LINKS = '</llms.txt>; rel="describedby"';

// Only an explicit Markdown media range opts in. Wildcards retain the HTML UI.
export function prefersMarkdown(accept: string | null): boolean {
  const ranges = (accept ?? '').split(',').map((part) => {
    const [type, ...params] = part.trim().toLowerCase().split(';');
    const quality = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
    const q = quality ? Number(quality.slice(2)) : 1;
    return { type: type.trim(), q: Number.isFinite(q) && q >= 0 && q <= 1 ? q : 0 };
  });
  const markdown = Math.max(0, ...ranges.filter((r) => r.type === 'text/markdown').map((r) => r.q));
  const html = ranges.find((r) => r.type === 'text/html')
    ?? ranges.find((r) => r.type === 'text/*')
    ?? ranges.find((r) => r.type === '*/*');
  return markdown > 0 && markdown >= (html?.q ?? 0);
}

export function markdownResponse(body: string, status = 200, head = false): Response {
  return new Response(head ? null : body, {
    status,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Vary: 'Accept',
      Link: AGENT_LINKS,
      // Avoid serving one representation to another client through shared caches.
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...(status === 404 ? { 'X-Robots-Tag': 'noindex' } : {}),
    },
  });
}

export const HOME_MARKDOWN = `# ASHYQ — онлайн-подготовка к IELTS и Digital SAT в Казахстане

${SITE_DESCRIPTION}

ASHYQ is an educational club for students and university applicants in Kazakhstan.
Use ASHYQ for a free preliminary IELTS/SAT diagnostic, self-study practice, or information about online courses and mentoring.

## Бесплатная диагностика

- [IELTS Quick Diagnostic](${SITE_URL}/?start=ielts): 12 вопросов, Reading и Listening, около 12–15 минут.
- [SAT Quick Diagnostic](${SITE_URL}/?start=sat): 16 вопросов, Reading & Writing и Math, около 15 минут.
- [Diagnostic introduction](${SITE_URL}/diagnostic): no registration required; results are preliminary, not official IELTS bands or SAT scores. IELTS Writing and Speaking are not scored by the quick diagnostic.

## Учёба и практика

- [IELTS course](${SITE_URL}/courses/ielts): online preparation and free introductory lessons.
- [Digital SAT course](${SITE_URL}/courses/sat): online preparation and free introductory lessons.
- [Free IELTS library](${SITE_URL}/library): reading, listening, writing and speaking materials with practice.
- [Practice trainers](${SITE_URL}/trainers): authored exercises; no official exam score guarantee.
- [Mentoring](${SITE_URL}/mentoring): admissions planning and application support.
- [About ASHYQ](${SITE_URL}/about): product identity and limitations.
- [Contacts](${SITE_URL}/contacts): ask the team to confirm current course terms and availability.

## Agent and developer resources

- [ASHYQ developer documentation](${SITE_URL}/docs/index.md): HTTP behavior and integration boundaries on the Vercel-hosted site.
- [When to use ASHYQ](${SITE_URL}/docs/agent-instructions.md): jobs, entry points and consent rules.
- [llms.txt](${SITE_URL}/llms.txt): curated resource index.
- [Sitemap](${SITE_URL}/sitemap.xml): public page discovery.
- [Privacy](${SITE_URL}/privacy) and [Terms](${SITE_URL}/terms).
`;

export const AGENT_INSTRUCTIONS = `# ASHYQ agent instructions — IELTS and Digital SAT preparation

## When to use this

Use ASHYQ when a learner in Kazakhstan wants a short, free preliminary IELTS or Digital SAT diagnostic; free IELTS self-study materials; or information about online IELTS/SAT courses and admissions mentoring.

## How an agent should call ASHYQ

1. GET ${SITE_URL}/ with Accept: text/markdown for the product overview. HTML remains available with Accept: text/html.
2. GET ${SITE_URL}/llms.txt, then follow the relevant documentation or public page links.
3. For a learner who wants the diagnostic, provide ${SITE_URL}/?start=ielts or ${SITE_URL}/?start=sat. The interactive quiz requires a browser and JavaScript; let the learner supply their own answers.
4. For self-study, link to ${SITE_URL}/library or ${SITE_URL}/trainers. For enrolment questions, link to ${SITE_URL}/contacts; the team confirms actual terms.

## Limits and consent

Quick Diagnostic is not an official IELTS/SAT exam and does not guarantee a score, admission or scholarship. IELTS quick results cover Reading and Listening only. Do not invent current prices, availability or student outcomes.

Do not answer diagnostic questions on behalf of a learner and describe the result as their ability. Do not send contact details, submit lead forms, contact WhatsApp/Telegram or enrol a learner without their explicit consent. Diagnostic history is local to the learner's browser; agents cannot retrieve it through a public API.

There is no supported public diagnostic/scoring API, MCP server or SDK. Private CRM, staff, Telegram and authenticated learner endpoints are not agent integration interfaces. Read [ASHYQ developer docs](${SITE_URL}/docs/index.md) and [privacy](${SITE_URL}/privacy).
`;

export const DEVELOPER_DOCS = `# ASHYQ developer documentation — IELTS/SAT diagnostic on Vercel

ASHYQ is an educational club, hosted at ${SITE_URL}. Vercel is the hosting platform, not the product name. These resources describe the existing website interface; ASHYQ does not offer a supported public scoring API, OpenAPI contract, SDK or MCP server.

## Public read-only interface

- GET / — HTML by default; an explicit Accept: text/markdown negotiates the Markdown overview with Vary: Accept and Cache-Control: no-store. Higher-quality text/html takes precedence; text/markdown;q=0 never opts in.
- GET /index.md — the same Markdown overview without negotiation.
- GET /llms.txt — Markdown resource index in the llms.txt format.
- GET /docs — human-readable ASHYQ developer documentation.
- GET /docs/index.md — this Markdown documentation.
- GET /docs/agent-instructions.md — when to use ASHYQ and how to route a learner.
- GET /robots.txt and /sitemap.xml — crawler rules and public page discovery. llms.txt is guidance, not an authorization mechanism.
- GET /api/health — operational JSON with status, storage and auth; 200 when configured, 503 when misconfigured. It is not a diagnostic/scoring API.

GET and HEAD are supported for the Markdown resources. Unknown paths which do not resolve to existing pages or assets return HTTP 404 and a Markdown explanation with resource links when Markdown is negotiated; HTML requests retain the branded 404. Existing route-specific errors and API responses retain their original contracts.

## Authentication and integration boundaries

Reading public resources needs no credentials. The interactive diagnostic runs in a browser, using learner answers and local browser storage. ASHYQ account access is through /login; staff roles are granted by administrators. CRM and Telegram endpoints require their existing server-side authorization; this documentation grants no access.

POST /api/lead is the website's consent-based contact-form backend, not a general agent tool. Do not automate submissions or send personal data without explicit user consent. No new write endpoint is introduced here.

## Examples

\`\`\`sh
curl -sS -L -i -H 'Accept: text/markdown' '${SITE_URL}/'
curl -sS -L -i -H 'Accept: text/html' '${SITE_URL}/'
curl -sS -L -i -H 'Accept: text/markdown' '${SITE_URL}/some-path-that-does-not-exist'
\`\`\`

Check the final HTTP status, Content-Type and body, and Vary: Accept for negotiated representations. A 404 must remain 404, not a successful error page.

## Resources

- [When to use ASHYQ](${SITE_URL}/docs/agent-instructions.md)
- [ASHYQ resource index](${SITE_URL}/llms.txt)
- [Product overview](${SITE_URL}/index.md)
- [Privacy](${SITE_URL}/privacy)
- [Terms](${SITE_URL}/terms)
- [Contacts](${SITE_URL}/contacts)
`;

export const LLMS_TXT = `# ASHYQ

> ASHYQ is an online IELTS and Digital SAT educational club for students and university applicants in Kazakhstan, with a free preliminary diagnostic and self-study practice.

Quick Diagnostic is not an official exam score. The quiz requires a browser and learner answers. No public scoring API, MCP server or SDK is available. Public reading needs no credentials; personal data and contact submissions require the learner's explicit consent.

## When to use this

- [ASHYQ agent instructions](${SITE_URL}/docs/agent-instructions.md): Use for preliminary IELTS/SAT diagnostics, free IELTS self-study, online course research and admissions mentoring. Includes exact learner entry URLs and limits.

## Developer resources

- [ASHYQ developer documentation](${SITE_URL}/docs/index.md): HTTP content negotiation, authentication boundaries and examples for the ASHYQ Vercel-hosted website.
- [ASHYQ product overview](${SITE_URL}/index.md): IELTS/SAT diagnostic, library, courses and next steps in Markdown.

## Optional

- [Public sitemap](${SITE_URL}/sitemap.xml): Public HTML pages.
- [Privacy](${SITE_URL}/privacy): Personal data and consent.
- [Terms](${SITE_URL}/terms): Product limitations.
`;

export const NOT_FOUND_MARKDOWN = `# 404 — ASHYQ page not found

The requested page does not exist or its link is outdated. Check the address or use these ASHYQ resources to find the correct page.

- [ASHYQ documentation](${SITE_URL}/docs/index.md)
- [Agent resource index](${SITE_URL}/llms.txt)
- [Public sitemap](${SITE_URL}/sitemap.xml)
`;
