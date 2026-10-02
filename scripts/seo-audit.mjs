import { readFileSync } from "node:fs";

const seoSource = readFileSync(new URL("../src/data/seo-keywords.ts", import.meta.url), "utf8");
const schemaSource = readFileSync(new URL("../src/components/seo-schema.tsx", import.meta.url), "utf8") + readFileSync(new URL("../src/lib/public-seo.ts", import.meta.url), "utf8");
const siteConfig = readFileSync(new URL("../src/config/site.ts", import.meta.url), "utf8");
const sitemapSource = readFileSync(new URL("../src/app/sitemap.ts", import.meta.url), "utf8");
const contentSource = readFileSync(new URL("../src/app/[...slug]/page.tsx", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");

const failures = [];

const blockMatches = [...seoSource.matchAll(/\b(core|roadmap|roadmapCandidate|adjacent)\(\{ path: "([^"]+)"([\s\S]*?)\}\),/g)];
const pages = blockMatches.map((match) => {
  const wrapper = match[1];
  const path = match[2];
  const block = match[0];
  const get = (re) => block.match(re)?.[1] ?? null;
  return {
    wrapper,
    path,
    block,
    title: get(/title: "([^"]+)"/),
    h1: get(/h1: "([^"]+)"/),
    description: get(/description: "([^"]+)"/),
    primaryKeyword: get(/primaryKeyword: "([^"]+)"/),
    cluster: get(/cluster: "([^"]+)"/),
    indexable: wrapper === "core",
    needsUSVerification: wrapper !== "core",
    outsideMaster: block.includes("outsideMaster: true"),
  };
});

const pageByPath = new Map(pages.map((page) => [page.path, page]));
const paths = pages.map((page) => page.path);

function duplicates(values) {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
}

const duplicatePaths = duplicates(paths);
if (duplicatePaths.length) failures.push(`Duplicate canonical path(s): ${duplicatePaths.join(", ")}`);

const duplicatePrimary = duplicates(pages.map((page) => page.primaryKeyword).filter(Boolean));
if (duplicatePrimary.length) failures.push(`Duplicate primary keyword(s): ${duplicatePrimary.join(", ")}`);

const duplicateIndexableClusters = duplicates(pages.filter((page) => page.indexable).map((page) => page.cluster).filter(Boolean));
if (duplicateIndexableClusters.length) failures.push(`Duplicate indexable cluster(s): ${duplicateIndexableClusters.join(", ")}`);

for (const page of pages) {
  if (!page.title) failures.push(`Missing title: ${page.path}`);
  if (!page.h1) failures.push(`Missing H1: ${page.path}`);
  if (!page.description) failures.push(`Missing meta description: ${page.path}`);
  if (!page.primaryKeyword) failures.push(`Missing primary keyword: ${page.path}`);
  if (!page.cluster) failures.push(`Missing cluster: ${page.path}`);
  if (page.outsideMaster && page.indexable) failures.push(`Outside-master route must remain noindex: ${page.path}`);
}

const requiredRoutes = [
  "/",
  "/construction-equipment-management-software",
  "/construction-equipment-tracking-software",
  "/tool-management-software",
  "/tool-inventory-software",
  "/construction-asset-tracking-software",
  "/asset-tagging-system",
  "/equipment-checkout",
  "/construction-equipment-maintenance-software",
  "/blog/how-to-manage-construction-site-inventory",
  "/industries/plumbing-contractors",
  "/industries/electrical-contractors",
  "/industries/general-contractors",
  "/best/tool-tracking-software",
  "/guides/how-to-keep-track-of-tools-and-equipment",
  "/guides/how-to-store-power-tools",
  "/guides/asset-tracking-cost",
  "/guides/asset-tracking-technologies",
  "/guides/tool-calibration-tracking",
  "/guides/qr-code-vs-barcode-tool-tracking",
  "/guides/cmms-vs-tool-tracking-software",
  "/guides/construction-management-software-vs-tool-tracking-software",
  "/guides/warehouse-management-software-vs-tool-tracking-software",
  "/guides/field-service-management-vs-tool-tracking-software",
];
for (const path of requiredRoutes) if (!pageByPath.has(path)) failures.push(`Missing Master route: ${path}`);

