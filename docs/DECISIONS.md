# Architecture decisions

## OpenNext on Cloudflare Workers

**Decision:** Use standard Next.js 16 App Router with the OpenNext Cloudflare adapter.

**Status:** LOCKED

**Reason:** The project specification explicitly excludes vinext and Cloudflare Pages Static Export.

## Data platform

**Decision:** Use Supabase PostgreSQL, Supabase Auth, and PostgreSQL Row Level Security for all tenant data.

**Status:** LOCKED — seven tracked migrations are applied to the live project. Rollback-only SQL checks cover two-company isolation and first-tool capacity; browser Auth and real customer sessions remain pending.

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

**Decision:** Defer payment implementation until the non-payment product is ready. The user selected Waffo Pancake as the intended provider, superseding the historical Stripe-specific implementation instructions. Do not enable paid actions before the provider's API and webhook behavior are verified.

**Status:** DEFERRED

## Legal identity and policy publication

**Decision:** AI may draft and review product-facing legal copy, but must not invent the operator's legal name, registration jurisdiction, registered address, or other legal identity facts. Keep legal pages marked as review drafts and noindex until the real operator details and legal review are supplied.

**Status:** BLOCKED_BY_EXTERNAL_INFORMATION for final publication; non-legal product work continues.
