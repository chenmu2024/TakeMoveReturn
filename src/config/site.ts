const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const legal = {
  brandName: "TakeMoveReturn",
  operatorType: "individual",
  legalOperatorName: process.env.LEGAL_OPERATOR_NAME || null,
  registeredBusinessName: process.env.REGISTERED_BUSINESS_NAME || null,
  registrationNumber: process.env.REGISTRATION_NUMBER || null,
  taxId: process.env.TAX_ID || null,
  countryCode: "CN",
  jurisdiction: "People's Republic of China",
  registeredAddress: process.env.REGISTERED_ADDRESS || null,
  businessAddress: process.env.BUSINESS_ADDRESS || null,
  supportEmail: process.env.SUPPORT_EMAIL || "support@takemovereturn.com",
  privacyEmail: process.env.PRIVACY_CONTACT_EMAIL || "contact@takemovereturn.com",
  legalReviewStatus: "draft",
  governingLaw: "People's Republic of China",
  disputeResolutionVenue: null,
  lastLegalReviewDate: null,
  lastUpdated: "2026-09-25",
  effectiveDate: null,
  refundPolicyStatus: "REFUND_POLICY_REVIEW_REQUIRED",
} as const;

export const siteConfig = {
  name: "TakeMoveReturn",
  descriptor: "Construction Tool Tracking Software",
  domain: new URL(rawSiteUrl).host,
  siteUrl: rawSiteUrl,
  contactEmail: process.env.CONTACT_EMAIL || "contact@takemovereturn.com",
  billingEmail: process.env.BILLING_EMAIL || "billing@takemovereturn.com",
  supportEmail: legal.supportEmail,
  privacyEmail: legal.privacyEmail,
  legal,
} as const;
