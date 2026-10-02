# SEO / generative-search verification

Updated 2026-10-03. Code preparation does not establish indexing, search traffic or AI citations.

## What this release changes

- Existing 29 non-home SEO pages gain distinct practical explanations, three-step checklists and a matching FAQ. No new keyword-target URLs or invented competitor measurements.
- Pricing and product JSON-LD use `src/config/plans.ts` for the Free offer and six paid billing intervals. No review/rating data is fabricated. Structured data does not guarantee a rich result.
- Article pages disclose AI-assisted editorial content and identify the actual individual operator as publisher, not an invented company or professional reviewer. Named authors require verified authorship before addition.
- Sitemap modification dates reflect this editorial release rather than every build. The home date stays unchanged.
- A branded 1200×630 PNG sharing image is generated through Next.js. The existing interface mockup is explicitly illustrative, not a current customer screenshot.
- A fictional CSV planning example is available without exposing customer or worker data. It is not a substitute for import validation.
- No tracking script, cookies, payment change or crawler security bypass is introduced.
- Removed an unmeasured five-second scan claim from the home proof strip. The operator confirmed no Search Console/Bing evidence or Semrush US export is currently available; indexing/traffic/verified crawler and real-user performance checks remain unverified.

## Indexing gate

10 keyword routes remain eligible for indexing. 20 retain `noindex_pending_verification` and stay outside the sitemap. Preserve the master keyword clusters.

Before releasing each pending page, record real Semrush US volume/KD/CPC (or null when unavailable), a dated Google US results review, search-intent fit, content differentiation and any competitor-claim review. Global metrics are not US metrics. Content improvements alone do not satisfy this gate. Update status only after documented evidence and re-run the audits.

## Google and Bing ownership and measurement

1. Open the existing Google Search Console / Bing Webmaster Tools property, or verify ownership of `takemovereturn.com`. Domain verification by DNS is preferred when an authorized owner can do it. Optional URL-prefix meta verification is supported by `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION`; use only the public verification value, never an access token.
2. Submit `https://takemovereturn.com/sitemap.xml`. Inspect the home, Pricing and several eligible keyword URLs. Record the canonical chosen by the engine, crawl status and exclusion reason.
3. Track monthly impressions, clicks, queries, landing pages and conversions. Record the actual reporting window; do not create estimated traffic as if measured.
4. Keep pending noindex pages excluded. A successful URL fetch or schema validation is not an indexing confirmation.

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

Run typecheck, unit tests, `seo:audit`, production build and `runtime:smoke`. The latter includes all 30 keyword pages plus Pricing and checks canonical URLs, one H1, descriptions, share images, index/sitemap agreement, offer consistency, visible FAQ text and resources.

After deployment, run `npm run seo:runtime -- https://takemovereturn.com`. This is a public HTTP check only, not authenticated workspace testing, real crawler verification or performance certification.

## Primary references

- Google: https://developers.google.com/search/docs/appearance/ai-features
- Google: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- OpenAI crawler documentation: https://platform.openai.com/docs/bots

Ordinary accessible, helpful content remains the foundation. Do not add special GEO markup or promise AI citations, rankings or rich results.
