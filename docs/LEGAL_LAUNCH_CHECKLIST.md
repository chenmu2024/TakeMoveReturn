# Legal commercial-launch gate

Status: **LEGAL_REVIEW_REQUIRED**. Public legal pages are working drafts and noindex. This gate does not block product development or non-commercial preview.

## Operator and contract

- [ ] Verify the individual's legal operator name; do not substitute the brand.
- [ ] Verify registered business name, registration number and tax ID if applicable; do not invent them if not applicable.
- [ ] Verify business/registered address and jurisdiction.
- [x] Support and privacy email addresses receive mail; verify production configuration again at launch.
- [ ] Lawyer reviews Privacy, Terms, DPA, provider register, governing law and dispute venue.
- [ ] Approve real effective dates and customer acceptance mechanism.
- [ ] Confirm refund policy, actual payment provider and merchant identity before paid checkout.

## Data operations

- [ ] Confirm active providers, project regions, data processing locations and provider DPA terms.
- [ ] Review applicable international transfer mechanism(s), if any, with counsel.
- [ ] Approve retention periods for every category in `src/config/retention.ts` and implement deletion/backup cleanup.
- [ ] Implement and test verified privacy requests, company-scoped export and deletion.
- [ ] Verify security/incident procedures before describing them as contractual controls.
- [ ] Re-review legal copy after QR field flow, uploads, imports, analytics or billing launch.

`npm run legal:audit` checks route/content wiring. `npm run legal:audit -- --production` additionally checks key environment flags; it is a guardrail, **not** a substitute for evidence or legal review. Do not set approval flags merely to pass the script. Final human sign-off is required.
