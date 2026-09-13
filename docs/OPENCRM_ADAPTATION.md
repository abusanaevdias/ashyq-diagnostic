# OpenCRM adaptation for ASHYQ

Reference: [clawnify/OpenCRM](https://github.com/clawnify/OpenCRM), MIT License.

The reference repository was inspected for architecture and interaction patterns. No
source file was copied into ASHYQ. The following ideas were adapted to the existing
Next.js application and its append-only JSONL storage:

- one CRM record per stable `runId`, merging diagnostic, contact, WhatsApp and season events;
- explicit pipeline stages instead of a single undifferentiated leads list;
- a chronological activity timeline for lead events, stage changes and manager notes;
- search and stage filters around the operator's working queue;
- CSV export as an escape hatch for spreadsheet or external CRM migration.

## Deliberate differences

- ASHYQ keeps the current lightweight storage and does not add Cloudflare D1, Hono,
  shadcn, contacts/companies/deals, or integration packages.
- `/crm` is protected by the existing `ASHYQ_ADMIN_KEY`; the browser sends the key in
  a request header and keeps it only in `sessionStorage`.
- CRM changes are append-only in `.data/crm-events.jsonl`. Original lead events are
  never rewritten or deleted.
- The public site does not link to `/crm`; metadata and `robots.txt` prevent indexing.

This is an operator MVP. Before multiple managers work concurrently or the product is
deployed on read-only serverless storage, migrate both JSONL journals to a transactional
database and replace the shared key with per-user authentication and audit identities.
