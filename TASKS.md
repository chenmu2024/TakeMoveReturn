# TakeMoveReturn delivery tracker

## Completed

- 2026-09-27: Shared-device enrollment, worker PIN sign-in/lock, rate-limited attempts and worker-attributed QR TAKE/MOVE/RETURN are implemented behind the production Auth gate. Migrations `202609270005`–`007` are applied; rollback-only SQL tests pass anonymous denial, cross-company isolation, location checks, PIN-reset session invalidation and five-failure cooldown. The server-only Supabase service-role key is not configured, so authenticated browser/runtime verification and production worker access are **not** complete. Do not expose that key to the browser or repository.
- 2026-09-27: Managers can list and revoke shared field devices. Revocation atomically ends all worker sessions on that device and cannot be undone through a direct Data API update. Migration `202609270008` is applied; rollback-only tests pass own-company revocation, cross-company denial, and direct-update denial.
- 2026-09-27: Manager-only, company-scoped damage reports and maintenance schedules/service history now have real persistence and tool-history events. Damage reporting and resolution update tool status atomically; service completion advances the next due date. Migration `202609270004` is applied to the linked Supabase project and its rollback-only two-company test passed. Photos, maintenance attachments and automatic reminders remain disabled.
- 2026-09-27: Owner/admin CSV reports now include damage, maintenance schedules and service history. The limited own-account JSON export includes damage reports and service events attributed to the signed-in user, with per-section size limits; neither export grants company-wide data to a regular requester.
- 2026-09-27: Damage/maintenance routes and expanded exports are deployed in Worker version `ee8d1de7-f0c6-4510-aee2-8be544975ad6` from commits `0bd05b2` and `ab9268d`. Online guest checks showed both workspace routes redirect to closed signup, all new report endpoints and personal export return 503 while Auth is disabled, and Privacy mentions the new records. Authenticated browser form/export verification remains open.
- 2026-09-27: Public Privacy, Terms, DPA, provider register and Business Information were rewritten from verified product facts without draft placeholders or fictitious corporate details; About and an internal AI-assisted legal consistency review were added. Formal signup/legal-effective and billing gates remain closed pending the evidence listed in `docs/INTERNAL_LEGAL_REVIEW.md`.
- 2026-09-27: Legal/site-security release `dc30782` deployed to Cloudflare Worker version `2d0bcb6e-8c6c-45e1-9a5f-31c8bfdefc21`. All six legal/transparency URLs returned HTTP 200 online without public engineering placeholders; HSTS was present, signup remained closed, and billing returned HTTP 503. Six unit tests, typecheck, SEO/legal audits, Next build, OpenNext build and Wrangler dry-run passed; the production legal audit still correctly blocks commercial registration.
- 2026-09-27: Signed-in Privacy Settings gained own-account JSON export and a durable, company-scoped privacy-request queue. Requests are limited to the requester by RLS; deletion remains a reviewed request, not an automatic destructive action. Privacy correspondence now uses verified `contact@takemovereturn.com`.
- 2026-09-27: Provider location disclosure now records the verified Supabase primary region (`us-west-1`), Cloudflare R2 cache location hint (`WNAM`), and Resend's stated US primary processing; transfer compliance is not inferred from those facts.
- Project specification copied to `docs/PROJECT_SPEC.md`.
- Architecture decisions recorded in `docs/DECISIONS.md`.
- Legacy static Fieldmark demonstration identified as non-production code.
- Central TakeMoveReturn brand configuration created.
- Locked Free/Starter/Growth/Pro limits and monthly/annual prices created.
- Environment variable templates created without secrets.
- Next.js 16 App Router foundation, homepage, and type configuration created.
- OpenNext Cloudflare adapter configuration and Worker bundle created.
- Public pricing, features, SEO landing routes, help/legal entries, sitemap, and robots routes created.
- Initial Supabase tenant schema, company-scoped core tables, indexes, and RLS policies created.
- Auth entry routes and all required dashboard workspace route shells created with explicit secure-data prerequisites.
- PBKDF2-HMAC-SHA256 worker PIN hashing/verification and server-side plan-capacity logic created.
- Shared device and worker session schema, revocation, expiration, and auth-version validation created.
- Keyword placement source implemented for all Phase 1 core money pages, with metadata and sitemap index gates.
- Selected product-first UI direction implemented for the home, features, pricing, shared marketing shell, and core SEO landing pages.
- SEO source upgraded with canonical URL, keyword cluster, metric source/scope/date, intent, priority, page type, and index status fields.
- SEO audit command added to check canonical-page metadata field presence and duplicate page ownership.
- Phase 2-4 industry, comparison, and guide routes added with explicit global-metric and US-verification gates.
- Expansion industry candidates added for remodeling, concrete, civil engineering, restoration, HVAC, and roofing with `not_verified` metrics and noindex gates.
- Roadmap route template expanded with field pain, construction scenario, workflow, comparison boundary, FAQ, and related-page sections.
- Public metadata and schema layer added: Open Graph, Twitter cards, canonical URLs, Organization, WebSite, SoftwareApplication, BreadcrumbList, Article, and FAQPage JSON-LD where applicable.
- Cloudflare `NEXT_PUBLIC_SITE_URL` binding configured so production canonical URLs use the deployed Worker instead of localhost.
- Help Center and Contact Support pages expanded with real navigation, product-boundary FAQs, and an explicit support-configuration state.
- Authenticated workspace UI expanded across dashboard, tools, workers, locations, activity, damage, maintenance, import, reports, settings, billing, and privacy routes with honest empty states and security gating.
- Auth UI polished for login, signup, password recovery, and callback states with disabled credential submission until Supabase Auth is connected.
- Site completeness improved with a branded favicon, a safe `/app` redirect, a noindex branded 404 page, and updated TakeMoveReturn project documentation.
- Updated `docs/PROJECT_SPEC.md` to the supplied final SEO V2 source and clarified its precedence in `AGENTS.md`.
- Help Center expanded to ten searchable category articles with honest product availability notes and real content dates.
- Privacy and Terms expanded into structured review drafts, marked noindex, and removed from the sitemap until legal review is complete.
- Pricing page gained an accessible monthly/annual selector driven by the locked plan configuration.
- Supabase project `takemovereturn` confirmed healthy; local development uses its Project URL and publishable key in ignored `.env.local` (no privileged key copied).
- Supabase Auth URL configuration now points to the Cloudflare site and allows the production and localhost auth callbacks.
- Local Supabase SSR session setup, account registration, sign-in, password recovery, callback exchange, and authenticated workspace guard implemented. Company onboarding and real data are not enabled yet.
- `takemovereturn.com` routed to the Cloudflare Worker without changing the existing MX/TXT email records. Production canonical URL, sitemap, robots, support and privacy contact addresses updated. Billing address recorded for later use.
- Supabase Auth Site URL and allowed callback updated to the production domain; the old Worker and localhost callbacks remain allowed.
- Auth launch gate added: `SUPABASE_AUTH_ENABLED` defaults off until migrations, RLS, company onboarding, and email delivery are verified.
- Payment provider decision updated to Waffo Pancake; all payment implementation remains deferred.
- Company onboarding SQL migration and a signed-in setup page added. The database function is idempotent per account, and authenticated workspace routes require an active company membership. SQL checks pass; real browser onboarding remains gated and untested.
- A follow-up migration closes direct tool-custody and transaction writes, limits database visibility of worker PIN/device-token fields, and narrows session update permissions. Live grants were read back and verified.
- Seven tracked Supabase migrations are now applied to the live project. Privileged implementations were moved behind non-exposed `private` functions; public RPC wrappers run with caller privileges. Company onboarding and first-tool creation enforce authenticated membership, tenant scope, and the Free/paid active-tool capacities in the database.
- The first-tool form and company-scoped tool list are implemented behind the disabled Auth launch gate and deployed, but have not been exercised with a real email-confirmed browser account.
- Company-scoped locations now have a real add form and register for warehouses, job sites, trucks, and other places. Authenticated owner/admin/manager writes use the existing location RLS; the rollback-only database test covers other-company read and write denial. The user created a test warehouse with an address in the local browser, and the location appeared in the list.
- The user confirms that `contact@`, `billing@`, and `support@takemovereturn.com` can receive forwarded mail and send from an email client. This is distinct from verified automated Supabase Auth SMTP delivery.
- Resend free plan selected for transactional Auth mail. `takemovereturn.com` is verified in Resend with DKIM and SPF, while public MX records still point to Cloudflare Email Routing. Supabase custom SMTP uses `smtp.resend.com:465`, sender `support@takemovereturn.com`, and a domain-restricted sending-only key that is not stored in the repository.
- The user received and confirmed a real signup email at `support@takemovereturn.com`. The first reset link exposed an implicit-flow fragment incompatibility with the server callback; the callback now verifies Supabase token hashes, and the signup/recovery templates use `RedirectTo` plus `TokenHash`. The user received the second reset email and set a password. Local runtime logs confirm recovery callback, password update, and authenticated workspace navigation. An invalid token redirects safely to the error state.
- The same authenticated test account created a company, one tool, and one warehouse through the local browser. Screenshots show both records in company-scoped lists; read-only database checks show one confirmed, signed-in user, one company, one active membership, one tool, and one location. Public Auth remains gated off in production.
- Worker creation now has a company-scoped server action, PIN hashing with the environment-only pepper, and a database function. The worker list reads only non-secret fields. Two new live migrations add the function and revoke direct worker status changes/deletion so future session revocation cannot be bypassed. The rollback-only tenant test covers own-company creation and cross-company denial. Local browser creation and shared-device login are not yet verified.
- Dashboard cards now read real company-scoped active-tool, checked-out, attention, and seven-day activity counts instead of placeholders when authenticated.

