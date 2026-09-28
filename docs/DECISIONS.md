# Architecture decisions

## OpenNext on Cloudflare Workers

**Decision:** Use standard Next.js 16 App Router with the OpenNext Cloudflare adapter.

**Status:** LOCKED

**Reason:** The project specification explicitly excludes vinext and Cloudflare Pages Static Export.

## Data platform

**Decision:** Use Supabase PostgreSQL, Supabase Auth, and PostgreSQL Row Level Security for all tenant data.

**Status:** LOCKED — tracked migrations are applied to the linked project as of 2026-09-28. Rollback-only SQL checks cover two-company isolation, first-tool capacity, legal acceptance and re-acceptance, QR lookup/rotation, field-session boundaries, device revocation, worker deactivation, company settings, workspace search, atomic bulk return and atomic selected transfer; the new import preflight SQL test requires a local Docker/Podman runtime and has not run. Full authenticated browser workflows remain pending.

## Branding

**Decision:** Use TakeMoveReturn as the public product name and retain “Construction Tool Tracking Software” as its descriptor.

**Status:** LOCKED

## Pricing

**Decision:** Use Free, Starter, Growth, and Pro plans with the limits in `docs/PROJECT_SPEC.md`; field workers remain unlimited on every plan.

**Status:** LOCKED

## Production domain and public email addresses

**Decision:** Use `takemovereturn.com` as the canonical site domain. Use `contact@takemovereturn.com` for general/privacy contact, `support@takemovereturn.com` for help, and reserve `billing@takemovereturn.com` for future billing communication.

**Status:** LOCKED — the root domain routes to the existing Cloudflare Worker. The user confirms receipt through Cloudflare Email Routing and sending from an email client for all three addresses. Cloudflare Email Sending is unavailable on the current free plan; the user selected Resend's free plan for automated Auth mail. The domain is verified in Resend, and Supabase custom SMTP is configured with a domain-restricted sending-only key. Two new accounts received and confirmed real signup mail on 2026-09-28; both recorded the current legal version, and one logged into the production workspace. Production public Auth is now enabled. Payment remains gated off.

## Payment provider

**Decision:** Waffo Pancake is the sole selected provider for production subscriptions. Waffo.com Limited is Merchant of Record for applicable transactions. Work on billing now, but do not enable paid actions before production products, checkout API, signatures and webhook behavior are verified.

**Status:** LOCKED — production checkout is enabled at the owner's direction on 2026-09-28. A real payment was reported by the owner, but signed Webhook delivery and automatic entitlement for that payment have not yet been independently verified.

## Legal identity and policy publication

**Decision:** TakeMoveReturn is a brand operated by Qiaosheng Zhong, an individual based in China. There is no registered company or sole proprietorship. The owner confirms the refund principle and says legal review is complete; do not claim a specific revised text was reviewed unless that version is evidenced. Keep incomplete service promises out of operative documents.

**Status:** LOCKED identity and payment-provider decisions. On 2026-09-28 the owner approved the current legal text for use, with 2026-09-28 as its effective date; this is owner approval, not a claim of external professional review. The owner authorized production registration after the initial signup/login evidence. Operational privacy and authenticated field-flow checks remain open.

**2026-09-27 clarification:** `privacy@takemovereturn.com` is not configured. Use the already verified `contact@takemovereturn.com` for privacy correspondence. A limited signed-in account export and request queue are implemented, but deletion fulfilment and legal transfer review remain outstanding.
