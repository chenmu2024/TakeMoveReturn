import Link from "next/link";
import { IconArrowRight, IconCircleCheck, IconFileSpreadsheet, IconMapPin, IconQrcode, IconTool, IconUsersGroup } from "@tabler/icons-react";
import { siteConfig } from "../config/site";

export function MarketingHeader() {
  return <header className="site-header">
    <Link className="brand" href="/" aria-label="TakeMoveReturn home"><span>{siteConfig.name}</span><small>{siteConfig.descriptor}</small></Link>
    <nav aria-label="Primary navigation"><Link href="/features">Features</Link><Link href="/#workflow">How it works</Link><Link href="/pricing">Pricing</Link><Link href="/help">Help</Link></nav>
    <div className="header-actions"><Link className="sign-in" href="/login">Sign in</Link><Link className="button button-small" href="/signup">Start free</Link></div>
  </header>;
}

export function MarketingFooter() {
  return <footer className="site-footer"><div><strong>{siteConfig.name}</strong><p>Construction tool tracking software for crews that need a clear, practical record.</p><p>Support: <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a></p><p>General and privacy: <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a></p></div><div className="footer-links"><Link href="/features">Features</Link><Link href="/pricing">Pricing</Link><Link href="/about">About</Link><Link href="/help">Help Center</Link><Link href="/help/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/dpa">DPA</Link><Link href="/subprocessors">Subprocessors</Link><Link href="/business-information">Business Information</Link></div></footer>;
}

export function ProductWorkspace({ compact = false }: { compact?: boolean }) {
  return <section className={compact ? "product-shot product-shot-compact" : "product-shot"} aria-label="TakeMoveReturn illustrative product preview"><img src="/images/product-workspace-1024.webp" srcSet="/images/product-workspace-480.webp 480w, /images/product-workspace-768.webp 768w, /images/product-workspace-1024.webp 1024w" alt="Illustrative interface concept with fictional tool records and TAKE, MOVE, and RETURN actions; not a current workspace screenshot" width={1024} height={1536} loading={compact ? "lazy" : "eager"} fetchPriority={compact ? "auto" : "high"} decoding="async" sizes={compact ? "(max-width: 760px) calc(100vw - 40px), 480px" : "(max-width: 760px) calc(100vw - 40px), (max-width: 1280px) calc(100vw - 76px), 1120px"} /><p className="product-preview-caption">Illustrative design preview with fictional records. The current workspace interface may differ.</p></section>;
}

export function WorkflowSteps() {
  const steps = [{ icon: IconFileSpreadsheet, title: "Add your tools", text: "Create your list or import it from Excel or CSV." }, { icon: IconQrcode, title: "Label with QR codes", text: "Print durable labels and put them on the tools you use." }, { icon: IconTool, title: "Scan in your browser", text: "TAKE, MOVE, or RETURN from a phone browser. No app required." }];
  return <div className="workflow-grid">{steps.map(({ icon: Icon, title, text }, index) => <article className="workflow-step" key={title}><span className="step-number">{index + 1}</span><Icon size={36} stroke={1.8} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}</div>;
}

export function ProofStrip() {
  const items = [{ icon: IconQrcode, title: "QR browser workflow", text: "A simple field workflow." }, { icon: IconUsersGroup, title: "Unlimited field workers", text: "Pay for tools, not people." }, { icon: IconMapPin, title: "Built for the field", text: "Workers, trucks, warehouses, job sites." }, { icon: IconCircleCheck, title: "Clear history", text: "Know what happened to every tool." }];
  return <div className="proof-strip">{items.map(({ icon: Icon, title, text }) => <div key={title}><Icon size={27} stroke={1.8} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></div>)}</div>;
}

export function InlineCta({ title = "Keep every tool in play." }: { title?: string }) {
  return <section className="inline-cta"><div><span className="eyebrow">GET STARTED FAST</span><h2>{title}</h2><p>Start with your existing spreadsheet, print QR labels, and give your crew a clear field workflow.</p></div><Link className="button" href="/signup">Start free <IconArrowRight size={18} aria-hidden="true" /></Link></section>;
}
