# Privacy request operations

Only the product operator may process requests. Workspace owners/admins are not privacy operators for other customers. Use the local operator tool with service-role credentials from a secure environment; never put credentials, evidence files or exported personal data in the repository.

1. Run `node scripts/privacy-review.mjs list` to list open request IDs (oldest first).
2. Verify the requester through their authenticated account or verified account email. Never request a password or PIN. Record a private evidence/ticket reference.
3. Submit a private JSON file with `requestId`, `expectedStatus: "pending"`, `status: "in_review"`, `operatorReference`, `evidenceReference`, and a safe requester-visible `responseSummary`, using `node scripts/privacy-review.mjs review <file>`.
4. Fulfil the appropriate request below. Record what was actually done, any retained categories/reasons, and securely send the response to the verified requester. Do not label an operation completed merely because it was reviewed.
5. Submit another review with `expectedStatus: "in_review"` and `status: "completed"` or `"rejected"`. Provide a specific, non-sensitive summary and evidence reference. Rejection must explain the reason and how to contact contact@takemovereturn.com. Closed requests cannot be silently reopened or rewritten through this tool.

## Fulfilment safeguards

- Access/export: start with the signed-in account export. For larger/omitted records, collect only that verified person's attributed data in bounded, paginated queries; exclude other workers' or customers' data. Encrypt delivery or use an authenticated channel. Remove local exports after delivery according to the retention policy.
- Rectification: identify exact fields and their source. Correct editable profile/workspace data through existing authenticated controls. Preserve tool movement history; record a correction rather than rewriting the original event.
- Restriction: agree the exact scope first. Disable relevant memberships/devices through existing controls, revoke Auth sessions, and confirm access denial. Do not disable unrelated users or destroy required records.
- Deletion: check company ownership, subscription obligations, legal holds, retained transaction evidence and private R2 objects before deleting anything. Arrange ownership transfer or company closure as appropriate. Revoke sessions and access first (deleting an Auth user alone does not invalidate issued access tokens). Remove approved R2 files through the file-deletion workflow and verify object removal/quota reconciliation. Delete/anonymize only the approved personal records, preserve required company history with a documented legal basis, then verify the account and direct file URLs cannot access data.
- Never run broad company/user deletion based solely on a request ID. Obtain explicit approval for irreversible actions, resolve exact targets, and retain only minimal evidence necessary for accountability.

The status workflow and audit are implemented; fulfilment remains a verified operator process, not automatic bulk deletion. Public summaries must not include internal investigation notes, identity documents, secrets or other people's details.
