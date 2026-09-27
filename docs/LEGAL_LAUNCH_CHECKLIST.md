# Legal commercial-launch gate

Status: **REGISTRATION_OPEN_WITH_OPERATIONAL_FOLLOW_UP**. The owner-approved legal pages are public and noindex; new account registration and acceptance are enabled. This checklist records remaining data-operations work and is not a claim of external professional review. See `docs/INTERNAL_LEGAL_REVIEW.md` for evidence and limits.

## Operator and contract

- [x] Owner confirmed legal operator Qiaosheng Zhong, individual based in China; TakeMoveReturn is only the brand.
- [x] Owner confirmed no registered company or sole proprietorship; do not invent registration details.
- [x] Support and privacy email addresses receive mail; verify production configuration again at launch.
- [x] On 2026-09-28 the owner approved the current Privacy, Terms, DPA and provider-register text for use. This is owner sign-off, not evidence of external professional review; do not claim lawyer approval on the site.
- [x] Set the owner-approved legal effective date to 2026-09-28. Two new test accounts confirmed email and recorded the current Terms/Privacy versions; one logged into the production workspace. Older-account re-consent needs browser verification.
- [x] Waffo.com Limited is the selected future Merchant of Record; paid checkout remains disabled. Current public Terms do not promise an unimplemented refund workflow.
- [x] Use verified `contact@takemovereturn.com` for privacy requests; `privacy@` is not configured.

## Data operations

- [ ] Confirm all active-provider subprocessor locations and applicable DPA terms. Verified on 2026-09-27: Supabase project `xcdhhxyqdlorxztafpee` reports `us-west-1` via `supabase projects list`; the Cloudflare R2 cache bucket reports `WNAM` via `wrangler r2 bucket info`; Resend's DPA states its primary processing is in the United States. These facts do not establish a legal transfer mechanism or guarantee all processing stays in one region.
- [ ] Review applicable international transfer mechanism(s), if any, with counsel.
- [ ] Approve retention periods for every category in `src/config/retention.ts` and implement deletion/backup cleanup.
- [ ] Complete verified privacy-request handling, company-scoped export and deletion. The signed-in request queue and limited personal account export are implemented; manual review and deletion execution are not.
- [ ] Verify security/incident procedures before describing them as contractual controls.
- [ ] Re-review legal copy after QR field flow, uploads, imports, analytics or billing launch.

`npm run legal:audit` checks route/content and consent wiring. `npm run legal:audit -- --production` additionally checks launch evidence flags; it is a guardrail, **not** a substitute for evidence or legal review. Do not set flags merely to pass the script. Final human sign-off is required.
