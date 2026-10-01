const rawSiteUrl = "https://takemovereturn.com";

const legal = {
  operatingName: "TakeMoveReturn",
  operatorType: "individual",
  legalOperatorName: "Qiaosheng Zhong",
  operatingCountry: "People's Republic of China",
  countryCode: "CN",
  registeredBusinessName: null,
  registrationNumber: null,
  registeredAddress: null,
  legalOperatorStatement: "TakeMoveReturn is an independently operated construction tool tracking service operated from the People's Republic of China.",
  supportEmail: process.env.SUPPORT_EMAIL || "support@takemovereturn.com",
  privacyEmail: process.env.PRIVACY_CONTACT_EMAIL || "contact@takemovereturn.com",
  legalReviewStatus: "effective" as "draft" | "effective",
  governingLaw: "People's Republic of China",
  disputeResolutionVenue: null,
  lastLegalReviewDate: null,
  lastUpdated: "2026-10-01",
  effectiveDate: "2026-09-28" as string | null,
  refundPolicyStatus: "owner-approved",
} as const;

export const siteConfig = {
  name: "TakeMoveReturn",
  brandName: "TakeMoveReturn",
  descriptor: "Construction Tool Tracking Software",
  domain: new URL(rawSiteUrl).host,
  siteUrl: rawSiteUrl,
  contactEmail: process.env.CONTACT_EMAIL || "contact@takemovereturn.com",
  billingEmail: process.env.BILLING_EMAIL || "billing@takemovereturn.com",
  supportEmail: legal.supportEmail,
  privacyEmail: legal.privacyEmail,
  legal,
} as const;