## Tests run

- 2026-09-27: Damage/maintenance migration `202609270004` applied to linked Supabase and rollback-only two-company SQL test passed for cross-tenant denial, damage/repair tool status and history, duplicate-open rejection, schedule advancement and service history. Linked DB lint found no schema errors. Six unit tests, TypeScript check, SEO/legal audits, Next build, OpenNext build and Wrangler dry-run passed; authenticated browser checks remain pending.
- 2026-09-27: Privacy migration `202609270003` applied to linked Supabase; rollback-only test passed for own read/create, cross-company and forged-user denial, duplicate-open prevention, and inability to change request status. Typecheck, six unit tests, SEO audit, draft legal audit and Next production build passed. Production legal audit still fails by design.
- Project-document presence check: passed.
- TypeScript typecheck: passed.
- Next.js production build: passed.
- OpenNext Cloudflare bundle: passed (Windows compatibility warning remains).
- Public-site TypeScript typecheck and production build: passed.
- Initial migration static policy and tenant-key check: passed.
- Auth and workspace route TypeScript typecheck and production build: passed.
- PIN and plan-limit service code TypeScript typecheck and production build: passed.
- Session migration static policy check and production build: passed.
- Keyword placement TypeScript typecheck and production build: passed.
- Product-first UI TypeScript typecheck, SEO audit, and production build: passed.
- Browser checks: home desktop, home 390px mobile, and pricing desktop: passed.
- Design comparison: `design-qa.md` final result passed.
- OpenNext Cloudflare Worker bundle: passed (Windows compatibility warning remains).
- GitHub: pushed commit `3e8bbfe` to `https://github.com/chenmu2024/TakeMoveReturn` on `main`.
- GitHub: pushed the deployment-tracker commits through `ab38c53` to `main`.
- GitHub: pushed the auth and site-entry polish commit `86ba736` to `main`.
- Cloudflare Worker deployed at `https://takemovereturn.zhongqiaosheng.workers.dev` (version `c5d7b87c-bff6-413f-a9a8-cba812e6c930`).
- Production URL smoke check: HTTP 200, expected title, and TakeMoveReturn brand present.
- Roadmap route checks: industry, guide, and comparison pages returned HTTP 200 with FAQ/workflow content and `noindex, nofollow` robots.
- Current typecheck, Next.js production build, and OpenNext Cloudflare bundle: passed (Windows compatibility warning remains).
- Current SEO route count: 26 canonical routes; SEO audit passed after adding the expansion industry candidates.
- Latest Cloudflare Worker deployment: version `02d2d7a7-396c-4ff6-ae53-372d0806a4b4`.
- Runtime SEO checks: homepage, Help, industry, and guide pages returned HTTP 200 with expected canonical, Open Graph, JSON-LD, and robots output.
- Runtime Help Center checks: `/help` and `/help/contact` returned HTTP 200 with expected navigation, FAQ, canonical, and support-state output.
- Workspace runtime checks: all 12 `/app/*` routes returned HTTP 200 with `noindex, nofollow` and the secure-data connection banner.
- Latest Cloudflare Worker deployment: version `082514e9-95f6-4af6-867a-702e8f98bc5e`.
- Auth runtime checks: `/auth/login`, `/auth/signup`, `/auth/forgot-password`, and `/auth/callback` returned HTTP 200 with `noindex, nofollow` and the secure-connection state.
- Latest Cloudflare Worker deployment: version `a568ee62-b7e1-4954-9bd6-309230edf780`.
- Latest production smoke check: home, `/app`, all auth states, favicon, and a missing route returned the expected response; missing route returned branded HTTP 404.
- SEO V2 public-page checks: TypeScript typecheck, SEO audit, Next.js build, and OpenNext bundle passed.
- Local route checks: Help Center, two help articles, Privacy, Terms, and Pricing returned HTTP 200; Privacy and Terms emitted `noindex` and were absent from the sitemap, while help articles were present.
- Cloudflare Worker deployment `4889ef23-7c7b-42da-ba00-f0f145067f71` passed online checks for Help, representative help articles, Privacy, Terms, Pricing, canonical URLs, robots gates, and sitemap membership.
- Supabase Auth settings endpoint returned HTTP 200 with the publishable key; local auth form returned HTTP 200, unauthenticated workspace returned HTTP 307 to login, and invalid callback returned HTTP 307 to login.
- Supabase Auth code TypeScript check, Next.js production build, and OpenNext Cloudflare bundle passed. OpenNext warns that Node.js middleware support is experimental on Cloudflare; verify Worker runtime before production release.
- Domain update: typecheck, 26-route SEO audit, Next.js build, OpenNext bundle, and Wrangler dry-run passed.
- Cloudflare deployment `42f5d4b6-ec44-40ab-b078-2120b30a7b62` succeeded after the OpenNext R2 helper returned 500; all 11 incremental-cache entries were uploaded directly to the existing R2 bucket before deploying the Worker.
- Production root, support contact, signup, sitemap, and robots returned HTTP 200. Root and support canonicals use `takemovereturn.com`; support address appears; signup is locked. The old workers.dev hostname timed out from this environment despite a deployed trigger, so its runtime remains unverified.
- Cloudflare Email Routing shows active rules for `contact@`, `billing@`, and `support@takemovereturn.com`, all forwarding to a verified destination. No independent send-and-receive test or outbound SMTP test has been run.
- `www.takemovereturn.com` added as a Worker Custom Domain and a Cloudflare 301 rule redirects it to the root domain while preserving the path and query string; online checks passed. Latest Worker version: `fdaa3818-8528-459b-955e-f524b6127443`.
- Supabase CLI login/link succeeded for `xcdhhxyqdlorxztafpee`; migration history shows all seven local migrations applied remotely. Linked database lint at warning level and Supabase security advisor at warning level both returned no issues.
- The rollback-only two-company database test passed: own-company reads and transactions, cross-company denials, onboarding idempotence, 25-tool Free capacity, over-limit denial, and retired-tool capacity release. Post-test live counts remained zero users, companies, and tools.
- Latest TypeScript, Next.js build, SEO audit, OpenNext Worker build, and Wrangler deployment dry-run passed. Worker `19b65727-3d8a-4c88-a45e-0a2819cbd4a7` deployed after directly uploading 11 cache entries; production home/signup/sitemap returned HTTP 200, while gated onboarding and new-tool routes redirected to signup (HTTP 307). Signup copy still states account access is closed.
- After the token-hash Auth callback and location-register changes, typecheck, Next.js build, SEO audit, OpenNext bundle, and Wrangler dry-run passed. Worker `94c28bb7-b260-4c78-b2e6-ea90d4f99b88` deployed after 11 cache entries were uploaded. Production home and signup returned HTTP 200; an invalid recovery token redirected to login with an error, and the gated new-location route redirected to signup (HTTP 307).
- Worker-create and write-guard migrations applied to linked Supabase after dry-run. The rollback-only two-company test passed; worker PIN hash verification accepted the correct PIN and rejected an incorrect PIN, and the database lint returned no warnings. Typecheck, Next.js build, and SEO audit passed.

