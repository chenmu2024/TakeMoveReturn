export type Subprocessor = {
  name: string;
  purpose: string;
  service: string;
  dataCategories: string;
  processingLocation: string;
  privacyUrl: string;
  dpaUrl: string;
  status: "active" | "planned";
  lastReviewed: string;
};

export const subprocessors: Subprocessor[] = [
  { name: "Cloudflare", purpose: "Website delivery, edge security, Workers compute, and OpenNext incremental cache in R2", service: "Workers and R2", dataCategories: "Web requests, technical identifiers, and cached application content", processingLocation: "LOCATION_REVIEW_REQUIRED — confirm account and service configuration", privacyUrl: "https://www.cloudflare.com/privacypolicy/", dpaUrl: "https://www.cloudflare.com/cloudflare-customer-dpa/", status: "active", lastReviewed: "2026-09-25" },
  { name: "Supabase", purpose: "Account authentication and tenant-scoped application database", service: "Auth and Postgres", dataCategories: "Account, workspace, worker, tool, location, and transaction records", processingLocation: "LOCATION_REVIEW_REQUIRED — confirm project region and provider terms", privacyUrl: "https://supabase.com/privacy", dpaUrl: "https://supabase.com/legal/customer-resources/data-processing-addendum", status: "active", lastReviewed: "2026-09-25" },
  { name: "Resend", purpose: "Transactional account confirmation and password-recovery email through Supabase SMTP", service: "Transactional email", dataCategories: "Recipient address and authentication email content", processingLocation: "LOCATION_REVIEW_REQUIRED — confirm provider terms", privacyUrl: "https://resend.com/legal/privacy-policy", dpaUrl: "https://resend.com/legal/dpa", status: "active", lastReviewed: "2026-09-25" },
];

export const plannedProviders = ["Waffo Pancake payment processing (deferred)", "Optional analytics and error monitoring (not configured)"];
