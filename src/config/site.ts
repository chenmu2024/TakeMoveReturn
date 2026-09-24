const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const siteConfig = {
  name: "TakeMoveReturn",
  descriptor: "Construction Tool Tracking Software",
  domain: new URL(rawSiteUrl).host,
  siteUrl: rawSiteUrl,
  contactEmail: process.env.CONTACT_EMAIL || "contact@takemovereturn.com",
  billingEmail: process.env.BILLING_EMAIL || "billing@takemovereturn.com",
  supportEmail: process.env.SUPPORT_EMAIL || "support@takemovereturn.com",
  privacyEmail: process.env.PRIVACY_CONTACT_EMAIL || "contact@takemovereturn.com",
  companyLegalName: process.env.COMPANY_LEGAL_NAME ?? "",
} as const;
