# Own IELTS Task 2 essay workspace — first enrolled-student slice

## Access and data

- `/writing/trainer/own` requires an authenticated `student` and membership in an IELTS class returned by the existing LMS repository. A new account with the default student role but no class cannot use it.
- The public `/writing/trainer/practice` continues to use only two authored essays. The landing page offers both paths and explains their different feedback contracts.
- The user's prompt, original essay, working essay, per-criterion notes, and versions stay in tab-scoped `sessionStorage` under a user-specific key. They are not sent to an API, teacher, Supabase table, or AI provider. A local `.txt` export and explicit delete action are available.
- A production deployment with demo auth cannot open the own-essay editor. Production requires `NEXT_PUBLIC_AUTH_PROVIDER=supabase`; the current production health endpoint reported `auth: supabase` on 2026-09-28.

## Flow

1. Enter the full Task 2 prompt and paste or type an original essay. The original is fixed when practice starts.
2. Work on a full essay across Grammar, Task Response, Coherence, and Lexical Resource. Each step has a focused checklist, an editable working version, and an optional explanation of the learner's own changes.
3. Advancing saves a snapshot for that criterion. Back navigation preserves the current working draft and allows continued editing.
4. The final screen compares original and latest text, reveals the four saved snapshots and notes, and offers local export. The 250-word Task 2 threshold is shown as guidance, not a blocker.

## Honest limits and next gate

- This slice does **not** detect missed grammar errors, generate corrected text, or estimate a criterion band for an arbitrary essay. The authored numbers for the two fixed cases do not transfer to a new essay.
- Any future AI step needs explicit permission for transfer of real student text, a provider with generative feedback capability, a data handling/retention decision for minors, per-student budget/rate limits, and teacher-annotated whole-essay calibration before numeric bands appear.
- The current browser-only access check protects the interface, while the essay itself never reaches a server. If server persistence or AI is added, the server must independently verify student identity, IELTS enrollment, and consent before accepting text.
