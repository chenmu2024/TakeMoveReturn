export type Subprocessor = {
  name: string;
  purpose: string;
  service: string;
  dataCategories: string;
  role: string;
  processingLocation: string;
  privacyUrl: string;
  dpaUrl: string;
  status: "active" | "planned";
  lastReviewed: string;
};

export const subprocessors: Subprocessor[] = [
  { name: "Cloudflare", purpose: "Website delivery, edge security, Workers compute, and OpenNext incremental cache in R2", service: "Workers and R2", dataCategories: "Web requests, technical identifiers, and cached application content", role: "Infrastructure service provider", processingLocation: "Workers run on a global network; the R2 cache bucket reports WNAM (Western North America) as a location hint, not a jurisdictional guarantee.", privacyUrl: "https://www.cloudflare.com/privacypolicy/", dpaUrl: "https://www.cloudflare.com/cloudflare-customer-dpa/", status: "active", lastReviewed: "2026-09-27" },
  { name: "Supabase", purpose: "Account authentication and tenant-scoped application database", service: "Auth and Postgres", dataCategories: "Account, workspace, worker, tool, location, and transaction records", role: "Authentication and database service provider", processingLocation: "The project's primary region is us-west-1 (Northern California, US); other provider processing and transfer terms still require review.", privacyUrl: "https://supabase.com/privacy", dpaUrl: "https://supabase.com/legal/customer-resources/data-processing-addendum", status: "active", lastReviewed: "2026-09-27" },
  { name: "Resend", purpose: "Transactional account confirmation and password-recovery email through Supabase SMTP", service: "Transactional email", dataCategories: "Recipient address and authentication email content", role: "Transactional email service provider", processingLocation: "Resend states its primary processing operations are in the United States; its subprocessor locations and applicable transfer terms require review.", privacyUrl: "https://resend.com/legal/privacy-policy", dpaUrl: "https://resend.com/legal/dpa", status: "active", lastReviewed: "2026-09-27" },
];
