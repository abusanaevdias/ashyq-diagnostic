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

SEO-GSC-INDEX-015 owns Search Console submissions. Access to the existing property is now confirmed in Chrome as `ashyqhub@gmail.com`; no new ownership verification or indexing request was performed. Root is indexed with the correct selected canonical; indexed crawl Sep25 still has the old diagnostic title. Sep28 23:33 UI Live Test successfully fetched the new homepage title/H1/WebSite with crawling and indexing allowed. A live test does not update the index or establish ranking. Manual/security/removal reports are clear; exact-brand Performance has insufficient data for before-after. Request a homepage recrawl once only after explicit ownership coordination and if Google permits; preserve quota limits and do not duplicate requests. Owner has been asked for a one-step split, not assumed.

Success for the owner's ranking request requires a new comparable real Google `ashyq` observation and Search Console evidence, not merely passing checks or deploying this patch. No deadline or first-place guarantee.

### Homepage request follow-up

The owner subsequently authorized the one-homepage-request split; it was claimed in shared HANDOFF before submission (`bb988af`). The single 28.09 attempt returned **Quota Exceeded**. It was not accepted or queued; there was no duplicate attempt/account switch/bypass. Existing daily heartbeat now has one retry on 29.09 at 10:00 Asia/Almaty, at most one attempt per day, stopping on quota and permanently stopping resubmissions after visible acceptance. Acceptance must be followed by actual indexed crawl/HTML and SERP measurement; it does not establish #1. Other SEO-GSC-INDEX-015 URLs remain with their owner.
