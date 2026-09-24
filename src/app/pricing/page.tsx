import type { Metadata } from "next";
import { MarketingFooter, MarketingHeader } from "../../components/marketing";
import { PricingCards } from "../../components/pricing-cards";

export const metadata: Metadata = { title: "Construction Tool Tracking Pricing | TakeMoveReturn", description: "Compare TakeMoveReturn plans by active tool capacity, storage, admins, and unlimited field workers.", alternates: { canonical: "/pricing" }, openGraph: { title: "Construction Tool Tracking Pricing | TakeMoveReturn", description: "Compare TakeMoveReturn plans by active tool capacity, storage, admins, and unlimited field workers.", type: "website" } };

export default function PricingPage() {
  return <main className="marketing-page"><MarketingHeader /><section className="page-hero pricing-hero"><p className="eyebrow">SIMPLE PRICING</p><h1>Pay for tools. Not people.</h1><p>Every plan includes unlimited field workers. Choose the tool capacity that fits your crew today.</p></section><PricingCards /><section className="pricing-footnote"><h2>All plans keep your field workflow moving.</h2><p>When an account reaches a capacity limit, existing tools and history remain available. Field tracking is not removed.</p></section><MarketingFooter /></main>;
}