const registryMatch = seoSource.match(/export const keywordRegistry: KeywordRegistryEntry\[\] = (\[[\s\S]*?\]);/);
if (!registryMatch) {
  failures.push("Keyword registry export is missing.");
} else {
  try {
    const registry = JSON.parse(registryMatch[1]);
    if (registry.length !== 135) failures.push(`Expected 135 Master keyword registry entries, found ${registry.length}.`);
    for (const entry of registry) {
      if (entry.decision === "active" && entry.targetUrl && !pageByPath.has(entry.targetUrl)) {
        failures.push(`Active keyword points to missing route: ${entry.keyword} -> ${entry.targetUrl}`);
      }
      if ((entry.decision === "hold" || entry.decision === "excluded") && entry.targetUrl !== null) {
        failures.push(`Hold/excluded keyword unexpectedly has target URL: ${entry.keyword}`);
      }
    }
  } catch (error) {
    failures.push(`Keyword registry is not valid JSON data: ${error.message}`);
  }
}

if (!siteConfig.includes('const rawSiteUrl = "https://takemovereturn.com";')) {
  failures.push("Canonical site URL must be https://takemovereturn.com.");
}

if (!sitemapSource.includes('page.status === "indexable" && !page.needsUSVerification')) {
  failures.push("Sitemap must gate SEO pages on indexable status and completed US verification.");
}

if (!contentSource.includes('seoPage.status !== "indexable" || seoPage.needsUSVerification')) {
  failures.push("SEO page metadata must noindex pages that are pending verification.");
}

for (const schemaType of ["Brand", "WebSite", "SoftwareApplication", "BreadcrumbList", "FAQPage"]) {
  if (!schemaSource.includes(`"@type": "${schemaType}"`)) failures.push(`Missing schema type: ${schemaType}`);
}

const visibleChecks = [
  ["/", "construction tool tracking software"],
  ["/", "tool tracking software"],
  ["/", "tools and equipment tracking"],
  ["/", "small tool tracking software"],
  ["/", "tool tracking app"],
  ["/construction-equipment-management-software", "equipment management software"],
  ["/construction-equipment-management-software", "equipment management system"],
  ["/construction-equipment-management-software", "heavy equipment management software"],
  ["/construction-equipment-tracking-software", "equipment tracker"],
  ["/construction-equipment-tracking-software", "equipment tracking system"],
  ["/tool-management-software", "tool management systems"],
  ["/tool-management-software", "tool management solution"],
  ["/tool-management-software", "tool management tool"],
  ["/tool-inventory-software", "equipment inventory software"],
  ["/tool-inventory-software", "tool inventory management"],
  ["/tool-inventory-software", "tool inventory tracking system"],
  ["/tool-inventory-software", "tool inventory app"],
  ["/asset-tagging-system", "asset tag system"],
  ["/asset-tagging-system", "barcode asset tracking"],
  ["/asset-tagging-system", "qr code tracking system"],
  ["/equipment-checkout", "tool checkout system"],
  ["/equipment-checkout", "equipment checkout"],
  ["/equipment-checkout", "tool checkout tracking"],
  ["/equipment-checkout", "tool return tracking"],
  ["/construction-equipment-maintenance-software", "maintenance management software"],
  ["/construction-equipment-maintenance-software", "equipment maintenance tracking software"],
  ["/construction-equipment-maintenance-software", "asset maintenance software"],
  ["/construction-equipment-maintenance-software", "work order tracking software"],
  ["/industries/plumbing-contractors", "tool tracking solution for plumbers"],
  ["/industries/plumbing-contractors", "tool tracking tool for plumbers"],
  ["/industries/plumbing-contractors", "tool management tool for plumbers"],
  ["/industries/plumbing-contractors", "asset tracking tool for plumbers"],
  ["/industries/electrical-contractors", "tool tracking solution for electricians"],
  ["/industries/electrical-contractors", "tool tracking tool for electricians"],
  ["/industries/general-contractors", "tool tracking solution for general contractors"],
  ["/best/tool-tracking-software", "best tool tracking system"],
  ["/best/tool-tracking-software", "best tool tracking platform for field crews"],
  ["/guides/how-to-store-power-tools", "storing power tools"],
  ["/guides/asset-tracking-technologies", "technology asset tracking"],
  ["/guides/tool-calibration-tracking", "calibrate a tool"],
  ["/guides/qr-code-vs-barcode-tool-tracking", "barcode tool tracking system"],
  ["/guides/cmms-vs-tool-tracking-software", "cmms software"],
  ["/guides/construction-management-software-vs-tool-tracking-software", "project management software for construction"],
  ["/guides/warehouse-management-software-vs-tool-tracking-software", "warehouse management system software"],
  ["/guides/field-service-management-vs-tool-tracking-software", "field service management software"],
];

