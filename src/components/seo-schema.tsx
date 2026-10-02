import type { SeoPage } from "../data/seo-keywords";
import { siteConfig } from "../config/site";
import { seoPageByPath } from "../data/seo-keywords";
import { faqSchema, pricingFaqs, softwareSchema } from "../lib/public-seo";

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function SchemaScript({ value, id }: { value: Record<string, unknown>; id: string }) {
  return <script id={id} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(value) }} />;
}

export function HomeSeoSchema() {
  const url = siteConfig.siteUrl;
  return <>
    <SchemaScript id="brand-schema" value={{ "@context": "https://schema.org", "@type": "Brand", "@id": `${url}/#brand`, name: siteConfig.name, url }} />
    <SchemaScript id="website-schema" value={{ "@context": "https://schema.org", "@type": "WebSite", "@id": `${url}/#website`, name: siteConfig.name, url, description: "QR-based construction tool tracking for small crews." }} />
    <SchemaScript id="software-schema" value={softwareSchema()} />
    <SchemaScript id="home-faq-schema" value={faqSchema(seoPageByPath.get("/")?.faqs ?? [])} />
  </>;
}

export function SeoPageSchema({ page, path }: { page: SeoPage; path: string }) {
  const url = new URL(path, siteConfig.siteUrl).toString();
  const label = page.h1;
  const schemas: Record<string, unknown>[] = [{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: siteConfig.name, item: siteConfig.siteUrl },
      { "@type": "ListItem", position: 2, name: label, item: url },
    ],
  }];

  if (page.pageType === "money" || page.pageType === "industry") {
    schemas.push(softwareSchema());
  } else {
    schemas.push({ "@context": "https://schema.org", "@type": "Article", "@id": `${url}#article`, headline: page.h1, description: page.description, url, mainEntityOfPage: url, inLanguage: "en", dateModified: page.dateModified, publisher: { "@type": "Person", "@id": `${siteConfig.siteUrl}/about#operator`, name: siteConfig.legal.legalOperatorName, url: `${siteConfig.siteUrl}/about` } });
  }

  if (page.faqs?.length) {
    schemas.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: page.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) });
  }

  return <>{schemas.map((schema, index) => <SchemaScript key={index} id={`seo-schema-${index}`} value={schema} />)}</>;
}

export function PricingSeoSchema() {
  return <><SchemaScript id="pricing-software-schema" value={softwareSchema()} /><SchemaScript id="pricing-faq-schema" value={faqSchema(pricingFaqs)} /></>;
}
