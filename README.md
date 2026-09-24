# TakeMoveReturn

TakeMoveReturn is a QR-based construction tool tracking SaaS for small crews.

## Run locally

Run the Next.js preview with `npm run dev`, or build the Cloudflare Worker bundle with `npm run cf:build`.

## Production status

The public marketing, SEO, auth-entry, and workspace interface are implemented. Production records and account actions remain gated until Supabase authentication/RLS, Stripe billing, transactional email, R2/Queue services, server-side authorization, monitoring, and legal review are configured. The interface intentionally shows an honest connection state instead of sample operational data.
