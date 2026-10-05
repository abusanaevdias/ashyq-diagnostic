# Press discovery SEO — 6 October 2026 (Kazakhstan)

## Scope and evidence

The existing `/press` page had no reference to the actual BlueScreen interview published on 5 October. Task 030 already verified its URL, author Жанна Аксентий, date and content, and deployed the original news article. This change adds a contextual path `/press` → original source and own news → `/press`. No new search-demand claim or new article is made.

The press title, description and H1 now identify ASHYQ and the page's purpose: facts, open practice and publications. Existing self-canonical and index/follow settings are retained. The source record is reused rather than duplicating its URL, author or publication date. A semantic `time` element displays the real source date. The news article's update timestamp records the actual UTC editing time; its publication timestamp is preserved.

## Adversarial review

- Coverage is an interview about the product, not a school ranking, audited student result or IELTS endorsement. That boundary is stated visibly.
- No journalist quote, publisher logo, portrait, review score, achievement, volume or search position is invented. No new image is needed.
- Source-derived library totals retain the existing dynamic calculation; the interview's historical numbers are not treated as today's independent audit.
- Anchor texts describe their destinations. Links are normal server-rendered anchors and work without JavaScript. No hidden keyword text, new city route or duplicate intent page is added.
- Original source, own news and press-kit page remain distinct. No publisher link is added to `sameAs`.
- Homepage/WebSite identity, GSC submissions and shared blog design remain owned by their existing tasks and are not changed.

## Verification plan

Run lint, typecheck, build, existing press browser check (extended with source/date/author/news-link assertions), SEO check and diff check. Review screenshots at 1440, 390 and 320 px, particularly the long source title and longer H1. After verified merge, confirm the production title/H1/media links, reciprocal article link and self-canonical. GitHub CI is required before merge. Deployment, sitemap membership and these checks do not prove indexing, brand-rank recovery or AI citation.

## Next safe steps

Existing GSC owners can inspect the new news URL and monitor a newer indexed homepage crawl. Do not duplicate the homepage request assigned to task 028. The current GSC/Google read-only observations are in the local evidence folder `seo-2026-10-06`; they are point-in-time observations, not ranking promises.
