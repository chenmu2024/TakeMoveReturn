# Legal commercial-launch gate

Status: **IMPLEMENTATION_REVIEW_REQUIRED**. The owner has identified the individual operator and approved a refund principle. Public legal pages remain noindex while wording and actual product/privacy operations are reconciled; do not misstate them as active contractual controls.

## Operator and contract

- [x] Owner confirmed legal operator Qiaosheng Zhong, individual based in China; TakeMoveReturn is only the brand.
- [x] Owner confirmed no registered company or sole proprietorship; do not invent registration details.
- [x] Support and privacy email addresses receive mail; verify production configuration again at launch.
- [ ] Owner says legal review was completed; reconcile the exact revised Privacy, Terms, DPA and provider-register version with that review before publication. Do not claim lawyer approval on the site.
- [ ] Approve effective dates; deploy and test the signup acceptance migration and workflow.
- [x] Owner confirmed refund principle and Waffo.com Limited as Merchant of Record; actual checkout remains unimplemented.
- [x] Use verified `contact@takemovereturn.com` for privacy requests; `privacy@` is not configured.

## Data operations

- [ ] Confirm all active-provider subprocessor locations and applicable DPA terms. Verified on 2026-09-27: Supabase project `xcdhhxyqdlorxztafpee` reports `us-west-1` via `supabase projects list`; the Cloudflare R2 cache bucket reports `WNAM` via `wrangler r2 bucket info`; Resend's DPA states its primary processing is in the United States. These facts do not establish a legal transfer mechanism or guarantee all processing stays in one region.
- [ ] Review applicable international transfer mechanism(s), if any, with counsel.
- [ ] Approve retention periods for every category in `src/config/retention.ts` and implement deletion/backup cleanup.
- [ ] Complete verified privacy-request handling, company-scoped export and deletion. The signed-in request queue and limited personal account export are implemented; manual review and deletion execution are not.
- [ ] Verify security/incident procedures before describing them as contractual controls.
- [ ] Re-review legal copy after QR field flow, uploads, imports, analytics or billing launch.

`npm run legal:audit` checks route/content and consent wiring. `npm run legal:audit -- --production` additionally checks launch evidence flags; it is a guardrail, **not** a substitute for evidence or legal review. Do not set flags merely to pass the script. Final human sign-off is required.