for (const [path, keyword] of visibleChecks) {
  const page = pageByPath.get(path);
  if (!page) continue;
  let visible = page.block
    .replace(/secondaryKeywords: \[[^\]]*\]/g, "")
    .replace(/primaryKeyword: "[^"]+"/g, "")
    .replace(/keyword: "[^"]+"/g, "")
    .toLowerCase();
  if (path === "/") visible += "\n" + homeSource.toLowerCase();
  if (!visible.includes(keyword.toLowerCase())) failures.push(`Keyword not visible in intended page copy: "${keyword}" -> ${path}`);
}

const root = pageByPath.get("/");
const requiredHomeLinks = [
  "/construction-equipment-management-software",
  "/construction-equipment-tracking-software",
  "/tool-management-software",
  "/tool-inventory-software",
  "/construction-asset-tracking-software",
  "/asset-tagging-system",
  "/equipment-checkout",
  "/construction-equipment-maintenance-software",
];
for (const path of requiredHomeLinks) {
  if (!root?.block.includes(path)) failures.push(`Homepage relatedPaths missing core link: ${path}`);
}
if (!homeSource.includes("page?.relatedPaths?.map")) failures.push("Homepage does not render configured related SEO links.");


const expectedTitles = {
  "/": "Construction Tool Tracking Software | TakeMoveReturn",
  "/construction-equipment-management-software": "Construction Equipment Management Software | TakeMoveReturn",
  "/construction-equipment-tracking-software": "Construction Equipment Tracking Software | TakeMoveReturn",
  "/tool-management-software": "Tool Management Software for Construction | TakeMoveReturn",
  "/tool-inventory-software": "Tool Inventory Software for Construction Crews | TakeMoveReturn",
  "/construction-asset-tracking-software": "Construction Asset Tracking Software | TakeMoveReturn",
  "/asset-tagging-system": "QR Asset Tagging System for Construction Tools | TakeMoveReturn",
  "/equipment-checkout": "Tool & Equipment Checkout System | TakeMoveReturn",
  "/construction-equipment-maintenance-software": "Construction Equipment Maintenance Software | TakeMoveReturn",
  "/blog/how-to-manage-construction-site-inventory": "How to Manage Construction Site Inventory: Tools, Equipment & Materials",
  "/industries/plumbing-contractors": "Tool Tracking Software for Plumbing Contractors | TakeMoveReturn",
  "/industries/electrical-contractors": "Tool Tracking Software for Electrical Contractors | TakeMoveReturn",
  "/industries/general-contractors": "Tool Tracking Software for General Contractors | TakeMoveReturn",
  "/industries/remodeling-contractors": "Tool Tracking Software for Remodeling Contractors | TakeMoveReturn",
  "/industries/concrete-contractors": "Tool Tracking Software for Concrete Contractors | TakeMoveReturn",
  "/industries/civil-engineering": "Tool & Asset Tracking Software for Civil Engineering Teams | TakeMoveReturn",
  "/industries/restoration-contractors": "Equipment Tracking Software for Restoration Teams | TakeMoveReturn",
  "/best/tool-tracking-software": "Best Tool Tracking Software for Construction Crews: Comparison",
  "/guides/how-to-keep-track-of-tools-and-equipment": "How to Keep Track of Tools and Equipment",
  "/guides/asset-tracking-technologies": "Asset Tracking Technologies: QR vs Barcode vs RFID vs GPS",
  "/guides/tool-calibration-tracking": "Tool Calibration Tracking: How to Track Service and Due Dates",
  "/guides/qr-code-vs-barcode-tool-tracking": "QR Code vs Barcode Tool Tracking: What's Better for Construction?",
  "/guides/cmms-vs-tool-tracking-software": "CMMS vs Tool Tracking Software: What's the Difference?",
  "/guides/construction-management-software-vs-tool-tracking-software": "Construction Management Software vs Tool Tracking Software",
};

