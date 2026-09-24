"use client";

import Link from "next/link";
import { useState } from "react";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";
import { plans } from "../config/plans";

export function PricingCards() {
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  return <><div className="pricing-interval" role="group" aria-label="Billing interval"><button type="button" aria-pressed={interval === "monthly"} className={interval === "monthly" ? "active" : ""} onClick={() => setInterval("monthly")}>Monthly</button><button type="button" aria-pressed={interval === "annual"} className={interval === "annual" ? "active" : ""} onClick={() => setInterval("annual")}>Annual <span>Save 2 months</span></button></div><section className="pricing-grid">{Object.values(plans).map((plan) => <article className={plan.id === "growth" ? "price-card featured" : "price-card"} key={plan.id}>{plan.id === "growth" && <span className="plan-label">POPULAR FOR GROWING CREWS</span>}<h2>{plan.name}</h2><p className="price"><strong>${interval === "annual" && plan.annualPrice ? plan.annualPrice : plan.monthlyPrice}</strong><span>{interval === "annual" && plan.annualPrice ? "/year" : "/month"}</span></p><p className="annual">{plan.annualPrice ? interval === "annual" ? `12 months of service for $${plan.annualPrice}, billed annually.` : `Or $${plan.annualPrice}/year — save 2 months.` : "No credit card required."}</p><ul><li><IconCheck size={18} aria-hidden="true" />{plan.toolLimit.toLocaleString()} active tools</li><li><IconCheck size={18} aria-hidden="true" />{plan.adminLimit} admin{plan.adminLimit === 1 ? "" : "s"}</li><li><IconCheck size={18} aria-hidden="true" />Unlimited field workers</li><li><IconCheck size={18} aria-hidden="true" />{plan.id === "free" ? "100 MB" : plan.id === "starter" ? "2 GB" : plan.id === "growth" ? "10 GB" : "25 GB"} storage</li></ul><Link className={plan.id === "growth" ? "button" : "button button-quiet"} href="/signup">Start free <IconArrowRight size={17} aria-hidden="true" /></Link></article>)}</section></>;
}
