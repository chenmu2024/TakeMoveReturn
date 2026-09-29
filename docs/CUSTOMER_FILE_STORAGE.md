# Customer file storage runbook

## Purpose

TakeMoveReturn already uses Cloudflare R2 for the OpenNext incremental cache. Customer files must stay in a **separate R2 bucket** so application cache eviction, customer-file retention, privacy deletion, quota accounting, and incident response remain independent.

The customer-file feature is staged behind `CUSTOMER_FILES_ENABLED`. Production must keep that flag `false` until every activation step below is complete.

## Supported file classes

- Tool photos: JPEG, PNG, WebP
- Damage photos: JPEG, PNG, WebP
- Maintenance attachments: JPEG, PNG, WebP, PDF
- Maximum file size: 10 MB per file

The server validates the declared MIME type **and** the file signature before R2 upload.

## Data model and quota

Migration `202609290004_customer_files.sql` creates private company-scoped file metadata, RLS, quota reservations, ready/deleted states, and RPC-only write transitions. Migration `202609300001_customer_file_lifecycle.sql` adds durable R2 deletion state, retry metadata, scheduled cleanup RPCs, and hard-delete guards so a company/tool/damage/maintenance parent record cannot disappear while an R2 object still needs cleanup.

Plan quotas remain aligned with `src/config/plans.ts`:

- Free: 100 MB
- Starter: 2 GB
- Growth: 10 GB
- Pro: 25 GB

Pending reservations count toward quota for one hour so concurrent uploads cannot overrun a plan. Failed uploads are abandoned. Deleted metadata stops counting toward quota.

## Production activation

1. Apply all pending Supabase migrations through the tracked migration workflow, including `202609290004_customer_files.sql` and `202609300001_customer_file_lifecycle.sql`.
2. Run the rollback-only database tests `supabase/tests/customer_files.sql` and `supabase/tests/customer_file_lifecycle.sql` in a disposable/local Supabase environment.
3. Create a dedicated private R2 bucket named `takemovereturn-files`.
4. Add a second R2 binding to `wrangler.jsonc`:
   - binding: `CUSTOMER_FILES_R2_BUCKET`
   - bucket: `takemovereturn-files`
5. Keep the existing `NEXT_INC_CACHE_R2_BUCKET` binding unchanged. Never reuse `takemovereturn-opennext-cache` for customer files.
6. Set `CUSTOMER_FILES_ENABLED=true` only after the migration and binding are ready.
7. Run the complete release suite:
   - `npm run typecheck`
   - `npm test`
   - `npm run db:audit`
   - `npm run legal:audit`
   - `npm run release:audit`
   - `npm run build`
   - `npm run runtime:smoke`
   - `npm run load:smoke`
   - `npm run cf:build`
   - `npm run cf:dry-run`
8. Deploy through the normal Cloudflare release path.
9. Production-verify upload, authenticated read, delete, tenant isolation, and quota enforcement for each file class before changing public claims.

## Security properties

- R2 objects are not public URLs.
- Downloads go through an authenticated application route and company-scoped RLS metadata lookup.
- Direct authenticated writes to `customer_files` are revoked; reservation/readiness/deletion use constrained RPCs.
- Object keys contain company ID, file kind, and a random UUID; original file names are metadata only.
- Filenames with path separators are rejected.
- File signatures are sniffed before upload to prevent simple MIME spoofing.
- File responses use `private, no-store`, `nosniff`, same-origin resource policy, and a sandboxed CSP; PDFs download as attachments instead of rendering inline.
- Cross-company file metadata is hidden by RLS.
- A daily Worker schedule asks Supabase for tombstoned/stale file objects and removes them from the dedicated R2 bucket once that binding exists.
- Hard deletion of a company, tool, damage report, or maintenance event is blocked while an associated R2 object is not yet confirmed deleted.

## Failure and rollback

If file storage has a production incident:

1. Set `CUSTOMER_FILES_ENABLED=false`.
2. Deploy the gate change first. Existing tool tracking, QR, imports, billing, and history do not depend on customer files.
3. Do **not** delete the R2 bucket during incident mitigation.
4. Investigate database metadata and Worker logs.
5. Reconcile any R2 objects left behind after a database tombstone before re-enabling.

A database tombstone can succeed while the subsequent R2 delete fails. The API logs `customer_file_r2_delete_failed`; the daily cleanup schedule retries eligible tombstones after a 15-minute backoff and records the R2 deletion result in Supabase. This cleanup safely no-ops until `CUSTOMER_FILES_R2_BUCKET` exists, so adding the schedule does not activate customer uploads by itself.

## Current status

Code and schema are staged, but the production feature is intentionally disabled until the dedicated bucket/binding, database migration, and production verification are complete.
