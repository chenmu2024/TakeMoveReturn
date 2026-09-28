# TakeMoveReturn

TakeMoveReturn is a QR based construction tool tracking product for small crews. The intended field flow is TAKE → MOVE → RETURN from a phone browser, with a durable record of the tool, holder, location, and condition. The final product requirements are in [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md); implementation progress is in [`TASKS.md`](TASKS.md).

## Current status

The public site and production registration are available at `https://takemovereturn.com/`. Auth, company onboarding, tools, locations, worker creation, shared-device enrollment and PIN sign-in have been exercised in the production browser. The owner completed a QR TAKE → MOVE → RETURN sequence; broader automated end-to-end coverage is still needed. Paid checkout remains disabled.

## Architecture

- Next.js 16 App Router and React 19 render the public and workspace pages.
- OpenNext packages the application for Cloudflare Workers. `wrangler.jsonc` contains the Worker and OpenNext cache binding.
- Supabase PostgreSQL, Auth, and RLS are the locked data design. Tracked migrations under `supabase/migrations/` are applied to project `xcdhhxyqdlorxztafpee`; rollback-only security and transaction checks are under `supabase/tests/`.
- R2 is planned for company files with storage quotas; the current R2 binding is only the OpenNext cache bucket.
- Cloudflare Queues and scheduled jobs are planned for reliable imports, cleanup, and reminders. Neither has a production workflow yet.
- Resend-backed transactional Auth email and worker PIN creation are live. Shared-device sessions and QR field actions have passed an authenticated production walkthrough but still need broader automated coverage. The user selected Waffo Pancake for future payment integration, which is intentionally deferred.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to a local `.env.local` and supply only the values needed for the service being developed. Never commit secrets.
3. Run `npm run dev` and open `http://localhost:3000`.
4. Run `npm run typecheck`, `npm run seo:audit`, and `npm run build` before a release.

Database migrations must be applied through the tracked Supabase CLI workflow, not pasted into the Dashboard SQL Editor. The project owner authenticated locally and linked project `xcdhhxyqdlorxztafpee`. For future changes, review `npx supabase db push --dry-run` and a recoverable backup before `npx supabase db push`. Enter credentials only into the local CLI prompt, never into chat or committed files. The CLI's `supabase/.temp/` connection metadata is ignored by Git.

The Cloudflare bundle is produced with `npm run cf:build`. Build with `NEXT_PUBLIC_SITE_URL=https://takemovereturn.com` so prerendered metadata and sitemap entries use the canonical origin. The production root domain is routed to the Worker through `wrangler.jsonc`; `www` redirects to the root with a Cloudflare rule. Cloudflare Email Routing forwards `contact@takemovereturn.com`, `billing@takemovereturn.com`, and `support@takemovereturn.com`; Resend-backed Supabase Auth mail has been delivered and confirmed.

Worker PIN hashing requires the private Supabase Edge Function in `supabase/functions/worker-pin-kdf/`. Deploy it before the Cloudflare Worker with `npx supabase functions deploy worker-pin-kdf --project-ref xcdhhxyqdlorxztafpee --no-verify-jwt`; its handler requires a secret API key despite the disabled platform JWT check. Keep `SUPABASE_SERVICE_ROLE_KEY` and `WORKER_PIN_PEPPER` in Worker secrets only. Never put either in a public environment variable or commit them.

## Product boundaries

Plans are Free, Starter, Growth, and Pro. The locked capacities are 25, 200, 600, and 2,000 active tools; field workers are unlimited on every plan. The visible pricing selector uses `src/config/plans.ts`. No checkout or subscription is created; Waffo Pancake integration is deferred until non-payment functionality is complete and the provider's API and webhook behavior are verified.

Company onboarding, tool and worker registration, location creation, QR labels and worker-attributed field actions are live. Database checks verify tenant isolation and tool movements; the owner also completed one production TAKE → MOVE → RETURN walkthrough. Import has local CSV/XLSX review but not server-side batch processing.

The owner approved the current Terms and Privacy text for production registration, without claiming external professional review of that exact version. Privacy export and request intake are available; deletion fulfilment remains an operational follow-up. Help and public SEO pages use canonical metadata and index gates. Google Search Console verification remains pending.

## Verification gaps

Unit, rollback-only database security, and build checks are in place, but full browser end-to-end, import reliability, load, and Lighthouse coverage remain incomplete. Billing is intentionally disabled. See `TASKS.md` for the current gaps.
