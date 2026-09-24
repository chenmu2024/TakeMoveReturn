# TakeMoveReturn

TakeMoveReturn is a QR based construction tool tracking product for small crews. The intended field flow is TAKE → MOVE → RETURN from a phone browser, with a durable record of the tool, holder, location, and condition. The final product requirements are in [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md); implementation progress is in [`TASKS.md`](TASKS.md).

## Current status

The public marketing, SEO, Help Center, pricing, auth entry, and workspace interface are available for review. Auth forms and operational actions are intentionally disabled because the secure services are not connected. Do not describe this deployment as production ready or treat the legal drafts as effective policies.

## Architecture

- Next.js 16 App Router and React 19 render the public and workspace pages.
- OpenNext packages the application for Cloudflare Workers. `wrangler.jsonc` contains the Worker and OpenNext cache binding.
- Supabase PostgreSQL, Auth, and RLS are the locked data design. SQL migrations are under `supabase/migrations/`; they have not been applied to a live project here.
- R2 is planned for company files with storage quotas; the current R2 binding is only the OpenNext cache bucket.
- Cloudflare Queues and scheduled jobs are planned for reliable imports, cleanup, and reminders. Neither has a production workflow yet.
- Stripe monthly and annual prices, Resend email, Turnstile, worker PINs, shared device sessions, and QR security need live integrations and security tests before account actions are enabled.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to a local `.env.local` and supply only the values needed for the service being developed. Never commit secrets.
3. Run `npm run dev` and open `http://localhost:3000`.
4. Run `npm run typecheck`, `npm run seo:audit`, and `npm run build` before a release.

The Cloudflare bundle is produced with `npm run cf:build`. Deploy the verified bundle using Wrangler only after setting `NEXT_PUBLIC_SITE_URL` to the intended canonical origin. The current public preview is at `https://takemovereturn.zhongqiaosheng.workers.dev/`; the final domain has not been selected.

## Product boundaries

Plans are Free, Starter, Growth, and Pro. The locked capacities are 25, 200, 600, and 2,000 active tools; field workers are unlimited on every plan. The visible pricing selector uses `src/config/plans.ts`. No checkout or subscription is created until verified Stripe products and signed webhooks are connected.

Worker PIN hashing, plan capacity rules, shared device session schema, and tool transaction SQL are present as foundations. They do not constitute a working QR flow without authentication, role checks, tenant isolation, rate limiting, API validation, and runtime tests. Import requires CSV/XLSX validation, preview, batching, idempotency, Queue processing, and R2 quota enforcement; the current page explains that workflow but cannot process files.

Privacy export and deletion, file retention, support email, legal entity details, and counsel reviewed Privacy/Terms/DPA/subprocessor pages are still pending. The public drafts are marked `noindex` until reviewed. Help articles and public SEO pages have canonical metadata and index gates; pages based on competitor global metrics remain `noindex` until US review. A production domain and Google Search Console verification are also pending.

## Verification gaps

There is no complete unit, end to end, tenant isolation, concurrency, import reliability, billing, load, or Lighthouse test suite yet. CI must run the required checks and block deployment on failure before a production launch. See `TASKS.md` for the exact blockers and next task.
