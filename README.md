# TakeMoveReturn

TakeMoveReturn is a QR based construction tool tracking product for small crews. The intended field flow is TAKE → MOVE → RETURN from a phone browser, with a durable record of the tool, holder, location, and condition. The final product requirements are in [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md); implementation progress is in [`TASKS.md`](TASKS.md).

## Current status

The public marketing, SEO, Help Center, pricing, auth entry, and workspace interface are available for review at `https://takemovereturn.com/`. Auth forms and operational actions remain disabled by the `SUPABASE_AUTH_ENABLED` launch gate until company onboarding and security checks pass. Do not describe this deployment as production ready or treat the legal drafts as effective policies.

## Architecture

- Next.js 16 App Router and React 19 render the public and workspace pages.
- OpenNext packages the application for Cloudflare Workers. `wrangler.jsonc` contains the Worker and OpenNext cache binding.
- Supabase PostgreSQL, Auth, and RLS are the locked data design. Seven tracked SQL migrations under `supabase/migrations/` have been applied to project `xcdhhxyqdlorxztafpee`. Rollback-only tenant, plan-capacity, and transaction checks are in `supabase/tests/tenant_isolation.sql`. Real email-confirmed sign-up and browser sessions remain untested.
- R2 is planned for company files with storage quotas; the current R2 binding is only the OpenNext cache bucket.
- Cloudflare Queues and scheduled jobs are planned for reliable imports, cleanup, and reminders. Neither has a production workflow yet.
- Outbound transactional email, Turnstile, worker PINs, shared device sessions, and QR security need live integrations and security tests before account actions are enabled. The user selected Waffo Pancake for future payment integration, which is intentionally deferred.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to a local `.env.local` and supply only the values needed for the service being developed. Never commit secrets.
3. Run `npm run dev` and open `http://localhost:3000`.
4. Run `npm run typecheck`, `npm run seo:audit`, and `npm run build` before a release.

Database migrations must be applied through the tracked Supabase CLI workflow, not pasted into the Dashboard SQL Editor. The project owner authenticated locally and linked project `xcdhhxyqdlorxztafpee`; the seven current migrations are applied. For future changes, review `npx supabase db push --dry-run` and a recoverable backup before `npx supabase db push`. Enter credentials only into the local CLI prompt, never into chat or committed files. The CLI's `supabase/.temp/` connection metadata is ignored by Git.

The Cloudflare bundle is produced with `npm run cf:build`. Build with `NEXT_PUBLIC_SITE_URL=https://takemovereturn.com` so prerendered metadata and sitemap entries use the canonical origin. The production root domain is routed to the Worker through `wrangler.jsonc`; `www` redirects to the root with a Cloudflare rule. The existing `workers.dev` URL remains configured but did not respond from this environment during the latest smoke check. Cloudflare Email Routing has active forwarding rules for `contact@takemovereturn.com`, `billing@takemovereturn.com`, and `support@takemovereturn.com`; outbound sending and end-to-end delivery are not yet verified.

## Product boundaries

Plans are Free, Starter, Growth, and Pro. The locked capacities are 25, 200, 600, and 2,000 active tools; field workers are unlimited on every plan. The visible pricing selector uses `src/config/plans.ts`. No checkout or subscription is created; Waffo Pancake integration is deferred until non-payment functionality is complete and the provider's API and webhook behavior are verified.

Company onboarding and first-tool registration have a database function, server action, and page behind the disabled Auth launch gate. Database checks verified company-scoped reads, cross-tenant denials, Free-plan active-tool capacity, retired-tool capacity release, and transaction history; the fixtures were rolled back. Worker PIN hashing and shared-device schema remain foundations. This does not constitute a working QR flow without verified email delivery, worker login, rate limiting, QR labels, and browser end-to-end tests. Import requires CSV/XLSX validation, preview, batching, idempotency, Queue processing, and R2 quota enforcement; the current page explains that workflow but cannot process files.

Privacy export and deletion, file retention, outbound email, legal entity details, and counsel reviewed Privacy/Terms/DPA/subprocessor pages are still pending. The public drafts are marked `noindex` until reviewed. Help articles and public SEO pages have canonical metadata and index gates; pages based on competitor global metrics remain `noindex` until US review. Google Search Console verification is also pending.

## Verification gaps

There is no complete unit, end to end, tenant isolation, concurrency, import reliability, billing, load, or Lighthouse test suite yet. CI must run the required checks and block deployment on failure before a production launch. See `TASKS.md` for the exact blockers and next task.
