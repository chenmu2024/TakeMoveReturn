# Legal commercial-launch gate

Status: **REGISTRATION_AND_NEW_CHECKOUT_OPEN_WITH_OPERATIONAL_FOLLOW_UP**.

The owner-approved legal pages are public and noindex. Registration is enabled. New paid checkout is enabled through Waffo Pancake for eligible workspace owners. This checklist records remaining operational and legal-review work; it is not evidence of external professional review.

## Operator and contract

- [x] Operator identity remains Qiaosheng Zhong, an individual operating from the People's Republic of China; TakeMoveReturn is a brand, not a registered corporation.
- [x] `contact@takemovereturn.com`, `support@takemovereturn.com`, and `billing@takemovereturn.com` are the published contact channels.
- [x] Current Privacy, Terms, DPA and provider-register copy is published without claiming lawyer approval.
- [x] Current legal acceptance version remains `2026-09-28`; public copy was factually updated on 2026-09-29 to reflect active Waffo checkout. This update does not by itself claim a new externally reviewed legal version.
- [x] Waffo Pancake is disclosed as the active Merchant of Record for paid checkout and payment-related processing.
- [x] Public legal copy no longer states that paid checkout is disabled.
- [x] Customer-file uploads are explicitly described as unavailable.

## Billing operations

- [x] Owner-only new paid checkout route exists.
- [x] Server-side product IDs and signed Waffo client requests are used.
- [x] Signed webhook verification and store-ID validation are implemented in code.
- [x] Duplicate/stale billing-event handling is implemented in the database function.
- [ ] Independently verify a real production Waffo webhook delivery and resulting plan entitlement.
- [ ] Verify renewal, recovery, past-due, canceling and canceled events in production or an authoritative provider test environment.
- [x] Implement owner-requested plan changes, billing-interval changes, cancellation and reactivation with provider-authoritative webhook confirmation.
- [x] Re-review the public Terms/Help wording for the implemented self-service subscription-management behavior.
- [ ] Apply the billing-lifecycle migration and verify the self-service actions against the production Waffo store before treating them as production-verified.

## Data operations

- [x] Limited signed-in account export exists.
- [x] Owner/admin company CSV reports exist.
- [x] Privacy requests are stored and tenant-scoped.
- [x] Cloudflare Queues is disclosed for import batch delivery.
- [x] Waffo is listed in the active provider register.
- [ ] Complete verified privacy-request fulfilment, including deletion/rectification/restriction procedures.
- [ ] Approve and implement retention cleanup for the categories in `src/config/retention.ts`.
- [ ] Review provider backup/deletion behavior and applicable international-transfer mechanism(s).
- [ ] Re-review data-processing language before enabling customer-file uploads, analytics or additional monitoring providers.

## Product capability disclosures

- [x] Public pages do not claim live GPS, RFID, Bluetooth beacon, ERP or full CMMS behavior.
- [x] Pricing now states that plan storage allowances do not mean customer-file uploads are currently available.
- [ ] Implement customer-file upload/storage/quota/deletion before presenting storage as an active upload feature.
- [ ] Implement membership/admin management before treating admin-count limits as a complete self-service feature.

## Release evidence

`npm run legal:audit` checks route/content and consent wiring.

`npm run release:audit` checks production-state consistency including active Waffo disclosure, removal of legacy `dist/`, storage transparency, provider state, legacy-brand leakage, health/error fallbacks and CI verification wiring.

`npm run runtime:smoke` starts the built production server and checks representative public, auth, private, API, sitemap, robots and 404 behavior. `npm run load:smoke` is a small local concurrency regression baseline; it is not evidence of production load capacity.

The monthly scheduled SEO workflow, Dependabot and `SECURITY.md` add maintenance and reporting guardrails. They do not replace authenticated production tests, incident procedures or professional review.

`npm run legal:audit -- --production` still requires external evidence flags. It is a guardrail, not a substitute for operational evidence or professional legal review. Do not set flags merely to make the command pass.
