# Architecture decisions

## OpenNext on Cloudflare Workers

**Decision:** Use standard Next.js 16 App Router with the OpenNext Cloudflare adapter.

**Status:** LOCKED

**Reason:** The project specification explicitly excludes vinext and Cloudflare Pages Static Export.

## Data platform

**Decision:** Use Supabase PostgreSQL, Supabase Auth, and PostgreSQL Row Level Security for all tenant data.

**Status:** LOCKED — all 24 tracked migrations are applied to the linked project as of 2026-09-27. Rollback-only SQL checks cover two-company isolation, first-tool capacity, legal acceptance, QR lookup/rotation, field-session boundaries, device revocation, worker deactivation, company settings, workspace search, atomic bulk return and atomic selected transfer; full authenticated browser workflows remain pending.

## Branding

**Decision:** Use TakeMoveReturn as the public product name and retain “Construction Tool Tracking Software” as its descriptor.

**Status:** LOCKED

## Pricing

**Decision:** Use Free, Starter, Growth, and Pro plans with the limits in `docs/PROJECT_SPEC.md`; field workers remain unlimited on every plan.

**Status:** LOCKED

## Production domain and public email addresses

**Decision:** Use `takemovereturn.com` as the canonical site domain. Use `contact@takemovereturn.com` for general/privacy contact, `support@takemovereturn.com` for help, and reserve `billing@takemovereturn.com` for future billing communication.

**Status:** LOCKED — the root domain routes to the existing Cloudflare Worker. The user confirms receipt through Cloudflare Email Routing and sending from an email client for all three addresses. Cloudflare Email Sending is unavailable on the current free plan; the user selected Resend's free plan for automated Auth mail. The domain is verified in Resend, and Supabase custom SMTP is configured with a domain-restricted sending-only key. A real signup confirmation and password-reset email were received at `support@takemovereturn.com`; the user confirmed the account and set a password. Authenticated local company onboarding also succeeded. Production public Auth remains gated off pending further browser workflow checks.

## Payment provider

**Decision:** Waffo Pancake is the sole selected provider for production subscriptions. Waffo.com Limited is Merchant of Record for applicable transactions. Work on billing now, but do not enable paid actions before production products, checkout API, signatures and webhook behavior are verified.

**Status:** LOCKED — integration not yet complete.

## Legal identity and policy publication

**Decision:** TakeMoveReturn is a brand operated by Qiaosheng Zhong, an individual based in China. There is no registered company or sole proprietorship. The owner confirms the refund principle and says legal review is complete; do not claim a specific revised text was reviewed unless that version is evidenced. Keep incomplete service promises out of operative documents.

**Status:** LOCKED identity and payment-provider decisions. Formal publication still requires the privacy request/deletion operations, provider-region review, verified privacy mailbox, and final content/version sign-off to match deployed behavior.

**2026-09-27 clarification:** `privacy@takemovereturn.com` is not configured. Use the already verified `contact@takemovereturn.com` for privacy correspondence. A limited signed-in account export and request queue are implemented, but deletion fulfilment and legal transfer review remain outstanding.