const expectedH1 = {
  "/": "Construction Tool Tracking Software That Shows Who Has Every Tool",
  "/construction-equipment-management-software": "Construction Equipment Management Software for Small Crews",
  "/construction-equipment-tracking-software": "Construction Equipment Tracking Software for Crews and Job Sites",
  "/tool-management-software": "Tool Management Software for Construction Crews",
  "/tool-inventory-software": "Tool Inventory Software That Shows Where Every Tool Is",
  "/construction-asset-tracking-software": "Construction Asset Tracking Software for Tools and Equipment",
  "/asset-tagging-system": "Asset Tagging System for Construction Tools and Equipment",
  "/equipment-checkout": "Tool Checkout System for Construction Crews",
  "/construction-equipment-maintenance-software": "Construction Equipment Maintenance Software for Small Crews",
  "/blog/how-to-manage-construction-site-inventory": "How to Manage Construction Site Inventory",
  "/industries/plumbing-contractors": "Tool Tracking for Plumbing Contractors",
  "/industries/electrical-contractors": "Tool Tracking for Electrical Contractors",
  "/industries/general-contractors": "Tool Tracking for General Contractors",
  "/industries/remodeling-contractors": "Tool Tracking for Remodeling and Renovation Crews",
  "/industries/concrete-contractors": "Tool Tracking for Concrete Contractors",
  "/industries/civil-engineering": "Tool Tracking for Civil Engineering Teams",
  "/industries/restoration-contractors": "Equipment Tracking for Restoration Contractors",
  "/best/tool-tracking-software": "Tool Tracking Software for Construction Crews: What to Compare",
  "/guides/how-to-keep-track-of-tools-and-equipment": "How to Keep Track of Tools and Equipment",
  "/guides/asset-tracking-cost": "How Much Does Asset Tracking Cost?",
  "/guides/cmms-vs-tool-tracking-software": "CMMS vs Tool Tracking Software",
  "/guides/construction-management-software-vs-tool-tracking-software": "Construction Management Software vs Tool Tracking Software",
  "/guides/field-service-management-vs-tool-tracking-software": "Field Service Management vs Tool Tracking Software",
};

