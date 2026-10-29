# Public Supabase production CA certificates

Public trust anchors, not credentials. Retrieved from the official Supabase CLI at pinned commit 74d4774766936b6e6141a58d061c3396a01c85c9:
- https://github.com/supabase/cli/blob/74d4774766936b6e6141a58d061c3396a01c85c9/apps/cli/src/commands/gen/types/templates/prod-ca-2021.ts
- https://github.com/supabase/cli/blob/74d4774766936b6e6141a58d061c3396a01c85c9/apps/cli/src/commands/gen/types/templates/prod-ca-2025.ts

The official CLI bundles both production roots. PEM bytes only are retained here. Root certificates verified as CA/self-signed, valid to2031 and2035. SHA256 fingerprints:
-2021: 807025AD50D4ED219D2C9C7D299C004F824EB00CF7F65AFEF607D07B72E6CAFA
-2025: 5F9B77951A7AA1303F9B58EEA9BFA89E358CFDC15F9786FF10D4930A722C9AE2

Used only by the exact-SHA-gated server-build preparation runner. Normal system roots remain trusted; certificate-chain and hostname verification remain mandatory. No downloaded or peer-presented certificate is automatically trusted during a connection.

Reference: https://supabase.com/docs/guides/platform/ssl-enforcement
