const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const siteConfig = {
  name: "TakeMoveReturn",
  descriptor: "Construction Tool Tracking Software",
  domain: new URL(rawSiteUrl).host,
  siteUrl: rawSiteUrl,
  supportEmail: process.env.SUPPORT_EMAIL ?? "",
  privacyEmail: process.env.PRIVACY_CONTACT_EMAIL ?? "",
  companyLegalName: process.env.COMPANY_LEGAL_NAME ?? "",
} as const;