## Current task

- 2026-09-27: Non-payment commercial launch remains in progress. The privacy request/export slice is implemented and database-tested; production sign-in and public registration remain gated until field-worker security, deletion fulfilment, legal sign-off and browser/runtime verification are complete. Do not describe this as a full commercial launch.
- 2026-09-25 owner decision: Qiaosheng Zhong is the real individual operator in China; no registered company or sole proprietorship. Waffo Pancake/Waffo.com Limited replaces the previous payment provider decision. This supersedes the earlier payment-deferral and missing-operator blockers below.
- Code staged: central operator identity and privacy email, approved refund principle in draft Terms, retention policy targets, unselected signup Terms/Privacy checkbox and server validation, immutable signup-acceptance migration, Waffo SDK and owner-only/server-allowlisted checkout entry (default disabled), and revised source-of-truth docs. Four unit tests, typecheck, SEO audit, legal audit, Next build, OpenNext bundle and Wrangler dry-run passed. Production legal audit intentionally fails. The legal-acceptance migration is applied to the linked Supabase project and its rollback-only database test passed on 2026-09-27; no Cloudflare deployment of this change has occurred. Public signup and paid checkout remain disabled.
- 2026-09-27 owner direction: complete non-payment work first. The dashboard now loads the five newest company-scoped movements and five attention-status tools instead of showing placeholder cards; the first-tool prompt disappears after a tool exists. Settings show the authenticated company name, timezone, plan, and current member role. Reports now offer owner/admin-only, company-scoped CSV downloads for tools, workers, locations and transactions, with CSV-formula neutralization and a 10,000-row safety limit. Six unit tests, typecheck, SEO/legal audits, Next build and the legal-acceptance database test passed. Unauthenticated report access returns 401, invalid report names return 404; authenticated browser export checks remain pending.
- 2026-09-27 QR identification slice: authenticated managers can open and download a tool QR label; anonymous scans expose only company name, tool name, and asset code, never internal IDs or custody. Owners/admins can rotate the random 256-bit token, and rotations are audited. Migrations `202609270001` and `202609270002` are applied to linked Supabase. The rollback-only QR test passed for anonymous read-only access, internal-field minimization, cross-company denial, rotation, and immediate old-token invalidation. Typecheck, six unit tests, SEO audit, Next build, OpenNext build, and local Worker guest smoke checks passed. Authenticated browser label/scan/rotation checks and deployment remain pending. QR does not authenticate field workers.
- Owner says legal review is complete, but the AI-modified post-review document version has not been signed off; do not claim lawyer approval of this exact revision. Formal effective date remains unset until publication is safe.
- Worker security now has a manager-only PIN reset page and an atomic database function. Resetting increments `auth_version` and revokes old worker sessions; activation is an explicit opt-in on the reset form. The rollback-only SQL test verifies cross-tenant rejection and session invalidation. The quarantined real test worker remains inactive until the user privately chooses a new PIN.
- Authenticated manager tool detail now offers TAKE, MOVE, and RETURN through the existing row-locked transaction function, with current custody and recent tool history. The activity view reads real company-scoped transactions. The SQL test verifies cross-company worker denial, the TAKE/MOVE/RETURN sequence, and double-return rejection. Field-worker PIN login and QR label scanning are still separate unfinished workflows.
- The reset migration is applied to the linked Supabase project; the rollback-only tenant/movement test, typecheck, SEO audit, legal audit, Next build and OpenNext bundle passed. Cloudflare Worker `afdc054e-9b37-4cf1-9145-f7ae942d4dbb` is deployed. Online guest checks show tool detail and worker-security routes redirect to the gated signup page; public signup remains closed. Authenticated browser operation of the new forms is not yet verified.
- Legal draft implementation completed in code on 2026-09-25: Privacy, Terms, DPA, active-provider register, Business Information, central legal/retention configuration, footer links, noindex and Brand schema. Commercial publication remains **LEGAL_REVIEW_REQUIRED**; see `docs/LEGAL_LAUNCH_CHECKLIST.md`.
- A test worker's employee code matched a PIN visible in a user screenshot. With user approval the single affected worker was deactivated, its employee code cleared, auth version advanced, and sessions revoked. The create form now rejects employee-code/PIN reuse. Do not reactivate until the user resets the PIN through a secure flow (not yet implemented).

