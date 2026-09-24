import Link from "next/link";
import type { Metadata } from "next";
import { IconArrowLeft, IconSearch } from "@tabler/icons-react";
import { MarketingFooter, MarketingHeader } from "../components/marketing";

export const metadata: Metadata = { title: "Page not found | TakeMoveReturn", robots: { index: false, follow: false } };

export default function NotFound() {
  return <main className="marketing-page"><MarketingHeader /><section className="not-found-page"><div className="not-found-icon"><IconSearch size={26} aria-hidden="true" /></div><p className="eyebrow">PAGE NOT FOUND</p><h1>That page is not on the tool list.</h1><p>Check the address or return to the TakeMoveReturn home page to continue.</p><Link className="button" href="/"><IconArrowLeft size={17} aria-hidden="true" />Back to home</Link></section><MarketingFooter /></main>;
}
