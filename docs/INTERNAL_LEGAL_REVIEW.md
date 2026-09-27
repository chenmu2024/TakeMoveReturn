# TakeMoveReturn internal legal consistency review

Reviewed: 2026-09-27  
Method: AI-assisted internal review of the current code, deployment configuration, database migrations and public copy.  
External professional review of this exact revision: not obtained.

This is an AI-assisted internal consistency review and does not constitute professional legal advice or external legal certification.

## Scope and evidence

| Area | Finding | Evidence / limitation |
| --- | --- | --- |
| Operator | TakeMoveReturn is an operating brand of Qiaosheng Zhong, an individual operating from the People's Republic of China. No registered business name, registration number or address is asserted. | `src/config/site.ts`, `docs/DECISIONS.md`; owner-supplied identity, not independently verified documentation. |
| Privacy | Account, Supabase Auth/session, member, worker, tool, location, movement, manager-entered damage and maintenance, support and privacy-request data are described. GPS is excluded. | `src/lib/supabase`, `src/app/app`, SQL migrations through `202609270004`, `src/app/api/privacy/export/route.ts`. |
| Files/import | Damage and maintenance text records are now supported; their photos/attachments and spreadsheet imports are not. No production customer-file upload route or processing queue is wired. R2 is OpenNext cache only. | `wrangler.jsonc`, `src/app/app/damage`, `src/app/app/maintenance`. |
| Providers | Cloudflare, Supabase and Resend are active. Waffo is selected but disabled; no active Queues, Turnstile, GA4, PostHog, Sentry or Stripe integration found. | `wrangler.jsonc`, `package.json`, `src/data/subprocessors.ts`, authenticated email test recorded in `docs/DECISIONS.md`. |
| Billing | Plan prices/limits come from `src/config/plans.ts`; Waffo checkout is behind `WAFFO_BILLING_ENABLED=false`. No renewal, cancellation, downgrade, payment-failure or grace-period implementation was verified. | `src/config/plans.ts`, `src/app/api/billing/checkout/route.ts`, `wrangler.jsonc`. |
| Retention | `src/config/retention.ts` defines targets, but no automated cleanup jobs or provider-specific verified deletion schedule was found. Public policy does not present targets as achieved. | Code search and `src/config/retention.ts`; provider backup retention remains unverified. |
| Export/deletion | Own-account JSON export and owner/admin company CSV reports exist; privacy requests are durable and access-controlled. Automatic account/workspace deletion is not implemented. | `src/app/api/privacy/export/route.ts`, `src/app/api/reports/[kind]/route.ts`, `supabase/migrations/202609270003_privacy_requests.sql`. |
| Security | Authentication, tenant RLS, role checks and derived worker PINs are implemented. No SOC 2, ISO, PCI or absolute-security claim is made. | `src/lib/security/worker-pin.ts`, migrations, role-scoped routes. Field-worker/QR browser flows need further verification. |
| DPA | Customer-controlled processing roles are conditional, not universally GDPR-defined; no signed DPA or transfer mechanism is inferred from this public page. | `src/data/legal-documents.ts`. |
| Public presentation | Legal pages no longer expose draft/TBD/review banners. They remain footer-accessible and noindex. Internal release status is separate. | `src/app/[...slug]/page.tsx`, `src/components/marketing.tsx`, `src/config/legal-review.ts`. |

## Release gate and remaining work

The public pages state verified current facts without a fictitious corporation. On 2026-09-28 the owner approved the current legal text for use and the effective date was set to 2026-09-28; this is not evidence of external professional review. The owner authorized production registration, which is now enabled; two new accounts completed email confirmation and recorded the current legal version, and one entered the production workspace. `WAFFO_BILLING_ENABLED=false` remains unchanged. Authenticated product and field flows, older-account re-consent, privacy-request operations, provider retention and applicable transfer-law obligations still require verification. Do not set release-evidence flags merely to bypass the production audit.

The public Terms intentionally contain no unverified liability cap, refund promise, SLA or exclusive dispute venue. The public DPA is a processing framework, not a claim of a separately executed negotiated agreement. If paid billing or uploads launch, update the documents and provider register before enabling those flows.

The CuadraNómina main-branch pages, release configuration and internal reviews named in the owner's request were read at commit `3eda160e054289b9f86d9815fecf1d78cc4172f1`. We adopted the separation of product facts, central config, transparent public pages and internal review evidence. No CuadraNómina clause or product-specific claim was copied into TakeMoveReturn.
