# IELTS Task 2: adversarial review of the AI pilot

Date: 2026-09-28. Scope: own-essay route, optional OpenAI feedback endpoint,
teacher access, landing instructions, and Vercel Web Analytics.

## Attacks and counterexamples

| Scenario | Expected behaviour / evidence |
|---|---|
| Visitor or unrelated ASHYQ account posts an essay directly to the API | Server validates a Supabase JWT, exact allowlisted email, `student`/`teacher` profile and an IELTS class visible under RLS; otherwise 403. UI role checks alone do not grant access. |
| User opens a stage, changes text, or moves between stages without agreeing to transmission | No AI request is initiated. The checkbox starts unchecked and is reset after each request; server also requires `consent: true`. |
| Pilot is accidentally deployed without provider key, pilot email, service-role key or flags | API returns 503 before reading a request body. Public pages and tab-local revision continue to work. |
| Prompt/essay contains instructions to change the model's role or reveal a secret | Essay is sent as untrusted user data after a developer instruction to ignore embedded commands. Structured output is parsed and validated. This reduces risk but cannot prove the model followed the instruction. |
| Model invents a mistake or cites text absent from the essay | Each issue must quote an exact substring of the working essay; ungrounded issues are discarded. Grounding does **not** establish that the grammatical or IELTS advice is correct, so the interface calls it a possible issue and lets the learner decide. |
| Model assigns a confident IELTS score to a free essay | Prompt forbids numerical bands; response schema has no score field and server sends only sanitized fields. Teacher-annotated whole-essay calibration remains a release prerequisite for free-essay scores. |
| Two serverless instances each accept many calls | A shared Supabase `check_rate_limit` RPC enforces 4/user and 12 total per UTC day. On RPC failure the AI request fails closed. An in-process lock limits parallel calls on one instance, but the shared RPC is the cross-instance control. |
| Someone enters a query parameter or visits a class ID page | Vercel Analytics `beforeSend` accepts only listed public routes and public blog slugs, strips query and fragment, and drops class, account and own-essay pages. No custom events contain essays. |
| GitHub CI runs a production build outside Vercel | The analytics wrapper loads the script only on this project's Vercel hosts or the configured HTTPS site host. On localhost the script is absent, avoiding the Vercel-only route's 404. |
| Teacher opens the student-only own-essay page | Teachers with an IELTS class now pass the role and membership checks. The teacher dashboard links directly to the personal practice; no student submissions are loaded. |
| 390px mobile visitor tries to understand the three steps | Text names the actual controls and action order. Each screenshot is scrollable with a cue and can be opened at full size. Desktop and 390px views were inspected visually. |

## Release limits

- No `OPENAI_API_KEY` or pilot email was provided. The AI flag stays off; no
  real model response or spending was verified. A real test with a synthetic
  essay and the pilot account is required before enabling it.
- OpenAI `store: false` does not imply zero retention: standard abuse-monitoring
  logs may last up to 30 days. The privacy page discloses this.
- A dedicated OpenAI project spend cap is still required before activation.
  The in-app request cap is a second bound, not a billing ceiling.
- The rate-limit migration must be present in production. A missing RPC results
  in unavailable AI, rather than an unbounded fallback.
- The live Vercel Analytics dashboard already showed its Get Started screen and
  zero visitors before this code was deployed. A production visit and a
  dashboard pageview are needed to close that operational check.
