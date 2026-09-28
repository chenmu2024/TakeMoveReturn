"use client";

import { useMemo, useRef, useState } from "react";
import { csvDocument } from "../lib/reports/csv";
import { cellText, firstHeaderRow, MAX_IMPORT_BYTES, MAX_IMPORT_ROWS, parseCsv, reviewImport, suggestedMapping, type ImportMapping } from "../lib/import/preview";
import "./import-preview.css";

type Sheet = { sheet: string; data: unknown[][] };
type WorkspaceCheck = { total: number; invalid: number; existing: number; availableSlots: number; candidates: number; withinCapacity: boolean; existingCodeExamples: string[] };

export function ImportPreview() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [fileName, setFileName] = useState("");
  const [sheetIndex, setSheetIndex] = useState(0);
  const [mapping, setMapping] = useState<ImportMapping>({ assetCode: -1, name: -1, category: -1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workspaceCheck, setWorkspaceCheck] = useState<WorkspaceCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const reviewVersion = useRef(0);
  const selected = sheets[sheetIndex];
  const headerIndex = selected ? firstHeaderRow(selected.data) : -1;
  const headers = headerIndex < 0 ? [] : selected.data[headerIndex].map(cellText);
  const result = useMemo(() => {
    if (!selected || mapping.assetCode < 0 || mapping.name < 0) return null;
    try { return { report: reviewImport(selected.data, mapping), error: "" }; }
    catch (cause) { return { report: null, error: cause instanceof Error ? cause.message : "This sheet could not be reviewed." }; }
  }, [selected, mapping]);

  function chooseSheet(next: number, source = sheets) {
    reviewVersion.current += 1; setWorkspaceCheck(null); setCheckError(""); setChecking(false);
    setSheetIndex(next);
    const index = firstHeaderRow(source[next].data);
    setMapping(suggestedMapping(index < 0 ? [] : source[next].data[index].map(cellText)));
  }

  async function chooseFile(file: File | undefined) {
    setSheets([]); setError(""); setFileName("");
    reviewVersion.current += 1; setWorkspaceCheck(null); setCheckError(""); setChecking(false);
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) { setError("Choose a file no larger than 10 MB."); return; }
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "csv" && extension !== "xlsx") { setError("Choose a .csv or .xlsx file."); return; }
    setLoading(true);
    try {
      let parsed: Sheet[];
      if (extension === "csv") parsed = [{ sheet: "CSV", data: parseCsv(await file.text()) }];
      else {
        const { default: readXlsxFile } = await import("read-excel-file/browser");
        parsed = (await readXlsxFile(file)).map(({ sheet, data }) => ({ sheet, data }));
      }
      if (!parsed.length || parsed.every(({ data }) => firstHeaderRow(data) < 0)) throw new Error("The file is empty.");
      const rowCount = parsed.reduce((count, { data }) => {
        const header = firstHeaderRow(data);
        return count + (header < 0 ? 0 : data.slice(header + 1).filter((row) => row.some((value) => cellText(value).trim())).length);
      }, 0);
      if (rowCount > MAX_IMPORT_ROWS) throw new Error("The file has more than 5,000 data rows across its sheets.");
      setSheets(parsed); setFileName(file.name); chooseSheet(0, parsed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The file could not be read.");
    } finally { setLoading(false); }
  }

  function downloadIssues() {
    if (!result?.report?.issues.length) return;
    const rows = result.report.issues.map((issue) => [issue.row, issue.assetCode, issue.name, issue.category, issue.reason]);
    const blob = new Blob([csvDocument(["Source row", "Asset code", "Tool name", "Category", "Issue"], rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "tool-import-review.csv"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  async function checkWorkspace() {
    if (!result?.report) return;
    const version = ++reviewVersion.current;
    setChecking(true); setCheckError(""); setWorkspaceCheck(null);
    try {
      const response = await fetch("/api/import/preflight", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: result.report.normalizedRows }),
      });
      if (!response.ok) throw new Error(response.status === 401 ? "Sign in again before checking the workspace."
        : response.status === 403 ? "A workspace manager with current terms acceptance must review the import."
          : "Workspace review is unavailable. Please try again.");
      const checked = await response.json() as WorkspaceCheck;
      if (reviewVersion.current === version) setWorkspaceCheck(checked);
    } catch (cause) { if (reviewVersion.current === version) setCheckError(cause instanceof Error ? cause.message : "Workspace review failed."); }
    finally { if (reviewVersion.current === version) setChecking(false); }
  }

  const selectColumn = (label: string, key: keyof ImportMapping, required: boolean) => <label key={key}>{label}<select value={mapping[key]} onChange={(event) => { reviewVersion.current += 1; setMapping({ ...mapping, [key]: Number(event.target.value) }); setWorkspaceCheck(null); setCheckError(""); setChecking(false); }}><option value={-1}>{required ? "Choose column" : "Not included"}</option>{headers.map((header, index) => <option key={index} value={index}>{header || `Column ${index + 1}`}</option>)}</select></label>;

  return <section className="import-review"><div className="import-review-intro"><p className="workspace-eyebrow">LOCAL FILE REVIEW</p><h2>Check your tool list before importing.</h2><p>Select a CSV or XLSX file up to 10 MB and 5,000 data rows. The selected sheet stays in this browser until you choose to check it against your workspace; that check sends mapped tool fields securely to the server but does not create tools.</p><label className="import-file-label">Choose CSV or XLSX<input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => void chooseFile(event.target.files?.[0])} /></label>{loading && <p role="status">Reading spreadsheet…</p>}{error && <p className="import-error" role="alert">{error}</p>}</div>{selected && <><div className="import-review-controls"><p><strong>{fileName}</strong> · {sheets.length} sheet{sheets.length === 1 ? "" : "s"}</p>{sheets.length > 1 && <label>Sheet<select value={sheetIndex} onChange={(event) => chooseSheet(Number(event.target.value))}>{sheets.map((sheet, index) => <option key={index} value={index}>{sheet.sheet}</option>)}</select></label>}<div className="import-mapping">{selectColumn("Asset code", "assetCode", true)}{selectColumn("Tool name", "name", true)}{selectColumn("Category", "category", false)}</div></div>{result?.error && <p className="import-error" role="alert">{result.error}</p>}{result?.report && <><div className="import-review-stats" role="status"><div><strong>{result.report.total}</strong><span>Data rows</span></div><div><strong>{result.report.valid}</strong><span>Valid in file</span></div><div><strong>{result.report.issues.length}</strong><span>Needs review</span></div></div><div className="import-review-table"><h3>First 10 rows</h3><div className="workspace-table-wrap"><table><thead><tr><th>Row</th><th>Asset code</th><th>Tool name</th><th>Category</th><th>Review</th></tr></thead><tbody>{result.report.preview.map((row) => <tr key={row.row}><td>{row.row}</td><td>{row.assetCode || "—"}</td><td>{row.name || "—"}</td><td>{row.category || "—"}</td><td>{row.valid ? "Valid" : "Needs review"}</td></tr>)}</tbody></table></div></div>{result.report.issues.length > 0 && <button className="workspace-button workspace-button-quiet" type="button" onClick={downloadIssues}>Download rows needing review</button>}<div className="import-pending"><button className="workspace-button workspace-button-quiet" type="button" disabled={checking} onClick={() => void checkWorkspace()}>{checking ? "Checking workspace…" : "Check company duplicates and capacity"}</button>{checkError && <p role="alert">{checkError}</p>}{workspaceCheck && <div role="status"><p>{workspaceCheck.candidates} new candidates · {workspaceCheck.existing} already in this company · {workspaceCheck.invalid} invalid rows · {workspaceCheck.availableSlots} active-tool slots available.</p>{!workspaceCheck.withinCapacity && <p>Only {workspaceCheck.availableSlots} of these candidates fit the current plan. Review the list before adding tools.</p>}{workspaceCheck.existingCodeExamples.length > 0 && <p>Existing asset codes include: {workspaceCheck.existingCodeExamples.join(", ")}</p>}</div>}</div></>}</>}<p className="import-pending">This is a read-only review. Batch import and tool creation are not connected yet; current capacity may change before an import is submitted.</p></section>;
}
