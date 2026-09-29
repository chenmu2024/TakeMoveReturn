# TakeMoveReturn internal legal consistency review

Reviewed: 2026-09-29  
Method: AI-assisted internal consistency review of the current repository, deployment configuration, billing implementation, database migrations and public copy.  
External professional review of this exact revision: **not obtained**.

This document is an internal engineering/legal-consistency record, not professional legal advice or certification.

## Scope and evidence

| Area | Current finding | Evidence / limitation |
| --- | --- | --- |
| Operator | TakeMoveReturn is operated by Qiaosheng Zhong as an individual from the People's Republic of China. No registered corporation or registration number is asserted. | `src/config/site.ts`, `docs/DECISIONS.md`; identity is owner-supplied. |
| Registration | Public registration and legal acceptance are enabled. | Auth actions/layout and prior production walkthroughs. |
| Core product | Company-scoped tools, workers, locations, QR labels, TAKE/MOVE/RETURN, damage, maintenance, imports and reports exist. | Application code, migrations and tracked tests; broad automated browser E2E remains incomplete. |
| Files/storage | Customer tool photos, damage photos and maintenance attachments are not enabled. R2 is used for OpenNext cache, not customer uploads. | `wrangler.jsonc`, absence of customer-file upload route, public disclosures. |
| Import | CSV/XLSX is parsed in-browser, then mapped rows are server-validated and persisted to Supabase import jobs; Cloudflare Queues carries job/batch identifiers for background processing. | Import API, queue consumer and migration `202609280004_import_jobs.sql`. |
| Providers | Cloudflare, Supabase, Resend and Waffo are active. Turnstile, GA4, PostHog, Sentry and Stripe are not active integrations in the inspected application. | Package/config/source review and active provider register. |
| Billing | New paid checkout is enabled through Waffo Pancake. Signed webhook verification, store validation and subscription-event persistence exist in code. A real payment was reported, but automatic entitlement from a delivered signed production webhook has not yet been independently verified end-to-end. Self-service upgrade/downgrade/cancel is not implemented. | `src/app/api/billing/*`, `src/lib/billing/waffo.ts`, billing migration, project delivery history. |
| Privacy | Own-account JSON export, owner/admin company CSV reports and privacy-request intake exist. Deletion fulfilment remains an operational process rather than an automated product feature. | Privacy/report routes and privacy migration. |
| Retention | Internal targets exist but automated cleanup is not yet implemented for all categories. | `src/config/retention.ts`; no complete scheduled cleanup pipeline verified. |
| Security | Authentication, role checks, tenant RLS, restricted writes, derived worker PIN storage, revocable field sessions and QR token rotation are implemented. | Security code/migrations/tests. This is not a SOC 2/ISO/PCI certification. |
| Legal versioning | Effective legal acceptance version remains 2026-09-28. Public text was updated on 2026-09-29 to correct current operational facts about active billing. | `src/config/site.ts`; this does not assert external review of the revised wording. |
| SEO | Legal pages remain noindex. Core SEO pages and index gates are separately controlled by the SEO registry/audit. | `src/app/[...slug]/page.tsx`, `src/data/seo-keywords.ts`. |

## Current release gate

The repository should **not** be described as fully production-complete while these items remain open:

1. verify a real Waffo signed webhook through entitlement;
2. verify renewal/past-due/cancel lifecycle behavior;
3. implement membership/admin management;
4. implement customer-file upload/quota/deletion before treating storage as an active upload feature;
5. operationalize privacy deletion/retention cleanup;
6. add broader automated browser E2E, database-security CI, load and Lighthouse coverage;
7. finish remaining authenticated production workflow verification.

Public copy should continue to describe only capabilities that exist now. Future provider or feature plans must not be presented as active.
