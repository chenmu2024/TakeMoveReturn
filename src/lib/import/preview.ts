export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 5_000;

export type ImportMapping = { assetCode: number; name: number; category: number };
export type ImportIssue = { row: number; assetCode: string; name: string; category: string; reason: string };

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let closedQuote = false;
  const source = text.replace(/^\uFEFF/, "");
  const pushCell = () => { row.push(cell); cell = ""; closedQuote = false; };
  const pushRow = () => {
    pushCell();
    if (row.length > 100) throw new Error("The file has more than 100 columns.");
    rows.push(row);
    if (rows.length > MAX_IMPORT_ROWS + 1) throw new Error("The file has more than 5,000 data rows.");
    row = [];
  };
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') { quoted = false; closedQuote = true; }
      else cell += char;
    } else if (char === '"' && cell === "" && !closedQuote) {
      quoted = true;
    } else if (char === ",") {
      pushCell();
    } else if (char === "\r" || char === "\n") {
      pushRow();
      if (char === "\r" && source[index + 1] === "\n") index += 1;
    } else {
      if (closedQuote || char === '"') throw new Error("The CSV has malformed quotation marks.");
      cell += char;
    }
  }
  if (quoted) throw new Error("The CSV has an unfinished quoted value.");
  if (cell || row.length || closedQuote) pushRow();
  return rows;
}

export function cellText(value: unknown): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value == null ? "" : String(value);
}

export function firstHeaderRow(rows: readonly unknown[][]): number {
  return rows.findIndex((row) => row.some((value) => cellText(value).trim()));
}

export function suggestedMapping(headers: readonly string[]): ImportMapping {
  const normalized = headers.map((header) => header.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const find = (aliases: string[]) => normalized.findIndex((header) => aliases.includes(header));
  return {
    assetCode: find(["assetcode", "assetid", "toolcode", "toolnumber", "identifier"]),
    name: find(["name", "toolname", "equipmentname", "itemname"]),
    category: find(["category", "toolcategory", "type"]),
  };
}

export function reviewImport(rows: readonly unknown[][], mapping: ImportMapping) {
  const headerIndex = firstHeaderRow(rows);
  if (headerIndex < 0) throw new Error("The selected sheet is empty.");
  const headers = rows[headerIndex].map(cellText);
  if (mapping.assetCode < 0 || mapping.name < 0 || mapping.assetCode === mapping.name
    || mapping.assetCode >= headers.length || mapping.name >= headers.length
    || mapping.category >= headers.length || mapping.category === mapping.assetCode || mapping.category === mapping.name) {
    throw new Error("Map different columns for asset code and tool name.");
  }
  const data = rows.slice(headerIndex + 1).map((row, index) => ({ row, sourceRow: headerIndex + index + 2 }))
    .filter(({ row }) => row.some((value) => cellText(value).trim()));
  if (data.length > MAX_IMPORT_ROWS) throw new Error("The file has more than 5,000 data rows.");
  const seen = new Set<string>();
  const issues: ImportIssue[] = [];
  const preview: { row: number; assetCode: string; name: string; category: string; valid: boolean }[] = [];
  data.forEach(({ row, sourceRow }) => {
    const assetCode = cellText(row[mapping.assetCode]).trim();
    const name = cellText(row[mapping.name]).trim();
    const category = mapping.category < 0 ? "" : cellText(row[mapping.category]).trim();
    const reasons: string[] = [];
    if (!assetCode || assetCode.length > 80) reasons.push("Asset code must be 1–80 characters");
    if (name.length < 2 || name.length > 120) reasons.push("Tool name must be 2–120 characters");
    if (category.length > 80) reasons.push("Category must be 80 characters or fewer");
    if (assetCode && seen.has(assetCode)) reasons.push("Duplicate asset code in this file");
    if (assetCode) seen.add(assetCode);
    if (reasons.length) issues.push({ row: sourceRow, assetCode, name, category, reason: reasons.join("; ") });
    if (preview.length < 10) preview.push({ row: sourceRow, assetCode, name, category, valid: !reasons.length });
  });
  return { total: data.length, valid: data.length - issues.length, issues, preview };
}
