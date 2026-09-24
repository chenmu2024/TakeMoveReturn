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
- Cloudflare Worker deployed at `https://takemovereturn.zhongqiaosheng.workers.dev` (version `c5d7b87c-bff6-413f-a9a8-cba812e6c930`).
- Production URL smoke check: HTTP 200, expected title, and TakeMoveReturn brand present.
- Roadmap route checks: industry, guide, and comparison pages returned HTTP 200 with FAQ/workflow content and `noindex, nofollow` robots.
- Current typecheck, Next.js production build, and OpenNext Cloudflare bundle: passed (Windows compatibility warning remains).
- Current SEO route count: 26 canonical routes; SEO audit passed after adding the expansion industry candidates.
- Latest Cloudflare Worker deployment: version `11f6968b-3d05-4a3b-9e35-fdd0febed60b`.
- Runtime SEO checks: homepage, Help, industry, and guide pages returned HTTP 200 with expected canonical, Open Graph, JSON-LD, and robots output.

## Current task

- Expand the validated public marketing interface into authenticated product workflows once external services are configured.

## Remaining

- Verify US search demand and competitor facts before changing roadmap routes from noindex to indexable.
- Supabase migrations, Auth, and RLS.
- Secure shared-device/PIN/QR workflow.
- Tool, worker, location, transaction, damage, maintenance, import, R2, and queue services.
- Billing, privacy, help center, SEO system, tests, CI, and production domain/legal review.

## Blockers

- BLOCKED_BY_EXTERNAL_CREDENTIALS: Supabase project credentials.
- BLOCKED_BY_EXTERNAL_CREDENTIALS: Stripe products and webhook secret.
- BLOCKED_BY_EXTERNAL_CREDENTIALS: Resend API key.
- BLOCKED_BY_EXTERNAL_CREDENTIALS: Cloudflare Queue provisioning for future import jobs.
- BLOCKED_BY_EXTERNAL_CREDENTIALS: production domain and legal entity information.

## Next exact task

- Configure Supabase credentials, then implement and test authenticated company onboarding and the first-tool workflow.
