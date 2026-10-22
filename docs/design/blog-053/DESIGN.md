# BLOG-REDESIGN-001 / release 053

## Brief and ownership

The owner approved the earlier editorial hybrid in thread
01a0e7d0-9f77-7851-bffe-ff65f630ccd8 and explicitly authorized this chat to finish
and deploy it on 22 October 2026. Main claim1dfed53 records the transfer before
implementation. Worktree: ashyq-blog-redesign-053; branch:
codex/blog-redesign-release-053. Original uncommitted worktree is untouched.

The two original files are also copied into ignored .data/blog-053-original:

- BlogV3.tsx SHA256 DFCC3624FB0FA451F15CD960F39CA2903531ADA59EC37CCC441834BE6852E41B
- BlogV3.module.css SHA256 147C19BB824FDC77582FF272DF63E954266F0DA3843471D49BBAACF760B6798D

## Approved concept

Idea: a readable ASHYQ journal for exam preparation and admissions.
Metaphor: an editorial front page with a masthead, newest story and article grid.
Signature: oversized black БЛОГ with a red punctuation mark, then real covers.
Emotion: direct, useful, easy to browse.
Motion verb: a small lift on hover and immediate pressed feedback.
Screenshot: the masthead, category/search controls and leading article.

This is completion of an approved concept, not another concept-selection round.
Reference artifacts: the existing blog-concepts/hybrid.html and
hybrid-desktop.png / hybrid-mobile.png under the original thread's visualization
directory. They are concept evidence, not screenshots of the final application.

## System and composition

Use the existing Next.js App Router, React client component and CSS Modules;
retain current typography, design/tokens.css colors, radii and shared navigation.
No new dependency, font, external asset or animation engine is introduced.
Apple-design guides immediate feedback, legibility and reduced motion;
awwwards guides editorial composition and evidence-based outside review.

The page deliberately stays still at rest so the articles and covers remain
readable. Existing shared motion is retained. Hover uses transform-only image
and arrow movement; reduced motion removes those transitions. No loader or
scroll interception is added.

Layout: masthead -> wrapping category controls/search -> featured image/copy
split -> four-column article grid -> existing information/CTA band/footer.
At900px the feature stacks and grid becomes three columns; at600px two columns;
at360px a single column. All categories remain visible through wrapping. Short
shared study-navigation labels get blog-scoped mobile padding/nowrap only.

## Preserved contracts

- getRepos().blog.listPublished(), defaultPosts fallback, repository ordering;
- published article data, sources, routes, metadata and sitemap;
- category/search state and existing input/button accessible names;
- prior client-loaded device-local date rendering, with reserved date space;
- reader/saved-list storage, auth, roles, classroom and AI behavior;
- all public redesign051/052 changes stay in their separate draft PRs.

Cover paths still pass through postCover. SVG diagrams use contain, raster covers
use cover; no invented editorial recommendation or content label is attached.
An empty result offers a local reset of the same search/category controls.

## Validation and release evidence

Read installed Next16.3.5 CSS Modules and use-client guides before edits. Install
real local node_modules with locked npm ci, avoiding the old worktree junction.
Use local lint/build and existing automatic PR CI without weakening its checks.
Record exact-head results, original CI screenshots and independent review in the
release PR before merging. The user's deployment authorization is explicit.

CUA returned empty apps/browsers during this task. Do not use shell browser
automation as a substitute or claim real-device/manual interaction acceptance.
CI mobile structural audits, actual CI images and source review have distinct
limits. No award score or physical-phone/FPS certificate is inferred.

After verified merge, inspect the exact Vercel production deployment and canonical
/blog response, article links, metadata and assets. Preserve original worktree
and other agents' changes. Update the main ledger with released source/evidence.
