import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";
import { InlineCta, MarketingFooter, MarketingHeader, ProductWorkspace } from "../../components/marketing";
import { HelpCenter } from "../../components/help-center";
import { SeoPageSchema } from "../../components/seo-schema";
import { siteConfig } from "../../config/site";
import { legalDocuments } from "../../data/legal-documents";
import { subprocessors } from "../../data/subprocessors";
import { helpArticleBySlug, helpContentUpdatedAt } from "../../data/help-articles";
import { seoPageByPath } from "../../data/seo-keywords";
import { practicalContent } from "../../data/seo-practical-content";

const pages: Record<string, { title: string; description: string }> = {
  help: { title: "Help Center", description: "Guidance for getting started, QR labels, tool tracking, workers, locations, imports, and account settings." },
  "help/contact": { title: "Contact Support", description: "Get help with your TakeMoveReturn workspace." },
  privacy: { title: "Privacy Policy", description: "How TakeMoveReturn handles account and workspace information." },
  terms: { title: "Terms of Service", description: "TakeMoveReturn product terms and service boundaries." },
  dpa: { title: "Data Processing Addendum", description: "Customer-data processing framework for TakeMoveReturn." },
  subprocessors: { title: "Providers and Subprocessors", description: "Active infrastructure, email, data and payment providers used to deliver TakeMoveReturn." },
  "business-information": { title: "Business Information", description: "Operator and contact details for TakeMoveReturn." },
  about: { title: "About TakeMoveReturn", description: "A practical construction tool tracking service operated from China." },
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
  { question: "How should I prepare an import?", answer: "Start with one stable identifier per reusable tool, a clear name, and any current holder or location notes. The import flow validates mapped rows, company duplicates and plan capacity before creating records in background batches." },
  { question: "Can my crew use the workspace now?", answer: "Yes. You can register, create a company workspace, add tools and locations, record authorized QR handoffs, and import a reviewed CSV or XLSX tool list in background batches." },
  { question: "Is the support channel live?", answer: "Yes. The published support address receives mail. Please do not include passwords or worker PINs." },
];

const helpSetupSteps = [
  { number: "01", title: "List the tools that move", text: "Start with reusable tools and equipment that your crew shares between people, trucks, the shop, and job sites." },
  { number: "02", title: "Label the handoff point", text: "Place a QR label where a worker can scan it quickly without opening a desktop spreadsheet." },
  { number: "03", title: "Record the next move", text: "Use TAKE, MOVE, or RETURN to keep the holder, location, and movement history current. Report damage separately." },
];


