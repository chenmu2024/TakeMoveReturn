import { plans } from "../config/plans.ts";
import { siteConfig } from "../config/site.ts";

export const pricingFaqs = [
  { question: "What is included in the Free plan?", answer: `Free includes ${plans.free.toolLimit} active tools, ${plans.free.adminLimit} administrator and unlimited field workers. No credit card is required to start.` },
  { question: "How does annual billing compare with monthly billing?", answer: "Annual plans provide 12 months of service for the price of 10 monthly payments. Annual prices are billed once per year, not as a monthly charge." },
  { question: "Do field workers count toward the administrator limit?", answer: "No. Field workers are unlimited across plans. Administrator limits apply to workspace administration, not the number of field workers." },
  { question: "Is tool location tracked continuously?", answer: "No. TakeMoveReturn records authenticated QR handoffs and selected locations. It does not provide live GPS, RFID or Bluetooth tracking." },
];

export function softwareSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${siteConfig.siteUrl}/#software`,
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteConfig.siteUrl,
    description: "Browser-based QR custody tracking for reusable construction tools. Locations reflect recorded handoffs, not live GPS.",
    offers: Object.values(plans).flatMap((plan) => {
      const intervals = plan.id === "free" ? ["month"] as const : ["month", "year"] as const;
      return intervals.map((interval) => ({
        "@type": "Offer",
        "@id": `${siteConfig.siteUrl}/pricing#${plan.id}-${interval}`,
        name: `${plan.name} ${interval === "year" ? "annual" : "monthly"}`,
        url: `${siteConfig.siteUrl}/pricing`,
        price: interval === "year" ? plan.annualPrice : plan.monthlyPrice,
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: interval === "year" ? plan.annualPrice : plan.monthlyPrice,
          priceCurrency: "USD",
          billingDuration: interval === "year" ? "P1Y" : "P1M",
        },
      }));
    }),
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) };
}
