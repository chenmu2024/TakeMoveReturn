# SEO / generative-search verification

Updated 2026-10-07. Code preparation does not establish indexing, search traffic or AI citations.

## What this release changes

- Product previews use three static WebP sources (480/768/1024px), with the actual 2:3 aspect ratio. The largest is 97,338 bytes instead of the original 1,403,214-byte PNG; compact previews load lazily. The illustration remains labeled.
- Three core commercial pages have task-specific responsibility, count and handoff tables. The inventory article leads with a six-step process, a reconciliation example and the downloadable register before its product preview.
- Worker access, handoff and import help now explain prerequisites, failure handling and next steps. Related public pages link directly to these instructions, maintenance/damage help and billing help.
- The CSV uses supported import columns and is tested with the real import-preview parser. Fictional rows still need replacement and company-level validation.
- About identifies the individual operator at a stable anchor, provides Person/AboutPage data and appears in the sitemap. Website, product and editorial publisher references resolve to that operator.
- Only the four revised SEO articles/pages and three revised help articles receive new editorial dates. Other keyword-page dates and all 20 pending index gates stay unchanged.

- Existing 29 non-home SEO pages gain distinct practical explanations, three-step checklists and a matching FAQ. No new keyword-target URLs or invented competitor measurements.
- Pricing and product JSON-LD use `src/config/plans.ts` for the Free offer and six paid billing intervals. No review/rating data is fabricated. Structured data does not guarantee a rich result.
- Article pages disclose AI-assisted editorial content and identify the actual individual operator as publisher, not an invented company or professional reviewer. Named authors require verified authorship before addition.
- Sitemap modification dates reflect this editorial release rather than every build. The home date stays unchanged.
- A branded 1200×630 PNG sharing image is generated through Next.js. The existing interface mockup is explicitly illustrative, not a current customer screenshot.
- A fictional CSV planning example is available without exposing customer or worker data. It is not a substitute for import validation.
- No tracking script, cookies, payment change or crawler security bypass is introduced.
- Removed an unmeasured five-second scan claim from the home proof strip. The connected Search Console account does not expose this domain; that does not establish whether another owner has verified it. Indexing, traffic, verified crawler access and real-user performance remain unverified.

## Indexing gate

10 keyword routes remain eligible for indexing. 20 retain `noindex_pending_verification` and stay outside the sitemap. Preserve the master keyword clusters.

Before releasing each pending page, record real Semrush US volume/KD/CPC (or null when unavailable), a dated Google US results review, search-intent fit, content differentiation and any competitor-claim review. Global metrics are not US metrics. Content improvements alone do not satisfy this gate. Update status only after documented evidence and re-run the audits.

## Google and Bing ownership and measurement

1. Open the existing Google Search Console / Bing Webmaster Tools property, or verify ownership of `takemovereturn.com`. Domain verification by DNS is preferred when an authorized owner can do it. Optional URL-prefix meta verification is supported by `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION`; use only the public verification value, never an access token.
2. Submit `https://takemovereturn.com/sitemap.xml`. Inspect the home, Pricing and several eligible keyword URLs. Record the canonical chosen by the engine, crawl status and exclusion reason.
3. Track monthly impressions, clicks, queries, landing pages and conversions. Record the actual reporting window; do not create estimated traffic as if measured.
4. Keep pending noindex pages excluded. A successful URL fetch or schema validation is not an indexing confirmation.
5. Review Google's separate Search generative AI control in Search Console when the property is available. Record the chosen policy and inherited value; do not change it automatically. Review the generative AI performance report when sufficient data is available, separately from ordinary search traffic.

## Search crawlers and AI referrals

- Review Cloudflare Security Events / crawler controls for actual verified Googlebot, Bingbot and OAI-SearchBot requests. Record timestamp, URL, action and status with no authentication tokens or personal data.
- An HTTP request using a copied bot User-Agent does not prove verified-bot access. Do not disable WAF, authentication or private-route restrictions to improve discovery.
- OAI-SearchBot search access and GPTBot training access are different decisions. This release preserves the current robots policy; changing training preferences needs an explicit owner choice.
- Review existing privacy-compatible server/analytics reports for referrals from AI services. Referrer absence is not proof that no AI traffic occurred. Any new analytics deployment needs provider/privacy review first.

## Performance and content evidence

- Inspect mobile Core Web Vitals in Search Console / PageSpeed Insights: LCP, INP and CLS, including field-data sample limitations. Local builds cannot certify real-user performance.
- Verify the first image and generated sharing image, responsive content at 390/768/1024/1280/1440/1920px, and keyboard focus. Keep article copy server-rendered.
- Add current screenshots only from an authorized, sanitized test workspace. Do not publish worker PINs, private QR links, customer names or records. Real customer cases require consent and evidence; mockups must remain labeled.
- Review Money/Industry content every 90 days, guides every 180 days, and comparison material every 30–60 days. Change `dateModified` only when content actually changes.

## Automated acceptance

Run typecheck, unit tests, `seo:audit`, production build and `runtime:smoke`. The latter includes all 30 keyword pages and 15 supporting pages. It checks unique titles/descriptions, canonical URLs, one H1, share images, exact index/sitemap agreement, public links and inbound links, offer consistency, visible FAQ text, operator identity and static WebP byte budgets.

After deployment, run `npm run seo:runtime -- https://takemovereturn.com --baseline seo-production.json`. Deployment and monthly review workflows run this check and save the public snapshot as a GitHub Actions artifact for 90 days. It records the deployed commit, canonical/index state, public link graph and image bytes for comparison with later runs. A failed check requires investigation; do not update the expected gates simply to make it pass. This is a public HTTP check only, not authenticated workspace testing, real crawler verification or performance certification.

## Primary references

- Google: https://developers.google.com/search/docs/appearance/ai-features
- Google: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google Search generative AI control: https://support.google.com/webmasters/answer/16908024
- Google generative AI performance reporting: https://support.google.com/webmasters/answer/16984139
- OpenAI crawler documentation: https://platform.openai.com/docs/bots

Ordinary accessible, helpful content remains the foundation. Do not add special GEO markup or promise AI citations, rankings or rich results.