const expectedHeadings = {
  "/": [
    "Tool Tracking Software Built for Construction Crews",
    "A Tool Tracking System for Construction That Follows Every Move",
    "Track Tools and Equipment Across Workers, Trucks and Job Sites",
    "Simple Small Tool Tracking Without Expensive Hardware",
    "Take. Move. Return.",
  ],
  "/construction-equipment-management-software": [
    "Equipment Management Software for Construction Teams",
    "A Simple Equipment Management System for Tools and Equipment",
    "Know Who Has Each Piece of Equipment",
    "Manage Equipment Across Workers, Trucks and Job Sites",
  ],
  "/construction-equipment-tracking-software": [
    "Track Equipment Across Workers, Trucks and Job Sites",
    "Equipment Tracking Without GPS Hardware",
    "How the Equipment Tracking System Works",
    "QR Tracking for Reusable Construction Equipment",
  ],
  "/tool-management-software": [
    "A Simple Tool Management System",
    "One Tool Management Solution for Workers, Trucks and Job Sites",
    "Manage Tool Checkout, Transfers and Returns",
    "Tool Management Without Spreadsheets",
  ],
  "/tool-inventory-software": [
    "Tool Inventory Management for Reusable Equipment",
    "Equipment Inventory Software for Construction Teams",
    "A Tool Inventory Tracking System Built Around Checkout and Return",
    "Move Beyond a Tool Inventory Spreadsheet",
  ],
  "/construction-asset-tracking-software": [
    "Construction Asset Tracking Across the Field",
    "Tool Asset Tracking With QR Codes",
    "Track Asset History, Holder and Location",
    "Construction Asset Tracking vs Fixed Asset Tracking Software",
  ],
  "/asset-tagging-system": [
    "Create a QR Asset Tag for Every Tool",
    "How a QR Code Tracking System Works",
    "Scan, Take, Move and Return",
    "QR Tracking vs Barcode Asset Tracking",
    "Do You Need Dedicated Barcode Hardware?",
  ],
  "/equipment-checkout": [
    "How the Tool Checkout System Works",
    "Scan a QR Code to TAKE a Tool",
    "Move Tools Between Workers, Trucks and Job Sites",
    "Return Tools and Keep the Full History",
    "Equipment Checkout Without Paper Sign-Out Sheets",
  ],
  "/construction-equipment-maintenance-software": [
    "Track Maintenance Without a Full CMMS",
    "What Is Maintenance Management Software?",
    "Construction Equipment Maintenance Tracking",
    "Asset Maintenance History",
    "Lightweight Work Order Tracking",
    "When You Need a Full CMMS Instead",
  ],
  "/blog/how-to-manage-construction-site-inventory": [
    "Separate Tools, Equipment and Consumable Materials",
    "When Construction Inventory Software Makes Sense",
    "Construction Inventory Management Software vs Tool Tracking",
    "Track Reusable Tools Across Workers, Trucks and Job Sites",
    "Why Spreadsheets Break Down on Active Job Sites",
  ],
  "/industries/plumbing-contractors": [
    "Track Plumbing Tools Across Techs, Trucks and Jobs",
    "A Tool Management System for Plumbing Crews",
    "Track Press Tools, Drain Cameras and Power Tools",
    "Tool Tracking vs Plumbing Inventory Software",
  ],
  "/industries/electrical-contractors": [
    "Track Electrical Tools Across Electricians and Service Trucks",
    "Know Who Has Meters, Testers and Crimpers",
    "Move Tools From Warehouse to Truck to Job Site",
    "Return Tools Without Paper Sign-Out Sheets",
  ],
  "/industries/general-contractors": [
    "Track Shared Tools Across Multiple Crews",
    "Know Which Truck or Job Site Has the Tool",
    "A Simple Tool Tracking Solution for General Contractors",
    "Replace Tool Checkout Spreadsheets",
  ],
  "/industries/remodeling-contractors": [
    "Track Tools Moving Between Renovation Jobs",
    "Keep Builder Tools Assigned to the Right Crew",
    "Tool Management for Small Remodeling Teams",
  ],
  "/industries/civil-engineering": [
    "Track Field Equipment Across Sites and Teams",
    "Asset Tracking for Civil Engineers",
    "QR Tool Tracking for Shared Field Equipment",
  ],
  "/best/tool-tracking-software": [
    "What Makes a Good Tool Tracking System?",
    "Tool Tracking Platforms for Field Crews",
    "Compare QR, App, Barcode and GPS Approaches",
    "Which System Fits Small Construction Contractors?",
  ],
  "/guides/how-to-keep-track-of-tools-and-equipment": [
    "Create a Complete Tool Inventory",
    "Give Every Tool a Unique ID or QR Code",
    "Record Who Takes Each Tool",
    "Track Trucks and Job Sites",
    "Require Returns",
    "Keep a Transaction History",
  ],
  "/guides/how-to-store-power-tools": [
    "How to Store Power Tools Safely",
    "Organize Tools in Trucks and Job Sites",
    "Physical Storage Is Only Half the Problem",
    "Digitally Track Who Has Each Tool",
  ],
  "/guides/asset-tracking-cost": [
    "Spreadsheet Tracking Cost",
    "QR Code Asset Tracking Cost",
    "Barcode Tracking Cost",
    "RFID Cost",
    "GPS Tracking Cost",
    "What Small Construction Crews Actually Need",
  ],
  "/guides/asset-tracking-technologies": [
    "QR Code Asset Tracking",
    "Barcode Asset Tracking",
    "RFID",
    "GPS",
    "Bluetooth",
    "Which Asset Tracking Technology Fits Construction Tools?",
  ],
  "/guides/tool-calibration-tracking": [
    "What Is Tool Calibration?",
    "How Often Should You Calibrate a Tool?",
    "Track Last Service and Next Due Date",
    "Keep Calibration and Maintenance History",
  ],
  "/guides/qr-code-vs-barcode-tool-tracking": [
    "How QR Tool Tracking Works",
    "How Barcode Tool Tracking Works",
    "QR vs Barcode: Hardware Requirements",
    "Which Works Better for Field Crews?",
    "Where TakeMoveReturn Fits",
  ],
  "/guides/cmms-vs-tool-tracking-software": [
    "What Is CMMS Software?",
    "What Is Tool Tracking Software?",
    "CMMS vs Tool Tracking: Feature Comparison",
    "When a Construction Crew Needs a Full CMMS",
    "When Tool Tracking Is Enough",
    "Can You Use Both Together?",
  ],
};

