export type Subprocessor = {
  name: string;
  purpose: string;
  service: string;
  dataCategories: string;
  role: string;
  processingLocation: string;
  privacyUrl: string;
  legalUrl: string;
  status: "active" | "planned";
  lastReviewed: string;
};

export const subprocessors: Subprocessor[] = [
  {
    name: "Cloudflare",
    purpose: "Website delivery, edge security, Workers compute, import job delivery through Queues, OpenNext cache and private customer attachments in separate R2 buckets",
    service: "Workers, Queues and R2",
    dataCategories: "Web requests, technical identifiers, import job and batch identifiers, cached application content, and customer-uploaded tool, damage or maintenance files",
    role: "Infrastructure service provider",
    processingLocation: "Workers run on a global network; the R2 cache and customer-file buckets report WNAM (Western North America) as a location hint, not a jurisdictional guarantee.",
    privacyUrl: "https://www.cloudflare.com/privacypolicy/",
    legalUrl: "https://www.cloudflare.com/cloudflare-customer-dpa/",
    status: "active",
    lastReviewed: "2026-09-30",
  },
  {
    name: "Supabase",
    purpose: "Account authentication and tenant-scoped application database",
    service: "Auth and Postgres",
    dataCategories: "Account, workspace, worker, tool, location, transaction, customer-file metadata, import, privacy-request, and billing-status records",
    role: "Authentication and database service provider",
    processingLocation: "The project's primary region is us-west-1 (Northern California, US); other provider processing and transfer terms still require review.",
    privacyUrl: "https://supabase.com/privacy",
    legalUrl: "https://supabase.com/legal/customer-resources/data-processing-addendum",
    status: "active",
    lastReviewed: "2026-09-29",
  },
  {
    name: "Resend",
    purpose: "Transactional account confirmation and password-recovery email through Supabase SMTP",
    service: "Transactional email",
    dataCategories: "Recipient address and authentication email content",
    role: "Transactional email service provider",
    processingLocation: "Resend states its primary processing operations are in the United States; its subprocessor locations and applicable transfer terms require review.",
    privacyUrl: "https://resend.com/legal/privacy-policy",
    legalUrl: "https://resend.com/legal/dpa",
    status: "active",
    lastReviewed: "2026-09-29",
  },
  {
    name: "Waffo",
    purpose: "Merchant of Record checkout, payment processing, subscription status, tax, receipts, refunds, and payment-related customer support",
    service: "Waffo Pancake Merchant of Record",
    dataCategories: "Buyer email and checkout details supplied for the purchase, order and subscription identifiers, billing period/status, payment-related records, and other information Waffo processes for its Merchant of Record responsibilities",
    role: "Merchant of Record and independent controller for payment, tax, fraud, receipt, refund, and related transaction data; TakeMoveReturn receives limited order/subscription metadata needed to provide plan access",
    processingLocation: "Waffo.com Limited is incorporated in Hong Kong. Waffo's privacy materials describe its own processing and service-provider arrangements; this register does not claim all payment data remains in Hong Kong.",
    privacyUrl: "https://www.waffo.ai/en/privacy",
    legalUrl: "https://www.waffo.ai/en/developer-terms",
    status: "active",
    lastReviewed: "2026-09-29",
  },
];
