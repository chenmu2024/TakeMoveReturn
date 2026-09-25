import type { SeoPage } from "../data/seo-keywords";
import { siteConfig } from "../config/site";

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function SchemaScript({ value, id }: { value: Record<string, unknown>; id: string }) {
  return <script id={id} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(value) }} />;
}

export function HomeSeoSchema() {
  const url = siteConfig.siteUrl;
  return <>
    <SchemaScript id="brand-schema" value={{ "@context": "https://schema.org", "@type": "Brand", name: siteConfig.name, url }} />
    <SchemaScript id="website-schema" value={{ "@context": "https://schema.org", "@type": "WebSite", name: siteConfig.name, url, description: "QR-based construction tool tracking for small crews." }} />
    <SchemaScript id="software-schema" value={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: siteConfig.name, applicationCategory: "BusinessApplication", operatingSystem: "Web", url, description: "QR-based construction tool tracking that shows who has every tool, where it is, and what happened to it." }} />
  </>;
}

export function SeoPageSchema({ page, path }: { page: SeoPage; path: string }) {
  const url = new URL(path, siteConfig.siteUrl).toString();
  const label = path.split("/").filter(Boolean).join(" / ") || "Home";
  const schemas: Record<string, unknown>[] = [{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: siteConfig.name, item: siteConfig.siteUrl },
      { "@type": "ListItem", position: 2, name: label, item: url },
    ],
  }];

  if (page.pageType === "money" || page.pageType === "industry") {
    schemas.push({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: siteConfig.name, applicationCategory: "BusinessApplication", operatingSystem: "Web", url, description: page.description });
  } else {
    schemas.push({ "@context": "https://schema.org", "@type": "Article", headline: page.h1, description: page.description, url, dateModified: page.dateModified });
  }

  if (page.faqs?.length) {
    schemas.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: page.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) });
  }

  return <>{schemas.map((schema, index) => <SchemaScript key={index} id={`seo-schema-${index}`} value={schema} />)}</>;
}
