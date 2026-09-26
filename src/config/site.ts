const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://takemovereturn.com";

const legal = {
  brandName: "TakeMoveReturn",
  operatorType: "individual",
  legalOperatorName: "Qiaosheng Zhong",
  operatorCountry: "CN",
  registeredCompany: false,
  registeredSoleProprietor: false,
  legalOperatorStatement: "TakeMoveReturn is operated by Qiaosheng Zhong, an individual operator based in China.",
  countryCode: "CN",
  jurisdiction: "People's Republic of China",
  supportEmail: process.env.SUPPORT_EMAIL || "support@takemovereturn.com",
  privacyEmail: "contact@takemovereturn.com",
  legalReviewStatus: "draft" as "draft" | "effective",
  governingLaw: "People's Republic of China",
  disputeResolutionVenue: null,
  lastLegalReviewDate: null,
  lastUpdated: "2026-09-27",
  effectiveDate: null as string | null,
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
