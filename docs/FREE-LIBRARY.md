# FREE-LIBRARY-025 — native IELTS library

The owner's three V3 PDFs have been adapted into `/library` and 42 static chapter pages. This is a native reading/practice experience, not an iframe or download directory. Full examples, paragraph breaks, exercises, explanations, source codes/pages, hyperlinks and tables are retained. The Task 1 plot and branching book process are accessible native visuals. Original PDFs remain optional, byte-identical downloads.

## Source scope and counts

- Full Library V3: 203 physical pages, comprising the prior V2 volume and the same 91-page Writing Upgrade Lab V3. The importer checks every appended Lab page against the standalone Lab.
- Workbook V3: 39 pages of repeated Lab examples/exercises without answer keys. Download preserved; repeated content is not counted twice.
- 198 substantive source-page blocks across 42 chapters. Covers and duplicate contents pages are replaced with the web catalog.
- 24 complete Task 2 essay versions; 6 Task 1 reports; 322 unique coded exercises (222 V2 + 100 Lab), not 322 official exam questions.
- Author-created approximate band profiles are not examiner-approved scores, real student results, or outcome guarantees. Official links are distinguished from original ASHYQ examples.
- Source claims about the earlier Starter Kit, archive installation and previously checked external players are historical; editorial notes explain that the missing Starter Kit is not published here and player availability is not guaranteed.

## Architecture and privacy

`src/data/free-library.ts` is lightweight chapter metadata used by catalog/search. Full migrated content is in `src/data/free-library-content.json`, imported only through the `server-only` library module. Chapters are statically generated, indexable, have canonical URLs and LearningResource structured data; all chapter URLs are included in the sitemap. This does not prove search indexing or AI recommendations.

Client components provide skill/topic filtering, exercise notes, word counts and copying. Notes live only in React memory: navigation/reload discards them, explicitly stated beside every pad. No autosave, essay submission, API call, AI grading, authentication or new student database. Clipboard failure reveals a manual-copy field. Clear requires confirmation. Browser analytics already on the site are unchanged.

Listening uses only an English `speechSynthesis` voice marked `localService`. No external TTS or copied official recording. If no local voice exists, the UI offers partner reading / official practice links rather than pretending audio played. The tested Chrome environment had no local English voice; that fallback and stop status were verified, not audible playback.

## Checks

```sh
python3 scripts/import-free-library.py /path/to/three-original-pdfs
python3 scripts/free-library-source-check.py
BASE_URL=http://127.0.0.1:3032 npx tsx scripts/free-library-check.ts
BASE_URL=http://127.0.0.1:3032 npm run check:a11y-perf
BASE_URL=http://127.0.0.1:3032 npm run check:tokens
```

Python migration/audit needs `pdfplumber`; importer also uses `pypdf`. They run offline, not in production. The source check compares word multisets for every migrated block and PDF SHA-256/page counts; it is a fidelity check, not a pedagogical certification. Explicit structural assertions cover Speaking column order, essay/key roles, complete chapter coverage and unique exercise codes. Graph and flow are separately visually checked.

The TypeScript check also verifies all 43 page responses, actual canonical tags, indexability, structured data, sitemap membership, three PDF response types and invalid-chapter 404. It is added to CI. The shared axe/Lighthouse gate includes eight representative library routes on desktop/mobile. Chrome manual checks cover responsive views (390/320 px), search/category filtering, native lesson content, closed/open keys, word counts/copying, reload-loss behavior and console errors. No production lead forms, CRM or external source accounts are mutated by these checks.

The owned writing drills, blog redesign and Search Console work are not modified. Shared course catalog, mobile menu, footer and site search only receive discoverability links.

## First-screen discoverability expansion

The owner explicitly expanded the task after finding the existing materials difficult to discover. The homepage now has a named free-resource panel with four direct starts, rather than a decorative hero photograph. The mobile layout prioritizes those practice cards; diagnostic buttons remain in the hero and the diagnostic flow is unchanged. The shared desktop navigation exposes `Бесплатно`, while mobile has a visible free-materials strip outside the closed menu. The program link remains in the menu/footer.

`/library` now opens with eight direct, unfiltered entry cards: Writing Lab, Reading, Speaking, SAT introduction, Listening, grammar, SAT Math and the existing Writing trainer. Links also expose Task 1, the 21-day route, diagnostic and offline downloads. Topic search is optional. The 322 exercise count is explicitly IELTS-only; existing SAT open lessons are separate.

The E2E first-fold contract was intentionally updated to assert the direct free Writing Lab card and always-visible mobile free entry, reflecting the owner's new priority. Diagnostic and course flow checks are retained, not bypassed. Link integrity additionally checks every direct start and the four homepage links. Visibility is a measured layout/property, not a claim about traffic or increased brand awareness.
