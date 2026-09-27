// Internal release evidence. These flags are deliberately not rendered on public pages.
export const legalReview = {
  method: "ai-assisted-internal-review",
  internalReviewed: true,
  privacyReviewed: true,
  termsReviewed: true,
  dpaReviewed: true,
  subprocessorsReviewed: true,
  billingTermsReviewed: true,
  dataFlowReviewed: true,
  retentionReviewed: true,
  deletionReviewed: true,
  securityClaimsReviewed: true,
  reviewedAt: "2026-09-27",
  externalProfessionalReview: "not-obtained",
} as const;
