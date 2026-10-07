import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "../../components/marketing";
import { PricingCards } from "../../components/pricing-cards";
import { PricingSeoSchema } from "../../components/seo-schema";
import { pricingFaqs } from "../../lib/public-seo";

export const metadata: Metadata = { title: "Construction Tool Tracking Pricing | TakeMoveReturn", description: "Compare TakeMoveReturn plans by active tool capacity, storage, admins, and unlimited field workers.", alternates: { canonical: "/pricing" }, openGraph: { title: "Construction Tool Tracking Pricing | TakeMoveReturn", description: "Compare TakeMoveReturn plans by active tool capacity, storage, admins, and unlimited field workers.", url: "/pricing", images: [{ url: "/opengraph-image", width: 1200, height: 630 }], type: "website" }, twitter: { card: "summary_large_image", title: "Construction Tool Tracking Pricing | TakeMoveReturn", description: "Compare tool capacity, administrators and unlimited field workers.", images: ["/opengraph-image"] } };

export default function PricingPage() {
  const customerFilesEnabled = process.env.CUSTOMER_FILES_ENABLED === "true";
  return <main className="marketing-page"><PricingSeoSchema /><MarketingHeader /><section className="page-hero pricing-hero"><p className="eyebrow">SIMPLE PRICING</p><h1>Pay for tools. Not people.</h1><p>Every plan includes unlimited field workers. Choose the tool capacity that fits your crew today.</p></section><PricingCards customerFilesEnabled={customerFilesEnabled} /><section className="pricing-footnote"><h2>All plans keep your field workflow moving.</h2><p>When an account reaches a capacity limit, existing tools and history remain available. Field tracking is not removed. <Link href="/help/billing">Read how plan changes and billing work</Link>.</p></section><section className="faq-block" aria-labelledby="pricing-faq-title"><p className="eyebrow">PRICING FAQ</p><h2 id="pricing-faq-title">Understand the plan before you choose.</h2><div className="faq-list">{pricingFaqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section><MarketingFooter /></main>;
}
