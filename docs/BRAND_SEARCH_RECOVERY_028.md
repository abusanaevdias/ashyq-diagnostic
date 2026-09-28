# Brand search recovery — 2026-09-28

## Evidence and limits

Owner reports that `ashyq` used to put this site first in Google. No historical comparable SERP or Search Console export establishes when or why this changed.

Real Chrome Google checks, including its “Try without personalisation” action: site absent from the first page for `ashyq`; results dominated by the unrelated COVID Ashyq application. `site:ashyq-diagnostic.vercel.app` still returns the root. This is not proof that all URLs are indexed, or that earlier edits caused the ranking change.

Public root before this patch: HTTP 200, self-canonical, no noindex, root in sitemap; correct brand title already present, but no WebSite identity node and no ASHYQ in H1. Google still displayed the earlier diagnostic title. Do not confuse site-name guidance with a ranking guarantee or a proven regression.

## Narrow intervention

- Preserve existing brand title; give home its own explicit metadata aligned with current free entry points, without changing child-route defaults.
- Put ASHYQ visibly in home H1 and clarify the actual educational offering.
- Render one WebSite node on the root, with ASHYQ, the already-used alternative name, canonical URL and the existing organization publisher ID.
- Add server-HTML regression checks for name, H1/title, indexability, canonical/sitemap, free entry links and both existing Google ownership tokens.
- No host migration, fabricated reputation, backlink campaign, private-route indexing, diagnostic-state changes or rollback of truthful offer/library work.

Official source: [Google Search Central: site names](https://developers.google.com/search/docs/appearance/site-names). Google considers home headings/title/og:site_name alongside WebSite structured data; site-name processing is automated and may require recrawling. This source does not promise higher ranking.

## Remaining measurement / owner handoff

SEO-GSC-INDEX-015 owns Search Console submissions. The previously verified account recorded in the ledger is not signed into this Chrome session; no new verification or request is performed here. In the existing property, compare exact-brand query clicks/impressions/position before and after changes; inspect last crawl, Google-selected canonical, page-indexing and manual/security reports. Request a homepage recrawl once only if available and appropriate. Preserve actual evidence and quota limits.

Success for the owner's ranking request requires a new comparable real Google `ashyq` observation and Search Console evidence, not merely passing checks or deploying this patch. No deadline or first-place guarantee.