function relatedLabel(path: string) {
  const value = path.replace(/^\//, "").replaceAll("/", " · ").replaceAll("-", " ");
  return value.replace(/(^| · )(\w)/g, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
}

function LegalDocument({ kind }: { kind: "privacy" | "terms" | "dpa" }) {
  const document = legalDocuments[kind];
  const contactEmail = kind === "privacy" ? siteConfig.privacyEmail : siteConfig.supportEmail;
  return <section className="legal-document">
    <header className="legal-document-header"><div><p className="eyebrow">{document.eyebrow}</p><h2>{document.title}</h2><p>{document.summary}</p></div></header>
    <div className="legal-document-meta"><span>Last updated: {siteConfig.legal.lastUpdated}</span>{siteConfig.legal.effectiveDate && <span>Effective date: {siteConfig.legal.effectiveDate}</span>}</div>
    <div className="legal-sections">{document.sections.map((section) => <section key={section.title}><h3>{section.title}</h3><p>{section.text}</p>{section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}</section>)}</div>
    <div className="legal-contact"><p className="eyebrow">CONTACT</p><h3>Questions about this page?</h3><a className="button" href={`mailto:${contactEmail}`}>Email {kind === "privacy" ? "privacy" : "support"} <IconArrowRight size={18} aria-hidden="true" /></a></div>
    <nav className="legal-related" aria-label="Legal and help pages"><Link href="/help">Help Center <IconArrowRight size={16} aria-hidden="true" /></Link><Link href="/privacy">Privacy <IconArrowRight size={16} aria-hidden="true" /></Link><Link href="/terms">Terms <IconArrowRight size={16} aria-hidden="true" /></Link><Link href="/dpa">DPA <IconArrowRight size={16} aria-hidden="true" /></Link><Link href="/subprocessors">Subprocessors <IconArrowRight size={16} aria-hidden="true" /></Link></nav>
  </section>;
}

function SubprocessorsPage() {
  return <section className="legal-document"><header className="legal-document-header"><div><p className="eyebrow">PROVIDER REGISTER</p><h2>Providers and subprocessors</h2><p>Services currently used to deliver TakeMoveReturn, including infrastructure subprocessors and Waffo as Merchant of Record. Future services are not counted as active.</p></div></header><div className="legal-document-meta"><span>Last updated: {siteConfig.legal.lastUpdated}</span></div><div className="legal-sections">{subprocessors.filter((provider) => provider.status === "active").map((provider) => <section key={provider.name}><h3>{provider.name} · active</h3><p><strong>Purpose:</strong> {provider.purpose}</p><p><strong>Service:</strong> {provider.service}</p><p><strong>Role:</strong> {provider.role}</p><p><strong>Data:</strong> {provider.dataCategories}</p><p><strong>Location:</strong> {provider.processingLocation}</p><p><strong>Reviewed:</strong> {provider.lastReviewed}</p><p><a href={provider.privacyUrl}>Provider privacy notice</a> · <a href={provider.legalUrl}>Provider legal terms / DPA</a></p></section>)}<section><h3>Planned services</h3><p>Analytics and error-monitoring providers are not active in the inspected production setup. Cloudflare Queues is active for background tool-import batches, and separate private R2 storage is used for customer attachments. Turnstile is not currently active.</p></section><section><h3>Changes and questions</h3><p>We update this register when providers change. An automatic advance-email notice service is not currently offered. Contact {siteConfig.legal.privacyEmail} with questions.</p></section></div></section>;
}

function BusinessInformationPage() {
  const legal = siteConfig.legal;
  const entries = [["Operating name", legal.operatingName], ["Operator", `${legal.legalOperatorName} (individual)`], ["Operating country", legal.operatingCountry], ["Support", legal.supportEmail], ["Privacy", legal.privacyEmail]];
  return <section className="legal-document"><header className="legal-document-header"><div><p className="eyebrow">BUSINESS INFORMATION</p><h2>Business Information</h2><p>{legal.legalOperatorStatement} It is not presented as a registered corporation.</p></div></header><div className="legal-document-meta"><span>Last updated: {legal.lastUpdated}</span></div><div className="legal-sections">{entries.map(([label, value]) => <section key={label}><h3>{label}</h3><p>{value}</p></section>)}</div></section>;
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const key = (await params).slug.join("/");
  const path = "/" + key;
  const seoPage = seoPageByPath.get(path);
  const practical = practicalContent[path];
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
    ? (seoPage.sectionCopy?.length
      ? seoPage.sectionCopy
      : [seoPage.pain, seoPage.scenario, seoPage.comparison, seoPage.audience].filter((value): value is string => Boolean(value)))
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
          {seoPage && <p className="editorial-meta">TakeMoveReturn product guidance · AI-assisted content · Updated <time dateTime={seoPage.dateModified}>{seoPage.dateModified}</time>. Examples are illustrative, not customer testimonials.</p>}
          {seoPage && <Link className="button" href="/signup">Start free <IconArrowRight size={18} aria-hidden="true" /></Link>}
        </header>

        {seoPage ? (
          <>
            <section className="direct-answer">
              <h2>A practical tool-tracking workflow for construction crews.</h2>
              <p>{seoPage.directAnswer ?? "TakeMoveReturn gives small crews a simple QR-based way to record where reusable tools are, who has them, and what happened next."}</p>
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

            {practical && <section className="practical-content"><h2>{practical.heading}</h2><p>{practical.explanation}</p><h3>Put it into practice</h3><ol>{practical.checklist.map((item) => <li key={item}>{item}</li>)}</ol>{["/tool-inventory-software", "/blog/how-to-manage-construction-site-inventory", "/guides/how-to-keep-track-of-tools-and-equipment"].includes(path) && <p><a href="/resources/tool-register-example.csv" download>Download an illustrative tool register (CSV)</a>. This is a planning example, not a prevalidated import or a customer dataset. Review and map columns in <Link href="/help/import-export">the import workflow</Link>.</p>}<p>For product corrections, contact <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>. <Link href="/about">About the service and operator</Link>.</p></section>}

            {seoPage.faqs && <section className="faq-block" aria-labelledby="faq-title"><p className="eyebrow">FAQ</p><h2 id="faq-title">Questions crews ask before they switch.</h2><div className="faq-list">{seoPage.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>}

            <nav className="related-links" aria-label="Related TakeMoveReturn pages"><p className="eyebrow">KEEP EXPLORING</p><h2>Go deeper on the workflow.</h2><div>{relatedPaths.map((relatedPath) => <Link key={relatedPath} href={relatedPath}>{relatedLabel(relatedPath)} <IconArrowRight size={16} aria-hidden="true" /></Link>)}</div></nav>
            <InlineCta title="Give every tool a clearer next move." />
          </>
        ) : key === "help" ? (
          <>
            <section className="help-intro"><p className="eyebrow">GETTING STARTED</p><h2>Find the right next step for your crew.</h2><p>Use these guides to set up a workspace, track handoffs, and understand which features are available today.</p></section>
            <section className="help-steps" aria-labelledby="help-steps-title"><div className="help-section-heading"><p className="eyebrow">FIRST SETUP</p><h2 id="help-steps-title">A useful first pass takes three steps.</h2><p>Keep the first workspace small enough to test at a real handoff.</p></div><div className="help-step-grid">{helpSetupSteps.map((step) => <article key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></section>
            <HelpCenter />
            <section className="help-faq" aria-labelledby="help-faq-title"><p className="eyebrow">COMMON QUESTIONS</p><h2 id="help-faq-title">What the product does — and does not do.</h2><div className="faq-list">{helpFaqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>
            <section className="help-status-grid" aria-label="Help and configuration status"><article className="help-status-card"><p className="eyebrow">CURRENT AVAILABILITY</p><h2>Registration and field handoffs are open.</h2><p>Confirmed users can create a workspace, register tools, workers and locations, import a reviewed spreadsheet, and use an enrolled device for QR TAKE, MOVE and RETURN. {process.env.CUSTOMER_FILES_ENABLED === "true" ? "Private photo and maintenance attachment controls are available in enabled workspaces." : "File attachments are not enabled yet."} Automatic reminders are not available yet.</p><Link className="text-link" href="/help/contact">Contact support <IconArrowRight size={16} aria-hidden="true" /></Link></article><article className="help-status-card help-status-card-muted"><p className="eyebrow">DATA BOUNDARY</p><h2>Your records stay in your workspace.</h2><p>Public pages do not show company activity. Sign in to view your own tool records and handoff history.</p><Link className="text-link" href="/privacy">Read our Privacy Policy <IconArrowRight size={16} aria-hidden="true" /></Link></article></section>
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
        ) : key === "about" ? (
          <section className="legal-document"><div className="legal-sections"><section><h2>Made for small construction crews</h2><p>TakeMoveReturn helps teams record reusable tools as they move between people, warehouses, trucks and job sites. Company records are organized around TAKE, MOVE and RETURN, so the next crew can see the latest recorded holder, location and history.</p></section><section><h2>How it works</h2><p>Managers create tool, worker and location records; QR labels identify tools, and authorized users record handoffs. The record is only as current as the latest scan, user entry and system event. Registration, worker-attributed QR handoffs, and reviewed spreadsheet imports are available. Other capabilities may be added after verification.</p></section><section><h2>What it is not</h2><p>This is not live GPS tracking, theft prevention, insurance, safety certification, ERP or a substitute for a professional tool inspection.</p></section><section><h2>Who operates it</h2><p>{siteConfig.legal.legalOperatorStatement} The operating name is not presented as a registered company. For help email <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>; for privacy questions email <a href={`mailto:${siteConfig.privacyEmail}`}>{siteConfig.privacyEmail}</a>.</p></section></div></section>
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
    openGraph: { title: page.title, description: page.description, url: new URL(canonical, siteConfig.siteUrl).toString(), siteName: siteConfig.name, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "TakeMoveReturn QR construction tool tracking" }], type: seoPage?.pageType === "blog" || seoPage?.pageType === "guide" || seoPage?.pageType === "best" ? "article" : "website" },
    twitter: { card: "summary_large_image", title: page.title, description: page.description, images: ["/opengraph-image"] },
    robots: (seoPage && (seoPage.status !== "indexable" || seoPage.needsUSVerification)) || ["privacy", "terms", "dpa", "subprocessors", "business-information"].includes(key) ? { index: false, follow: false } : { index: true, follow: true },
  };
}