function arrayField(block, field) {
  const match = block.match(new RegExp(field + ': \\[([\\s\\S]*?)\\](?=, [a-zA-Z]|\\s*\\}\\),)'));
  return match ? [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]) : [];
}

for (const [path, title] of Object.entries(expectedTitles)) {
  const page = pageByPath.get(path);
  if (!page) continue;
  if (page.title !== title) failures.push(`Master Title mismatch: ${path} -> "${page.title}"`);
}

for (const [path, h1] of Object.entries(expectedH1)) {
  const page = pageByPath.get(path);
  if (!page) continue;
  if (page.h1 !== h1) failures.push(`Master H1 mismatch: ${path} -> "${page.h1}"`);
}

for (const [path, headings] of Object.entries(expectedHeadings)) {
  const page = pageByPath.get(path);
  if (!page) continue;
  const actual = arrayField(page.block, "headings");
  if (JSON.stringify(actual) !== JSON.stringify(headings)) {
    failures.push(`Master H2 map mismatch: ${path}`);
  }
}

const requiredSecondary = {
  "/": ["construction tool tracking software","tool tracking software","tool tracking","tool tracking system for construction","tools and equipment tracking","small tool tracking software","tool tracking app","construction tool tracking app"],
  "/construction-equipment-management-software": ["equipment management software","equipment management system","heavy equipment management software"],
  "/construction-equipment-tracking-software": ["equipment tracking","equipment tracker","equipment tracking system"],
  "/tool-management-software": ["tool management","tool management system","tool management systems","tool management solution","tool management tool"],
  "/tool-inventory-software": ["equipment inventory software","tool inventory","tool inventory management","tool inventory tracking system","tool inventory tracking","tools inventory","tool inventory app"],
  "/construction-asset-tracking-software": ["construction asset tracking","tool asset tracking","fixed asset tracking software"],
  "/asset-tagging-system": ["asset tag system","qr code tracking system","qr code tracking","qr tracking","barcode asset tracking"],
  "/equipment-checkout": ["tool checkout system","equipment checkout","tool checkout tracking","tool return tracking"],
  "/construction-equipment-maintenance-software": ["equipment maintenance tracking software","asset maintenance software","maintenance management software","work order tracking software"],
  "/blog/how-to-manage-construction-site-inventory": ["construction inventory management software","construction inventory software","construction inventory management system","inventory software for construction","inventory software for construction company","inventory management software for construction industry","inventory management software for construction","best construction inventory management software"],
  "/industries/plumbing-contractors": ["tool tracking tool for plumbers","tool management tool for plumbers","asset tracking tool for plumbers","plumbing inventory software"],
  "/industries/electrical-contractors": ["tool tracking tool for electricians"],
  "/industries/general-contractors": ["tool tracking software for general contractors"],
  "/industries/remodeling-contractors": ["tool tracking solution for renovations","tool tracking tool for renovations","tool tracking software for builders","tool tracking solution for builders","tool management solution for builders","tool tracking tool for builders"],
  "/industries/civil-engineering": ["tool tracking tool for civil engineers","tool tracking software for civil engineers","asset tracking software for civil engineers","asset tracking solution for civil engineers"],
  "/best/tool-tracking-software": ["best tool tracking system","best tool tracking platform for field crews","best tool tracking platforms for construction contractors"],
  "/guides/how-to-store-power-tools": ["storing power tools"],
  "/guides/asset-tracking-technologies": ["technology asset tracking","asset tracking technologies"],
  "/guides/tool-calibration-tracking": ["calibrate tool"],
  "/guides/qr-code-vs-barcode-tool-tracking": ["barcode tool tracking system","barcode asset tracking","qr code tracking system","qr code tracking","qr tracking"],
  "/guides/construction-management-software-vs-tool-tracking-software": ["project management software for construction"],
  "/guides/warehouse-management-software-vs-tool-tracking-software": ["warehouse management system software"],
};

