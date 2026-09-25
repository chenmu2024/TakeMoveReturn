import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";
import { InlineCta, MarketingFooter, MarketingHeader, ProductWorkspace } from "../../components/marketing";
import { HelpCenter } from "../../components/help-center";
import { SeoPageSchema } from "../../components/seo-schema";
import { siteConfig } from "../../config/site";
import { legalDocuments } from "../../data/legal-documents";
import { plannedProviders, subprocessors } from "../../data/subprocessors";
import { helpArticleBySlug, helpContentUpdatedAt } from "../../data/help-articles";
import { seoPageByPath } from "../../data/seo-keywords";

const pages: Record<string, { title: string; description: string }> = {
  help: { title: "Help Center", description: "Guidance for getting started, QR labels, tool tracking, workers, locations, imports, and account settings." },
  "help/contact": { title: "Contact Support", description: "Get help with your TakeMoveReturn workspace." },
  privacy: { title: "Privacy Policy Draft", description: "A plain-language privacy policy draft for TakeMoveReturn. Legal review is required before production publication." },
  terms: { title: "Terms of Service Draft", description: "A plain-language terms of service draft for TakeMoveReturn. Legal review is required before production publication." },
  dpa: { title: "Data Processing Addendum", description: "Draft data processing addendum. Legal review is required before production publication." },
  subprocessors: { title: "Subprocessors", description: "Draft subprocessor list. Legal review is required before production publication." },
  "business-information": { title: "Business Information Draft", description: "Operator details pending verification before commercial production." },
};

const detailCopy = [
  "Use QR labels and a simple browser workflow to keep the record current at the point of handoff.",
  "See the current holder, current location, condition, and a readable movement history in one place.",
  "Move beyond paper lists and spreadsheets without adding expensive tracking hardware or a complex enterprise system.",
  "Keep the product focused on reusable construction tools so crews can understand the next action immediately.",
  "Start with the tool list you already have, then add consistent records as work moves between the shop and the field.",
];

const defaultRelatedPaths = ["/features", "/pricing", "/construction-equipment-tracking-software"];

const helpFaqs = [
  { question: "Does TakeMoveReturn require a native app?", answer: "The field workflow is designed for a phone browser. A native app is not required for the QR-based product direction." },
  { question: "Does it provide GPS or live fleet tracking?", answer: "No. TakeMoveReturn records authenticated custody and location events for reusable tools; it is not a GPS, telematics, or fleet platform." },
  { question: "What belongs in a tool record?", answer: "A reusable tool or piece of equipment, its QR label, current holder, location, condition, and movement history. Consumable materials belong in a separate inventory process." },
  { question: "How should I prepare an import?", answer: "Start with one stable identifier per reusable tool, a clear name, and any current holder or location notes. Production import will validate rows before creating records." },
  { question: "What happens before the secure services are connected?", answer: "The public preview remains read-only. It does not submit credentials, create company records, or show made-up tool activity." },
  { question: "Is the support channel live?", answer: "Yes. The published support address receives mail. Please do not include passwords or worker PINs." },
];

const helpSetupSteps = [
  { number: "01", title: "List the tools that move", text: "Start with reusable tools and equipment that your crew shares between people, trucks, the shop, and job sites." },
  { number: "02", title: "Label the handoff point", text: "Place a QR label where a worker can scan it quickly without opening a desktop spreadsheet." },
  { number: "03", title: "Record the next move", text: "Use TAKE, MOVE, or RETURN with the current holder, location, condition, and a durable history." },
];


