# TakeMoveReturn delivery tracker

## Completed

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

- Legal draft implementation completed in code on 2026-09-25: Privacy, Terms, DPA, active-provider register, Business Information, central legal/retention configuration, footer links, noindex and Brand schema. Commercial publication remains **LEGAL_REVIEW_REQUIRED**; see `docs/LEGAL_LAUNCH_CHECKLIST.md`.
- A test worker's employee code matched a PIN visible in a user screenshot. With user approval the single affected worker was deactivated, its employee code cleared, auth version advanced, and sessions revoked. The create form now rejects employee-code/PIN reuse. Do not reactivate until the user resets the PIN through a secure flow (not yet implemented).

- Production domain, public support contact, tenant schema, company onboarding, first-tool persistence, and location creation are deployed. Real signup, confirmation, password recovery, company onboarding, first-tool creation, and first-location creation worked in the local browser. Worker registration and real dashboard counts are implemented and tested at code/database level, pending browser verification and deployment. The Auth launch gate remains disabled in production. Next: finish worker/QR field workflows without opening public registration prematurely.

## Remaining

- Verify US search demand and competitor facts before changing roadmap routes from noindex to indexable.
- Verify session expiry/re-entry and production runtime before enabling public signup. Real email confirmation/reset and company/tool/location onboarding passed locally; SQL isolation tests pass, but automated browser E2E tests do not yet exist.
- Secure shared-device/PIN/QR workflow.
- Complete browser verification of worker creation and set the production worker PIN pepper securely before enabling the Auth launch gate.
- Complete QR label generation, worker/location management, field-worker authentication, and TAKE/MOVE/RETURN UI; then damage, maintenance, import, R2, and queue services. Tool creation and transaction SQL exist, but the full field flow is not complete.
- Privacy request processing, SEO review automation, tests, CI, and legal review. Help content and legal drafts are published as UI, not as completed legal or support operations. Payment implementation is intentionally last.

## Blockers

- Production Worker Auth gate is intentionally disabled until remaining real browser signup/session tests pass. Supabase CLI is authenticated and linked; no database password was shared in chat.
- BLOCKED_BY_EXTERNAL_CREDENTIALS: Waffo Pancake integration details, deferred by the user until non-payment functionality is complete.
- BLOCKED_BY_EXTERNAL_CREDENTIALS: Cloudflare Queue provisioning for future import jobs.
- BLOCKED_BY_EXTERNAL_CREDENTIALS: final legal operator name, registered business information if applicable, business address, final payment merchant identity, refund policy, processing locations/transfer terms, and professional legal review. The operator is known to be an individual in mainland China; AI cannot invent the remaining identity facts. Draft legal pages remain noindex. This does not block engineering.
- GitHub HTTPS works with HTTP/1.1. The local and remote `main` histories diverged during earlier API-based updates but have identical pre-change trees; reconcile without force-pushing when publishing this work.

## Next exact task

- Implement and test worker/QR field workflows while keeping public registration gated until security and production runtime checks pass.
