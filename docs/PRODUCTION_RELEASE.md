# Production release setup

TakeMoveReturn production releases are intentionally gated. A successful `CI` run on the current `main` commit triggers `.github/workflows/deploy-production.yml`.

## Required GitHub production secrets

The GitHub environment named `production` must provide:

- `CLOUDFLARE_API_TOKEN` — token permitted to deploy the TakeMoveReturn Worker and its configured bindings/routes.
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account containing the `takemovereturn` Worker.
- `SUPABASE_ACCESS_TOKEN` — Supabase CLI token with the read permissions required by `supabase link`.
- `SUPABASE_DB_PASSWORD` — database password for the TakeMoveReturn production project.
- `SUPABASE_PROJECT_ID` — production Supabase project reference.

Do not commit any of these values to the repository.

## Release order

1. CI validates the database locally, typechecks, tests, audits, builds Next.js and OpenNext, and runs smoke checks.
2. Deploy Production confirms the triggering SHA is still current `main`; stale CI runs are skipped.
3. The workflow links the production Supabase project.
4. `supabase db push --dry-run` previews pending migrations.
5. `supabase db push` applies only migrations missing from remote migration history.
6. OpenNext builds and `wrangler deploy` publishes the Worker.
7. The workflow requests `/api/ready` and `/api/version` and requires the live commit SHA to equal the deployed `main` SHA.

Production deployment fails before any database or Worker mutation when a required secret is missing.

## Current external state

As of 2026-10-01, the connected ChatGPT Supabase account exposes only an inactive project named `art`; it has not been identified as TakeMoveReturn production. Do not apply TakeMoveReturn migrations to that project unless ownership is independently confirmed.

The live site was still serving the prior Help content and returned 404 for `/api/version` during the audit, confirming that the production Worker had not yet reached the latest `main` commit.

## One-time verification after secrets are configured

Run `Deploy Production` manually or push a CI-passing commit. A successful release must show both the database migration steps and the final deployed-commit verification as successful. Then verify the authenticated core workflow separately.
