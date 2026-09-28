# PRESS-KIT-027

Public `/press` is a narrow editorial-review entry point. It reuses the existing
business email, description, library download list and native practice parser;
42 chapters and the 322 / 148 automatic / 174 comparison counts are computed
from source-backed practice instead of maintained as a separate marketing total.
The existing PDF assets remain unchanged. Direct Reading practice points to the
real `#r01-b` section; the page also links to preliminary diagnostics, native
Writing Lab, grammar, open SAT lessons, sources and authored-band limitations.

No homepage, navigation, course, library, trainer, blog, account, student-data or
Search Console behavior changed. A single `SITE_ROUTES` addition registers
`/press` in the existing sitemap. No editorial endorsement, independent outcome
proof, official exam score, arbitrary-essay AI grading or search/AI recommendation
is claimed. No external outreach is performed by this page.

## Focused verification

Run `npm run lint`, `npm run typecheck`, `npm run build`. Against the production
build on port 3034: `BASE_URL=http://127.0.0.1:3034 npx tsx scripts/press-check.ts`.
The focused check covers indexability/canonical, source counts/limitations,
public email, all local editorial links, PDF responses, sitemap, WCAG A/AA axe
and no horizontal overflow at 1440/390/320, actual Reading answer checking,
diagnostic navigation and uncaught browser errors. Screenshots remain under
ignored `screenshots/press-*.png`. `npm run check:library` verifies unchanged
source/PDF fidelity; `npm run check:seo` covers existing public routes.

PR review is required before merge/deploy. Technical indexability is not
confirmed indexing, visibility, earned coverage or campaign success.