- Production domain, public support contact, tenant schema, company onboarding, first-tool persistence, and location creation are deployed. Real signup, confirmation, password recovery, company onboarding, first-tool creation, and first-location creation worked in the local browser. Worker registration and real dashboard counts are implemented and tested at code/database level, pending browser verification and deployment. The Auth launch gate remains disabled in production. Next: finish worker/QR field workflows without opening public registration prematurely.

## Remaining

- Verify US search demand and competitor facts before changing roadmap routes from noindex to indexable.
- Verify session expiry/re-entry and production runtime before enabling public signup. Real email confirmation/reset and company/tool/location onboarding passed locally; SQL isolation tests pass, but automated browser E2E tests do not yet exist.
- Complete security review and authenticated browser verification of the new shared-device/PIN workflow. Five failed worker PIN attempts trigger a 15-minute cooldown; Turnstile escalation and long-term audit retention remain unfinished. Anonymous QR minimal view and owner/admin rotation still need authenticated browser checks.
- Complete browser verification of worker creation and set the production worker PIN pepper securely before enabling the Auth launch gate.
- Complete authenticated browser verification of QR labels and rotation, worker/location management, damage/maintenance forms and exports, and field-worker authentication; then customer-file uploads, import processing, and queue services. Manager TAKE/MOVE/RETURN and damage/maintenance database flows work at code/database level; full field flow is not complete.
- Privacy request fulfilment/deletion, SEO review automation, authenticated browser tests, and reconciliation of the exact reviewed legal text remain. Public legal pages now describe the verified service without draft placeholders, but the formal commercial registration gate remains closed. Waffo remains the selected provider; payment work is deferred.

