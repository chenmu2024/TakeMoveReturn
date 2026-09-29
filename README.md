# TakeMoveReturn

TakeMoveReturn is QR-based construction tool tracking software for small crews. The core field flow is **TAKE → MOVE → RETURN** from a phone browser, with a durable record of the tool, holder, recorded location, condition and history. Product requirements live in [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md); the delivery log is in [`TASKS.md`](TASKS.md).

## Current production status

The public site and registration are available at `https://takemovereturn.com/`. Auth, company onboarding, tools, locations, worker creation, shared-device enrollment, worker PIN sign-in and a production QR TAKE → MOVE → RETURN walkthrough have been exercised. CSV/XLSX imports use server revalidation plus Cloudflare Queue-backed batches.

Waffo Pancake is the active Merchant of Record integration for **new paid checkout**. Checkout is owner-only and uses server-side product IDs and signed Waffo API requests. A real payment has been reported, but automatic entitlement from a delivered, signed production webhook has not yet been independently verified end-to-end. Existing paid subscriptions do not yet have self-service upgrade, downgrade or cancellation inside TakeMoveReturn; billing support handles those changes.

Customer-file uploads are **not** enabled. R2 is currently used only for the OpenNext incremental cache. Storage allowances exist in plan configuration but should not be treated as an available customer-file feature until upload, quota and deletion flows are implemented and verified.

## Architecture

- **Next.js 16 App Router + React 19** for public and workspace UI.
- **OpenNext for Cloudflare Workers** for production runtime.
- **Supabase PostgreSQL + Auth + RLS** for tenant data and authorization.
- **Cloudflare Queues** for background tool-import batches.
- **Cloudflare R2** for OpenNext cache only; no customer-file bucket is active.
- **Resend via Supabase SMTP** for transactional account email.
- **Waffo Pancake** for Merchant of Record checkout and subscription events.
- **QR + shared-device worker sessions** for browser-based field handoffs.

Tracked database migrations are under `supabase/migrations/`; rollback-only security and transaction checks are under `supabase/tests/`.

## Local setup

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and configure only the services needed locally.
3. For Worker-specific secrets, copy `.dev.vars.example` to `.dev.vars`. Never commit real secrets.
4. Run `npm run dev` and open `http://localhost:3000`.
5. Before a release, run:
   - `npm run typecheck`
   - `npm test`
   - `npm run db:audit`
   - `npm run seo:audit`
   - `npm run legal:audit`
   - `npm run release:audit`
   - `npm run build`
   - `npm run cf:build`

Database migrations must be applied through the tracked Supabase CLI workflow. Review `npx supabase db push --dry-run` and a recoverable backup before `npx supabase db push`. Never paste service-role keys, worker PIN peppers or payment private keys into chat or committed files.

The Cloudflare bundle is produced with `npm run cf:build`. Production metadata and sitemap entries use `https://takemovereturn.com` as the canonical origin.

## Security and data boundaries

- Workspace access requires Supabase Auth plus current legal acceptance.
- Tenant records are protected by company-scoped RLS and server-side role checks.
- Worker PINs are derived values; plaintext PINs are not stored.
- Field QR tokens identify a tool but do not authenticate a worker.
- Shared-device and worker sessions are revocable and checked against worker status/auth version.
- Import jobs are revalidated server-side and processed in idempotent batches.
- Customer-file uploads, live GPS, RFID, Bluetooth beacon tracking, fleet telematics, ERP and full CMMS behavior are outside the active product scope.

## Plans and billing

The locked plan capacities are:

- Free: 25 active tools, 1 admin, unlimited field workers
- Starter: 200 active tools, 2 admins, unlimited field workers
- Growth: 600 active tools, 5 admins, unlimited field workers
- Pro: 2,000 active tools, 10 admins, unlimited field workers

Monthly/annual prices and capacity limits come from `src/config/plans.ts`. Paid checkout is available for a free workspace owner when production billing is enabled. Subscription state is designed to update from accepted signed Waffo webhook events. Self-service plan changes and cancellation after activation remain an implementation gap.

## SEO

Public SEO metadata, canonical URLs, index gates and the keyword registry are centralized in `src/data/seo-keywords.ts`. Core verified money pages are indexable; unverified Industry / Best / Guide candidates remain noindex until their US keyword and SERP validation gates are complete.

The obsolete static `dist/` site is intentionally removed and ignored. The production application is the Next.js/OpenNext codebase only.

## Known gaps

The repository must **not** be described as fully production-complete while these remain open:

- verify a real Waffo signed webhook through subscription entitlement;
- implement or formally define upgrade, downgrade, cancellation and failed-payment operations;
- implement membership/admin management rather than only plan limits;
- implement customer-file upload/storage quota/deletion before selling storage as an active feature;
- complete privacy-request fulfilment and retention cleanup operations;
- add automated browser E2E, database-security CI, load and Lighthouse coverage;
- complete remaining authenticated production browser verification;
- validate US search demand before indexing pending SEO routes.

See `TASKS.md` for the detailed history and current blockers.
