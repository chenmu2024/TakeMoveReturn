export function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  const safe = /^[\s\uFEFF]*[=+\-@]/u.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function csvDocument(headers: readonly string[], rows: readonly unknown[][]): string {
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
