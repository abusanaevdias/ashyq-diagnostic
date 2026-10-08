# ASHYQ agent readiness 032

The homepage previously served HTML for `Accept: text/markdown`, unknown paths
had no Markdown error body, and agent/developer entry points were missing.
The root now negotiates a product-specific Markdown overview, and a fallback
rewrite produces linked Markdown errors with HTTP 404 after checking existing
routes and assets. The HTML interface, metadata, diagnostic state and private
API contracts are preserved.

## Public resources

- `/` with `Accept: text/markdown`: Markdown, `Vary: Accept`, `Cache-Control: no-store`.
- `/` with `Accept: text/html`: existing HTML UI and framework-managed caching.
- `/index.md`: explicit Markdown version of the overview.
- `/llms.txt`: ASHYQ H1, summary blockquote and H2 file lists, including when-to-use guidance.
- `/docs`: indexable developer page with ASHYQ in title/H1, in sitemap and site search.
- `/docs/index.md`: HTTP interface, examples, account/auth and integration boundaries.
- `/docs/agent-instructions.md`: concrete jobs, diagnostic entry URLs and consent guidance.
- `/agent/not-found`: Markdown 404 handler used by the fallback rewrite.

Existing route-specific errors (for example an invalid dynamic blog slug) and
JSON APIs retain their original contracts. No public scoring API, SDK, MCP
server or fictional OpenAPI spec has been added. Vercel is identified as the
hosting platform, not the product name.

## Reproduce verification

Use Node 24 and the existing isolated checkout; no extra worktree is required.

```sh
cd /workspace/ashyq-diagnostic
npm ci --cache /tmp/ashyq-npm-cache --no-audit --no-fund
npm run build
npm run start
# In a second terminal, with the production server still running:
BASE_URL=http://127.0.0.1:3000 npx tsx scripts/agent-readiness-check.ts
```

The focused test uses pinned Playwright Chromium in CI. This cloud machine has
Chromium 151 at `/usr/bin/chromium`; use
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` for the focused test here.
The current network policy blocks downloading pinned Chromium 153.

Verified on the final production build:

- Focused agent checks: 11/11 groups, including all 101 sitemap URLs, every new
  Markdown endpoint, linked resources, HEAD, q=0, HTML preference, genuine 404
  status/body, protected API access, site search and SAT deep-link behavior.
- Documentation has no horizontal overflow at 1440, 390 and 320px.
- Lint, TypeScript, question-bank validation (49 questions, zero errors or
  warnings), six existing unit suites and SEO (39 canonical pages) passed.
- Existing `scripts/e2e-check.ts`: 152/152 passed using system Chromium 151
  with reduced motion. A prior normal-motion run timed out at the existing
  Compass button stability check. Authenticated CRM checks were not enabled.
- Free-library HTTP/content checks: 42 chapters and 322 exercises passed.
  Practice units and practice browser checks also passed, run separately with
  explicit `BASE_URL` after the npm chain's library default port was diagnosed.
- `scripts/agent-readiness-check.ts` is included in the existing CI workflow.
  Hosted CI has not been observed for this branch.

## Remaining external work

Deploy the feature branch through the existing review/release process, then run:

```sh
curl -sS -L -i -H 'Accept: text/markdown' https://ashyq-diagnostic.vercel.app/
curl -sS -L -i -H 'Accept: text/html' https://ashyq-diagnostic.vercel.app/
curl -sS -L -i -H 'Accept: text/markdown' https://ashyq-diagnostic.vercel.app/some-path-that-does-not-exist
```

Verify the final status, MIME type, Markdown body and `Vary: Accept` on Markdown
responses. Check all new resources, robots and sitemap after deployment.
Public-site requests and GitHub API access currently return network-policy
403 errors; native Git reads/pushes work. Domain additions and tested npm setup
and startup instructions have been saved to the cloud environment draft;
saving does not apply the policy, deploy this code or publish the environment.

Search rankings, third-party name-search results and a new Is Agentic score
are not established by these local checks. The existing homepage already
identifies ASHYQ and IELTS/SAT in metadata and H1; those are preserved because
brand-recovery and Search Console tasks remain owned in `HANDOFF.md`. Their
owners should verify indexing and exact-brand-plus-product visibility after
release. No duplicate indexing request, fabricated endorsement or external
outreach was made.

Protocol source: the llms.txt v2 proposal, `Format` section, retrieved from
the authoritative AnswerDotAI/llms-txt repository (`nbs/index.qmd`). Markdown
negotiation uses the status/MIME/body/Vary acceptance requirements supplied in
the audit; acceptmarkdown.com itself was blocked by current network policy.
