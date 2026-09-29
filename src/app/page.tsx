import Link from "next/link";
import { IconArrowRight, IconFileSpreadsheet, IconQrcode, IconScan, IconTool } from "@tabler/icons-react";
import { plans } from "../config/plans";
import { seoPageByPath } from "../data/seo-keywords";
import { InlineCta, MarketingFooter, MarketingHeader, ProductWorkspace, ProofStrip, WorkflowSteps } from "../components/marketing";
import { HomeSeoSchema } from "../components/seo-schema";

const homeRelatedLabels: Record<string, string> = {
  "/construction-equipment-management-software": "equipment management for construction",
  "/construction-equipment-tracking-software": "construction equipment tracking",
  "/tool-management-software": "tool management software",
  "/tool-inventory-software": "manage reusable tool inventory",
  "/construction-asset-tracking-software": "construction asset tracking",
  "/asset-tagging-system": "QR asset tagging",
  "/equipment-checkout": "see how tool checkout works",
  "/construction-equipment-maintenance-software": "equipment maintenance tracking",
  "/industries/plumbing-contractors": "tool tracking for plumbing contractors",
  "/industries/electrical-contractors": "tool tracking for electrical contractors",
  "/industries/general-contractors": "tool tracking for general contractors",
};

export default function Home() {
  const page = seoPageByPath.get("/");
  return <main className="marketing-page">
    <HomeSeoSchema />
    <MarketingHeader />
    <section className="hero hero-centered">
      <p className="eyebrow">QR TOOL TRACKING FOR CONSTRUCTION CREWS</p>
      <h1>{page?.h1}</h1>
      <p className="hero-copy">TakeMoveReturn is construction tool tracking software for crews that need a practical way to keep handoffs current. The tool tracking software workflow uses QR codes to show who has reusable tools, where they were last recorded, and what condition they’re in — all from a phone browser. No native app. No expensive hardware.</p>
      <div className="hero-actions"><Link className="button" href="/signup">Start free <IconArrowRight size={18} aria-hidden="true" /></Link><Link className="text-link" href="#workflow">See how it works</Link></div>
      <p className="microcopy">Free for 25 tools <span>·</span> No credit card <span>·</span> Unlimited field workers</p>
    </section>
    <ProductWorkspace />
    <ProofStrip />
    <section id="workflow" className="section-heading"><p className="eyebrow">TAKE. MOVE. RETURN.</p><h2>A simple way to keep your tools in play.</h2><p>Bring a clear record to every handoff — without turning your crew into data-entry specialists.</p></section>
    <WorkflowSteps />
    <section className="content-sections" aria-label="Construction tool tracking details">
      <section><h2>{page?.headings[0] ?? "Tool Tracking Software Built for Construction Crews"}</h2><p>Tool tracking should stay simple enough for field crews to use at the point of handoff. TakeMoveReturn keeps the record focused on reusable tools, current holder, recorded location, condition, and movement history.</p></section>
      <section><h2>{page?.headings[1] ?? "A Tool Tracking System for Construction That Follows Every Move"}</h2><p>A tool tracking system for construction works best when the same TAKE, MOVE, and RETURN workflow follows a tool from worker to truck, warehouse, and job site.</p></section>
      <section><h2>{page?.headings[2] ?? "Track Tools and Equipment Across Workers, Trucks and Job Sites"}</h2><p>Tools and equipment tracking should answer the operational question before the search begins: who has the tool now, where was it last recorded, and was it returned?</p></section>
      <section><h2>{page?.headings[3] ?? "Simple Small Tool Tracking Without Expensive Hardware"}</h2><p>Small tool tracking software does not have to depend on GPS or dedicated scanners. A QR label and a phone browser can record the handoff where the work actually happens.</p></section>
    </section>
    <section className="split-section"><div><p className="eyebrow">BUILT FOR HOW CONSTRUCTION WORKS</p><h2>Follow tools across the places work actually happens.</h2><p>See the current holder, current location, condition, and movement history for reusable tools across workers, trucks, warehouses, and job sites.</p><Link className="text-link" href="/features">Explore the workflow <IconArrowRight size={18} aria-hidden="true" /></Link></div><div className="location-list"><p><IconTool size={22} aria-hidden="true" /><strong>Worker</strong><span>Know who has it now.</span></p><p><IconScan size={22} aria-hidden="true" /><strong>Truck</strong><span>Keep tools visible between sites.</span></p><p><IconQrcode size={22} aria-hidden="true" /><strong>Job site</strong><span>Scan at the point of handoff.</span></p><p><IconFileSpreadsheet size={22} aria-hidden="true" /><strong>Warehouse</strong><span>Start with your current list.</span></p></div></section>
    <InlineCta title="Import your tool list from Excel or CSV." />
    {page?.faqs?.length ? <section className="faq-block" aria-labelledby="home-faq-title"><p className="eyebrow">FAQ</p><h2 id="home-faq-title">Construction tool tracking questions</h2><div className="faq-list">{page.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section> : null}
    <nav className="related-links" aria-label="Construction tool tracking solutions"><p className="eyebrow">SOLUTIONS</p><h2>Explore the workflow by use case.</h2><div>{page?.relatedPaths?.map((path) => <Link key={path} href={path}>{homeRelatedLabels[path] ?? path.replace(/^\//, "").replaceAll("-", " ").replaceAll("/", " · ")} <IconArrowRight size={16} aria-hidden="true" /></Link>)}</div></nav>
    <section className="pricing-teaser"><p className="eyebrow">SIMPLE PRICING</p><h2>Pay for tools. Not people.</h2><p>Every plan includes unlimited field workers.</p><div className="plan-glance">{Object.values(plans).map((plan) => <article key={plan.id}><h3>{plan.name}</h3><strong>{plan.monthlyPrice === 0 ? "$0" : `$${plan.monthlyPrice}`}</strong><span>{plan.monthlyPrice === 0 ? "Free forever" : "/month"}</span><p>{plan.toolLimit.toLocaleString()} active tools</p></article>)}</div><Link className="text-link" href="/pricing">View pricing <IconArrowRight size={18} aria-hidden="true" /></Link></section>
    <MarketingFooter />
  </main>;
}