for (const [path, keywords] of Object.entries(requiredSecondary)) {
  const page = pageByPath.get(path);
  if (!page) continue;
  const actual = new Set(arrayField(page.block, "secondaryKeywords"));
  for (const keyword of keywords) if (!actual.has(keyword)) failures.push(`Missing Master secondary keyword: "${keyword}" -> ${path}`);
}

const strictMetaPrimaryPaths = new Set([
  "/",
  "/construction-equipment-management-software",
  "/construction-equipment-tracking-software",
  "/tool-management-software",
  "/tool-inventory-software",
  "/construction-asset-tracking-software",
  "/asset-tagging-system",
  "/construction-equipment-maintenance-software",
  "/blog/how-to-manage-construction-site-inventory",
  "/industries/plumbing-contractors",
  "/industries/electrical-contractors",
  "/industries/general-contractors",
  "/industries/remodeling-contractors",
  "/industries/concrete-contractors",
  "/industries/civil-engineering",
  "/industries/restoration-contractors",
  "/best/tool-tracking-software",
  "/guides/how-to-keep-track-of-tools-and-equipment",
  "/guides/how-to-store-power-tools",
  "/guides/asset-tracking-cost",
  "/guides/asset-tracking-technologies",
  "/guides/tool-calibration-tracking",
  "/guides/cmms-vs-tool-tracking-software",
  "/guides/construction-management-software-vs-tool-tracking-software",
  "/guides/warehouse-management-software-vs-tool-tracking-software",
  "/guides/field-service-management-vs-tool-tracking-software",
]);

for (const path of strictMetaPrimaryPaths) {
  const page = pageByPath.get(path);
  if (!page?.primaryKeyword || !page.description) continue;
  if (!page.description.toLowerCase().includes(page.primaryKeyword.toLowerCase())) {
    failures.push(`Primary keyword missing from meta description: "${page.primaryKeyword}" -> ${path}`);
  }
}

