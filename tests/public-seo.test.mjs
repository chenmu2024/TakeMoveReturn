import test from "node:test";
import assert from "node:assert/strict";
import { plans } from "../src/config/plans.ts";
import { softwareSchema, pricingFaqs, faqSchema } from "../src/lib/public-seo.ts";
import { seoPages } from "../src/data/seo-keywords.ts";
import { practicalContent, practicalContentUpdatedAt } from "../src/data/seo-practical-content.ts";

test("public offers match the single plan config without fabricated reviews", () => {
  const schema = softwareSchema();
  assert.equal(schema.offers.length, 7);
  assert.equal(new Set(schema.offers.map((offer) => offer["@id"])).size, 7);
  for (const plan of Object.values(plans)) {
    for (const interval of plan.id === "free" ? ["month"] : ["month", "year"]) {
      const offer = schema.offers.find((item) => item["@id"].endsWith(`#${plan.id}-${interval}`));
      assert.equal(offer.price, interval === "year" ? plan.annualPrice : plan.monthlyPrice);
      assert.equal(offer.priceSpecification.price, offer.price);
      assert.equal(offer.priceSpecification.billingDuration, interval === "year" ? "P1Y" : "P1M");
      assert.equal(offer.priceCurrency, "USD");
    }
  }
  assert.equal(schema.aggregateRating, undefined);
  assert.equal(schema.review, undefined);
});

test("each existing non-home SEO route has distinct practical editorial content", () => {
  assert.equal(Object.keys(practicalContent).length, seoPages.length - 1);
  assert.equal(new Set(Object.values(practicalContent).map((value) => value.explanation)).size, 29);
  for (const page of seoPages.filter((item) => item.path !== "/")) {
    const content = practicalContent[page.path];
    assert.ok(content, page.path);
    assert.equal(content.checklist.length, 3);
    assert.equal(page.dateModified, practicalContentUpdatedAt);
    assert.ok(page.faqs.some((faq) => faq.question === content.question && faq.answer === content.answer));
  }
  assert.equal(seoPages.filter((page) => page.status === "indexable" && !page.needsUSVerification).length, 10);
  assert.equal(seoPages.filter((page) => page.needsUSVerification).length, 20);
});

test("pricing FAQ markup is generated from the visible questions and answers", () => {
  const schema = faqSchema(pricingFaqs);
  assert.equal(schema.mainEntity.length, pricingFaqs.length);
  schema.mainEntity.forEach((question, index) => {
    assert.equal(question.name, pricingFaqs[index].question);
    assert.equal(question.acceptedAnswer.text, pricingFaqs[index].answer);
  });
  assert.deepEqual(faqSchema([]).mainEntity, []);
});