function relatedLabel(path: string) {
  const value = path.replace(/^\//, "").replaceAll("/", " · ").replaceAll("-", " ");
  return value.replace(/(^| · )(\w)/g, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
}

function LegalDocument({ kind }: { kind: "privacy" | "terms" | "dpa" }) {
  const document = legalDocuments[kind];
  const contactEmail = kind === "privacy" ? siteConfig.privacyEmail : siteConfig.supportEmail;
  return <section className="legal-document">
    <header className="legal-document-header"><div><p className="eyebrow">{document.eyebrow}</p><h2>{document.title}</h2><p>{document.summary}</p></div><span className="legal-status">Review required</span></header>
    <div className="legal-document-meta"><span>Effective date: {siteConfig.legal.effectiveDate ?? "not set"}</span><span>Last updated: {siteConfig.legal.lastUpdated}</span><span>Version: working draft</span></div>
    <div className="legal-callout"><strong>Important:</strong> This page is a planning draft, not legal advice and not an operative agreement or privacy notice. Confirm the operator, processing terms and final obligations before commercial launch.</div>
    <div className="legal-sections">{document.sections.map((section) => <section key={section.title}><h3>{section.title}</h3><p>{section.text}</p>{section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}</section>)}</div>
    <div className="legal-contact"><p className="eyebrow">CONTACT</p><h3>Use a verified channel for legal questions.</h3>{contactEmail ? <a className="button" href={`mailto:${contactEmail}`}>Email {kind === "privacy" ? "privacy" : "support"} <IconArrowRight size={18} aria-hidden="true" /></a> : <div className="contact-note"><strong>{kind === "privacy" ? "Privacy contact" : "Support contact"} is not available yet.</strong><p>A verified contact address will appear here when the service is ready for requests.</p></div>}</div>
    <nav className="legal-related" aria-label="Legal and help pages"><Link href="/help">Help Center <IconArrowRight size={16} aria-hidden="true" /></Link><Link href="/privacy">Privacy <IconArrowRight size={16} aria-hidden="true" /></Link><Link href="/terms">Terms <IconArrowRight size={16} aria-hidden="true" /></Link><Link href="/dpa">DPA <IconArrowRight size={16} aria-hidden="true" /></Link><Link href="/subprocessors">Subprocessors <IconArrowRight size={16} aria-hidden="true" /></Link></nav>
  </section>;
}

function SubprocessorsPage() {
  return <section className="legal-document"><header className="legal-document-header"><div><p className="eyebrow">PROVIDER REGISTER — DRAFT</p><h2>Subprocessors</h2><p>These providers are used by the current service. Processing locations and contract terms require verification before commercial production.</p></div><span className="legal-status">Review required</span></header><div className="legal-document-meta"><span>Last updated: {siteConfig.legal.lastUpdated}</span><span>Effective date: not set</span></div><div className="legal-sections">{subprocessors.map((provider) => <section key={provider.name}><h3>{provider.name} · {provider.status}</h3><p><strong>Purpose:</strong> {provider.purpose}</p><p><strong>Service:</strong> {provider.service}</p><p><strong>Data:</strong> {provider.dataCategories}</p><p><strong>Location:</strong> {provider.processingLocation}</p><p><strong>Reviewed:</strong> {provider.lastReviewed}</p><p><a href={provider.privacyUrl}>Provider privacy notice</a> · <a href={provider.dpaUrl}>Provider DPA</a></p></section>)}<section><h3>Not active</h3><p>{plannedProviders.join("; ")}. These are not active subprocessors and will be reassessed before activation.</p></section><section><h3>Changes</h3><p>This register may change as infrastructure changes. There is no implemented automatic subprocessor email-notice mechanism. Contact {siteConfig.legal.privacyEmail} with questions.</p></section></div></section>;
}

function BusinessInformationPage() {
  const legal = siteConfig.legal;
  const entries = [["Brand", legal.brandName], ["Operator type", "Individual operator (not a registered company claim)"], ["Legal operator name", legal.legalOperatorName], ["Registered business name", legal.registeredBusinessName], ["Registration number", legal.registrationNumber], ["Jurisdiction", legal.jurisdiction], ["Registered address", legal.registeredAddress], ["Business address", legal.businessAddress], ["Support", legal.supportEmail], ["Privacy", legal.privacyEmail]];
  return <section className="legal-document"><header className="legal-document-header"><div><p className="eyebrow">BUSINESS INFORMATION — DRAFT</p><h2>Business Information</h2><p>TakeMoveReturn is a product brand. The individual operator's verified legal identity and address are pending; no company registration is implied.</p></div><span className="legal-status">Review required</span></header><div className="legal-document-meta"><span>Last updated: {legal.lastUpdated}</span><span>Effective date: not set</span></div><div className="legal-sections">{entries.map(([label, value]) => <section key={label}><h3>{label}</h3><p>{value ?? "LEGAL INFORMATION PENDING"}</p></section>)}</div></section>;
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const key = (await params).slug.join("/");
  const path = "/" + key;
  const seoPage = seoPageByPath.get(path);
  const helpArticle = key.startsWith("help/") ? helpArticleBySlug.get(key.slice(5)) : undefined;
  const page = seoPage ?? pages[key] ?? (helpArticle ? { title: `${helpArticle.title} | TakeMoveReturn Help`, description: helpArticle.summary } : undefined);
  if (!page) notFound();

  const title = seoPage?.h1 ?? helpArticle?.title ?? page.title;
  const eyebrow = helpArticle ? helpArticle.category.toUpperCase() : seoPage?.pageType === "blog" || seoPage?.pageType === "guide"
    ? "PRACTICAL GUIDE"
    : seoPage?.pageType === "industry"
      ? "INDUSTRY PLAYBOOK"
      : seoPage?.pageType === "best"
        ? "COMPARISON GUIDE"
        : "CONSTRUCTION TOOL TRACKING";
  const relatedPaths = seoPage?.relatedPaths?.length ? seoPage.relatedPaths : defaultRelatedPaths;
  const sectionCopy = seoPage
    ? [seoPage.pain, seoPage.scenario, seoPage.comparison, seoPage.audience].filter((value): value is string => Boolean(value))
    : [];

  return (
    <main className="marketing-page">
      {seoPage && <SeoPageSchema page={seoPage} path={path} />}
      <MarketingHeader />
      <article className="content-page">
        <header className="content-hero">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{page.description}</p>
          {seoPage && <Link className="button" href="/signup">Start free <IconArrowRight size={18} aria-hidden="true" /></Link>}
        </header>

        {seoPage ? (
          <>
            <section className="direct-answer">
              <h2>A practical tool-tracking workflow for construction crews.</h2>
              <p>TakeMoveReturn gives small crews a simple QR-based way to record where reusable tools are, who has them, and what happened next.</p>
              <ul>
                <li><IconCheck size={18} aria-hidden="true" />No GPS or expensive hardware required</li>
                <li><IconCheck size={18} aria-hidden="true" />Works from a phone browser</li>
                <li><IconCheck size={18} aria-hidden="true" />Built around TAKE, MOVE, and RETURN</li>
              </ul>
            </section>

            <section className="content-product">
              <div><p className="eyebrow">PRODUCT PREVIEW</p><h2>See the record before you search for the tool.</h2><p>Keep the details field teams need together, from the tool list to the next handoff.</p></div>
              <ProductWorkspace compact />
            </section>

            <section className="content-proof" aria-labelledby="content-proof-title">
              <article><p className="eyebrow">FIELD REALITY</p><h2 id="content-proof-title">Built for the problem behind the search.</h2><p>{seoPage.pain ?? "Tool records become difficult to trust when handoffs happen faster than the spreadsheet can be updated."}</p></article>
              <article><p className="eyebrow">CONSTRUCTION SCENARIO</p><h2>Follow the next handoff.</h2><p>{seoPage.scenario ?? "A tool moves between a worker, a truck, and a job site, and the next person needs a clear record."}</p></article>
              {seoPage.audience && <article><p className="eyebrow">WHO IT SERVES</p><h2>Keep the workflow in scope.</h2><p>{seoPage.audience}</p></article>}
              {seoPage.comparison && <article><p className="eyebrow">BOUNDARY CHECK</p><h2>Use the right tool for the job.</h2><p>{seoPage.comparison}</p></article>}
            </section>

            {seoPage.workflow && <section className="workflow-proof" aria-labelledby="workflow-proof-title"><p className="eyebrow">WORKFLOW</p><h2 id="workflow-proof-title">A short path from tool list to current record.</h2><ol className="workflow-list">{seoPage.workflow.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol></section>}

            <div className="content-sections">{seoPage.headings.map((heading, index) => <section key={heading}><h2>{heading}</h2><p>{sectionCopy[index] ?? detailCopy[index] ?? detailCopy[0]}</p></section>)}</div>

            {seoPage.faqs && <section className="faq-block" aria-labelledby="faq-title"><p className="eyebrow">FAQ</p><h2 id="faq-title">Questions crews ask before they switch.</h2><div className="faq-list">{seoPage.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>}

            <nav className="related-links" aria-label="Related TakeMoveReturn pages"><p className="eyebrow">KEEP EXPLORING</p><h2>Go deeper on the workflow.</h2><div>{relatedPaths.map((relatedPath) => <Link key={relatedPath} href={relatedPath}>{relatedLabel(relatedPath)} <IconArrowRight size={16} aria-hidden="true" /></Link>)}</div></nav>
            <InlineCta title="Give every tool a clearer next move." />
          </>
        ) : key === "help" ? (
          <>
            <section className="help-intro"><p className="eyebrow">GETTING STARTED</p><h2>Find the right next step for your crew.</h2><p>Use these guides to understand the product workflow, the data it is designed to hold, and the decisions that still need production configuration.</p></section>
            <section className="help-steps" aria-labelledby="help-steps-title"><div className="help-section-heading"><p className="eyebrow">FIRST SETUP</p><h2 id="help-steps-title">A useful first pass takes three steps.</h2><p>Keep the first workspace small enough to test at a real handoff.</p></div><div className="help-step-grid">{helpSetupSteps.map((step) => <article key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></section>
            <HelpCenter />
            <section className="help-faq" aria-labelledby="help-faq-title"><p className="eyebrow">COMMON QUESTIONS</p><h2 id="help-faq-title">What the product does — and does not do.</h2><div className="faq-list">{helpFaqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>
            <section className="help-status-grid" aria-label="Help and configuration status"><article className="help-status-card"><p className="eyebrow">PREVIEW STATUS</p><h2>Review the workflow before public signup opens.</h2><p>Support and transactional account email are working. Company, tool, location and worker records have been tested locally; public registration remains gated while field workflows and security checks continue. Imports and billing are not live.</p><Link className="text-link" href="/help/contact">Contact support <IconArrowRight size={16} aria-hidden="true" /></Link></article><article className="help-status-card help-status-card-muted"><p className="eyebrow">DATA BOUNDARY</p><h2>No sample activity is shown.</h2><p>Empty states are intentional: they keep the preview honest while protecting company-scoped data from being mixed with marketing content.</p><Link className="text-link" href="/privacy">Review privacy draft <IconArrowRight size={16} aria-hidden="true" /></Link></article></section>
            <section className="help-contact-prompt"><div><p className="eyebrow">NEED MORE HELP?</p><h2>Contact the support team.</h2><p>Send product questions to {siteConfig.supportEmail}.</p></div><Link className="button" href="/help/contact">Contact Support <IconArrowRight size={18} aria-hidden="true" /></Link></section>
          </>
        ) : key === "help/contact" ? (
          <section className="help-contact"><p className="eyebrow">SUPPORT</p><h2>Contact Support</h2><p>For product questions or help with your workspace, email {siteConfig.supportEmail}. Please do not include passwords or worker PINs.</p><a className="button" href={`mailto:${siteConfig.supportEmail}`}>Email support <IconArrowRight size={18} aria-hidden="true" /></a><Link className="text-link" href="/help">Back to Help Center <IconArrowRight size={16} aria-hidden="true" /></Link></section>
        ) : helpArticle ? (
          <article className="help-article"><nav aria-label="Breadcrumb"><Link href="/help">Help Center</Link><span aria-hidden="true">/</span><span>{helpArticle.category}</span></nav><p className="help-article-updated">Updated {helpContentUpdatedAt}</p><h2>What to do</h2><p className="help-article-summary">{helpArticle.summary}</p><ol>{helpArticle.steps.map((step) => <li key={step}>{step}</li>)}</ol><div className="help-article-note"><strong>Current status</strong><p>{helpArticle.note}</p></div><div className="help-article-links"><Link href="/help">All help articles <IconArrowRight size={16} aria-hidden="true" /></Link><Link href="/help/contact">Contact Support <IconArrowRight size={16} aria-hidden="true" /></Link></div></article>
        ) : key === "privacy" || key === "terms" || key === "dpa" ? (
          <LegalDocument kind={key} />
        ) : key === "subprocessors" ? (
          <SubprocessorsPage />
        ) : key === "business-information" ? (
          <BusinessInformationPage />
        ) : (
          <section className="plain-content"><h2>Built around TAKE, MOVE, and RETURN</h2><p>TakeMoveReturn helps small construction crews keep tool records clear, practical, and easy to use in the field.</p></section>
        )}
        <MarketingFooter />
      </article>
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const key = (await params).slug.join("/");
  const path = "/" + key;
  const seoPage = seoPageByPath.get(path);
  const helpArticle = key.startsWith("help/") ? helpArticleBySlug.get(key.slice(5)) : undefined;
  const page = seoPage ?? pages[key] ?? (helpArticle ? { title: `${helpArticle.title} | TakeMoveReturn Help`, description: helpArticle.summary } : undefined);
  if (!page) return {};
  const canonical = seoPage?.canonical ?? path;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical },
    openGraph: { title: page.title, description: page.description, url: new URL(canonical, siteConfig.siteUrl).toString(), siteName: siteConfig.name, type: seoPage?.pageType === "blog" || seoPage?.pageType === "guide" || seoPage?.pageType === "best" ? "article" : "website" },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
    robots: (seoPage && (seoPage.status !== "indexable" || seoPage.needsUSVerification)) || ["privacy", "terms", "dpa", "subprocessors", "business-information"].includes(key) ? { index: false, follow: false } : { index: true, follow: true },
  };
}