const checkoutPage = pageByPath.get("/equipment-checkout");
if (!checkoutPage?.block.includes('primaryCandidate: "tool checkout system"')) {
  failures.push('Equipment checkout must keep "tool checkout system" as the explicit primary candidate until US validation.');
}

const staticRelatedPaths = new Set([
  "/features", "/pricing", "/help", "/help/contact", "/about", "/privacy", "/terms",
  "/dpa", "/subprocessors", "/business-information", "/signup", "/login",
]);
for (const page of pages) {
  for (const relatedPath of arrayField(page.block, "relatedPaths")) {
    if (!pageByPath.has(relatedPath) && !staticRelatedPaths.has(relatedPath)) {
      failures.push(`Broken related SEO link: ${page.path} -> ${relatedPath}`);
    }
  }
}

const masterHomeLinks = [
  "/construction-equipment-management-software",
  "/construction-equipment-tracking-software",
  "/tool-management-software",
  "/tool-inventory-software",
  "/construction-asset-tracking-software",
  "/asset-tagging-system",
  "/equipment-checkout",
  "/construction-equipment-maintenance-software",
  "/industries/plumbing-contractors",
  "/industries/electrical-contractors",
  "/industries/general-contractors",
];
const homeRelated = new Set(arrayField(pageByPath.get("/")?.block ?? "", "relatedPaths"));
for (const relatedPath of masterHomeLinks) {
  if (!homeRelated.has(relatedPath)) failures.push(`Homepage final internal-link structure missing: ${relatedPath}`);
}

const funnelLinks = {
  "/guides/cmms-vs-tool-tracking-software": ["/construction-equipment-maintenance-software", "/pricing"],
  "/guides/construction-management-software-vs-tool-tracking-software": ["/", "/pricing"],
  "/guides/warehouse-management-software-vs-tool-tracking-software": ["/tool-inventory-software", "/pricing"],
  "/guides/field-service-management-vs-tool-tracking-software": ["/", "/pricing"],
};
for (const [path, requiredLinks] of Object.entries(funnelLinks)) {
  const page = pageByPath.get(path);
  if (!page) continue;
  const related = new Set(arrayField(page.block, "relatedPaths"));
  for (const requiredLink of requiredLinks) if (!related.has(requiredLink)) failures.push(`Guide funnel link missing: ${path} -> ${requiredLink}`);
}

const unsupportedPositiveClaims = [
  "supports live gps",
  "real-time gps tracking",
  "built-in geofencing",
  "rfid tracking is included",
  "bluetooth beacon tracking is included",
];
const lowerSeo = seoSource.toLowerCase();
for (const claim of unsupportedPositiveClaims) if (lowerSeo.includes(claim)) failures.push(`Unsupported product claim detected: ${claim}`);

const indexableCount = pages.filter((page) => page.indexable).length;
const pendingCount = pages.filter((page) => !page.indexable).length;

console.log("TAKEMOVERETURN SEO DEPLOYMENT AUDIT");
console.log(`Routes: ${pages.length}`);
console.log(`Indexable: ${indexableCount}`);
console.log(`Noindex pending: ${pendingCount}`);
console.log(`Keyword registry: ${registryMatch ? "present" : "missing"}`);
console.log(`Canonical/route uniqueness: ${duplicatePaths.length ? "FAIL" : "PASS"}`);
console.log(`Primary keyword uniqueness: ${duplicatePrimary.length ? "FAIL" : "PASS"}`);
console.log(`Indexable cluster uniqueness: ${duplicateIndexableClusters.length ? "FAIL" : "PASS"}`);
console.log(`Index gate: ${sitemapSource.includes('page.status === "indexable" && !page.needsUSVerification') ? "PASS" : "FAIL"}`);
console.log(`Visible keyword checks: ${visibleChecks.length}`);

if (failures.length) {
  console.error("\nSEO audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("\nSEO deployment audit passed.");