## Blockers

- Production Worker Auth gate is intentionally disabled until remaining real browser signup/session tests pass. Supabase CLI is authenticated and linked; no database password was shared in chat.
- BLOCKED_BY_EXTERNAL_CREDENTIALS: A server-only Supabase service-role key must be installed as a Worker secret for field access; it is absent from local and production configuration. Production worker access remains closed, and the key must never be pasted into chat or committed.
- BLOCKED_BY_EXTERNAL_CREDENTIALS: Waffo production Merchant ID, private signing key, six published subscription Product IDs and production webhook/store configuration are not in the current environment. Do not enable checkout before verified webhook tests.
- BLOCKED_BY_EXTERNAL_CREDENTIALS: Cloudflare Queue provisioning for future import jobs.
- IMPLEMENTATION_BLOCKED: the operator and current contact@ privacy mailbox are confirmed. Provider transfer terms, operational retention cleanup, deletion fulfilment, field-worker PIN/device access and authenticated browser flows are not verified. Do not invent corporate registration details. Legal pages remain noindex but are published without public engineering placeholders.
- GitHub HTTPS works with HTTP/1.1. The local and remote `main` histories diverged during earlier API-based updates but have identical pre-change trees; reconcile without force-pushing when publishing this work.

## Next exact task

- Verify QR label download, anonymous scan, owner/admin rotation, manager PIN reset, TAKE/MOVE/RETURN, damage, maintenance and exports in an authenticated browser. Then implement rate-limited shared-device worker sessions and worker-attributed QR actions, plus privacy request fulfilment/deletion. Keep public registration gated until security, legal and production runtime checks pass.
