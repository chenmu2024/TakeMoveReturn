import Link from "next/link";
import { IconArrowRight, IconFileSpreadsheet, IconQrcode, IconScan, IconTool } from "@tabler/icons-react";
import { plans } from "../config/plans";
import { seoPageByPath } from "../data/seo-keywords";
import { InlineCta, MarketingFooter, MarketingHeader, ProductWorkspace, ProofStrip, WorkflowSteps } from "../components/marketing";

export default function Home() {
  const page = seoPageByPath.get("/");
  return <main className="marketing-page">
    <MarketingHeader />
    <section className="hero hero-centered">
      <p className="eyebrow">QR TOOL TRACKING FOR CONSTRUCTION CREWS</p>
      <h1>{page?.h1}</h1>
      <p className="hero-copy">Tag your tools with QR codes and know who has them, where they are, and what condition they’re in — all from a phone browser. No native app. No expensive hardware.</p>
      <div className="hero-actions"><Link className="button" href="/signup">Start free <IconArrowRight size={18} aria-hidden="true" /></Link><Link className="text-link" href="#workflow">See how it works</Link></div>
      <p className="microcopy">Free for 25 tools <span>·</span> No credit card <span>·</span> Unlimited field workers</p>
    </section>
    <ProductWorkspace />
    <ProofStrip />
    <section id="workflow" className="section-heading"><p className="eyebrow">TAKE. MOVE. RETURN.</p><h2>A simple way to keep your tools in play.</h2><p>Bring a clear record to every handoff — without turning your crew into data-entry specialists.</p></section>
    <WorkflowSteps />
    <section className="split-section"><div><p className="eyebrow">BUILT FOR HOW CONSTRUCTION WORKS</p><h2>Follow tools across the places work actually happens.</h2><p>See the current holder, current location, condition, and movement history for reusable tools across workers, trucks, warehouses, and job sites.</p><Link className="text-link" href="/features">Explore the workflow <IconArrowRight size={18} aria-hidden="true" /></Link></div><div className="location-list"><p><IconTool size={22} aria-hidden="true" /><strong>Worker</strong><span>Know who has it now.</span></p><p><IconScan size={22} aria-hidden="true" /><strong>Truck</strong><span>Keep tools visible between sites.</span></p><p><IconQrcode size={22} aria-hidden="true" /><strong>Job site</strong><span>Scan at the point of handoff.</span></p><p><IconFileSpreadsheet size={22} aria-hidden="true" /><strong>Warehouse</strong><span>Start with your current list.</span></p></div></section>
    <InlineCta title="Import your tool list from Excel or CSV." />
    <section className="pricing-teaser"><p className="eyebrow">SIMPLE PRICING</p><h2>Pay for tools. Not people.</h2><p>Every plan includes unlimited field workers.</p><div className="plan-glance">{Object.values(plans).map((plan) => <article key={plan.id}><h3>{plan.name}</h3><strong>{plan.monthlyPrice === 0 ? "$0" : `$${plan.monthlyPrice}`}</strong><span>{plan.monthlyPrice === 0 ? "Free forever" : "/month"}</span><p>{plan.toolLimit.toLocaleString()} active tools</p></article>)}</div><Link className="text-link" href="/pricing">View pricing <IconArrowRight size={18} aria-hidden="true" /></Link></section>
    <MarketingFooter />
  </main>;
}
