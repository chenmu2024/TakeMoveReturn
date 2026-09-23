import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";
import { InlineCta, MarketingFooter, MarketingHeader, ProductWorkspace } from "../../components/marketing";
import { seoPageByPath } from "../../data/seo-keywords";

const pages: Record<string, { title: string; description: string }> = {
  "help": { title: "Help Center", description: "Guidance for getting started, QR labels, tool tracking, workers, locations, imports, and account settings." },
  "help/contact": { title: "Contact Support", description: "Get help with your TakeMoveReturn workspace." },
  "privacy": { title: "Privacy", description: "TakeMoveReturn privacy information. Legal review is required before production publication." },
  "terms": { title: "Terms", description: "TakeMoveReturn terms. Legal review is required before production publication." },
  "dpa": { title: "Data Processing Addendum", description: "Draft data processing addendum. Legal review is required before production publication." },
  "subprocessors": { title: "Subprocessors", description: "Draft subprocessor list. Legal review is required before production publication." },
};

const detailCopy = [
  "Use QR labels and a simple browser workflow to keep the record current at the point of handoff.",
  "See the current holder, current location, condition, and a readable movement history in one place.",
  "Move beyond paper lists and spreadsheets without adding expensive tracking hardware or a complex enterprise system.",
  "Keep the product focused on reusable construction tools so crews can understand the next action immediately.",
  "Start with the tool list you already have, then add consistent records as work moves between the shop and the field.",
];

export default async function ContentPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const key = (await params).slug.join("/");
  const path = "/" + key;
  const seoPage = seoPageByPath.get(path);
  const page = seoPage ?? pages[key];
  if (!page) notFound();
  const title = seoPage?.h1 ?? page.title;
  return <main className="marketing-page"><MarketingHeader /><article className="content-page"><header className="content-hero"><p className="eyebrow">{seoPage?.pageType === "blog" ? "PRACTICAL GUIDE" : "CONSTRUCTION TOOL TRACKING"}</p><h1>{title}</h1><p>{page.description}</p>{seoPage && <Link className="button" href="/signup">Start free <IconArrowRight size={18} aria-hidden="true" /></Link>}</header>{seoPage && <><section className="direct-answer"><h2>A practical tool-tracking workflow for construction crews.</h2><p>TakeMoveReturn gives small crews a simple QR-based way to record where reusable tools are, who has them, and what happened next.</p><ul><li><IconCheck size={18} aria-hidden="true" />No GPS or expensive hardware required</li><li><IconCheck size={18} aria-hidden="true" />Works from a phone browser</li><li><IconCheck size={18} aria-hidden="true" />Built around TAKE, MOVE, and RETURN</li></ul></section><section className="content-product"><div><p className="eyebrow">PRODUCT PREVIEW</p><h2>See the record before you search for the tool.</h2><p>Keep the details field teams need together, from the tool list to the next handoff.</p></div><ProductWorkspace compact /></section><div className="content-sections">{seoPage.headings.map((heading, index) => <section key={heading}><h2>{heading}</h2><p>{detailCopy[index] ?? detailCopy[0]}</p></section>)}</div><InlineCta title="Give every tool a clearer next move." /></>}{!seoPage && <section className="plain-content"><h2>Built around TAKE, MOVE, and RETURN</h2><p>TakeMoveReturn helps small construction crews keep tool records clear, practical, and easy to use in the field.</p>{["privacy", "terms", "dpa", "subprocessors"].includes(key) && <p><strong>LEGAL REVIEW REQUIRED BEFORE PRODUCTION.</strong></p>}</section>}<MarketingFooter /></article></main>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const key = "/" + (await params).slug.join("/");
  const page = seoPageByPath.get(key);
  return page ? { title: page.title, description: page.description, alternates: { canonical: page.canonical }, robots: page.status === "indexable" && !page.needsUSVerification ? { index: true, follow: true } : { index: false, follow: false } } : {};
}
