"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { csvDocument } from "../lib/reports/csv";
import { cellText, firstHeaderRow, MAX_IMPORT_BYTES, MAX_IMPORT_ROWS, parseCsv, reviewImport, suggestedMapping, type ImportMapping } from "../lib/import/preview";
import "./import-preview.css";

type Sheet = { sheet: string; data: unknown[][] };
type WorkspaceCheck = { total: number; invalid: number; existing: number; availableSlots: number; candidates: number; withinCapacity: boolean; existingCodeExamples: string[] };
type ImportJob = { id: string; filename?: string; total_rows: number; processed_rows: number; imported_rows: number; failed_rows: number; status: string; created_at?: string };

export function ImportPreview() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [mapping, setMapping] = useState<ImportMapping>({
    assetCode: -1, name: -1, category: -1, brand: -1, model: -1, serialNumber: -1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workspaceCheck, setWorkspaceCheck] = useState<WorkspaceCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [jobId, setJobId] = useState("");
  const [job, setJob] = useState<ImportJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<ImportJob[]>([]);
  const [jobError, setJobError] = useState("");
  const [starting, setStarting] = useState(false);
  const [queued, setQueued] = useState(true);
  const reviewVersion = useRef(0);
  const selected = sheets[sheetIndex];
  const headerIndex = selected ? firstHeaderRow(selected.data) : -1;
  const headers = headerIndex < 0 ? [] : selected.data[headerIndex].map(cellText);
  const result = useMemo(() => {
    if (!selected || mapping.assetCode < 0 || mapping.name < 0) return null;
    try { return { report: reviewImport(selected.data, mapping), error: "" }; }
    catch (cause) { return { report: null, error: cause instanceof Error ? cause.message : "This sheet could not be reviewed." }; }
  }, [selected, mapping]);

  useEffect(() => {
    let active = true;
    void fetch("/api/import/jobs", { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<ImportJob[]> : [])
      .then((items) => { if (active) setRecentJobs(items); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!jobId || job?.status === "completed") return;
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch(`/api/import/jobs/${jobId}`, { credentials: "same-origin", cache: "no-store" });
        if (!response.ok) throw new Error("Import progress is unavailable. Refresh this page and check again.");
        const current = await response.json() as ImportJob;
        if (active) { setJob(current); setJobError(""); }
      } catch (cause) {
        if (active) setJobError(cause instanceof Error ? cause.message : "Import progress is unavailable.");
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 3_000);
    return () => { active = false; clearInterval(timer); };
  }, [jobId, job?.status]);

  function chooseSheet(next: number, source = sheets) {
    reviewVersion.current += 1; setWorkspaceCheck(null); setCheckError(""); setChecking(false);
    setJobId(""); setJob(null); setJobError("");
    setSheetIndex(next);
    const index = firstHeaderRow(source[next].data);
    setMapping(suggestedMapping(index < 0 ? [] : source[next].data[index].map(cellText)));
  }

  async function chooseFile(file: File | undefined) {
    setSheets([]); setError(""); setFileName(""); setFileSize(0);
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
      setSheets(parsed); setFileName(file.name); setFileSize(file.size); chooseSheet(0, parsed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The file could not be read.");
    } finally { setLoading(false); }
  }

  function downloadIssues() {
    if (!result?.report?.issues.length) return;
    const rows = result.report.issues.map((issue) => [
      issue.row, issue.assetCode, issue.name, issue.category, issue.brand, issue.model, issue.serialNumber, issue.reason,
    ]);
    const blob = new Blob([csvDocument(
      ["Source row", "Asset code", "Tool name", "Category", "Brand", "Model", "Serial number", "Issue"],
      rows,
    )], { type: "text/csv;charset=utf-8" });
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

  async function startImport() {
    if (!result?.report || !workspaceCheck || !fileName || !fileSize) return;
    setStarting(true); setJobError("");
    try {
      const response = await fetch("/api/import/jobs", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: fileName, fileSize, rows: result.report.normalizedRows }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(response.status === 409 ? `${detail} Recheck your workspace and file before trying again.`
          : response.status === 422 ? "Fix invalid rows in the file before importing."
            : "Import could not start. Please try again.");
      }
      const started = await response.json() as { id: string; queued: boolean };
      setJobId(started.id); setQueued(started.queued); setWorkspaceCheck(null);
      setRecentJobs((items) => [{ id: started.id, filename: fileName, total_rows: result.report!.total, processed_rows: 0, imported_rows: 0, failed_rows: 0, status: "queued" }, ...items].slice(0, 10));
    } catch (cause) { setJobError(cause instanceof Error ? cause.message : "Import could not start."); }
    finally { setStarting(false); }
  }

  async function retryDispatch() {
    if (!jobId) return;
    setStarting(true); setJobError("");
    try {
      const response = await fetch(`/api/import/jobs/${jobId}`, { method: "POST", credentials: "same-origin" });
      if (!response.ok) throw new Error("The import queue is unavailable. Please try again later.");
      setQueued(true);
    } catch (cause) { setJobError(cause instanceof Error ? cause.message : "The import queue is unavailable."); }
    finally { setStarting(false); }
  }

  const selectColumn = (label: string, key: keyof ImportMapping, required: boolean) => <label key={key}>{label}<select value={mapping[key]} onChange={(event) => { reviewVersion.current += 1; setMapping({ ...mapping, [key]: Number(event.target.value) }); setWorkspaceCheck(null); setCheckError(""); setChecking(false); setJobId(""); setJob(null); }}><option value={-1}>{required ? "Choose column" : "Not included"}</option>{headers.map((header, index) => <option key={index} value={index}>{header || `Column ${index + 1}`}</option>)}</select></label>;

  return <section className="import-review">
    <div className="import-review-intro">
      <p className="workspace-eyebrow">SPREADSHEET IMPORT</p>
      <h2>Check your tool list before importing.</h2>
      <p>Select a CSV or XLSX file up to 10 MB and 5,000 data rows. The selected sheet stays in this browser until you check it against your workspace or start an import. Only mapped tool fields are sent to the server.</p>
      <label className="import-file-label">Choose CSV or XLSX<input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => void chooseFile(event.target.files?.[0])} /></label>
      {loading && <p role="status">Reading spreadsheet…</p>}
      {error && <p className="import-error" role="alert">{error}</p>}
    </div>
    {selected && <>
      <div className="import-review-controls">
        <p><strong>{fileName}</strong> · {sheets.length} sheet{sheets.length === 1 ? "" : "s"}</p>
        {sheets.length > 1 && <label>Sheet<select value={sheetIndex} onChange={(event) => chooseSheet(Number(event.target.value))}>{sheets.map((sheet, index) => <option key={index} value={index}>{sheet.sheet}</option>)}</select></label>}
        <div className="import-mapping">{selectColumn("Asset code", "assetCode", true)}{selectColumn("Tool name", "name", true)}{selectColumn("Category", "category", false)}{selectColumn("Brand", "brand", false)}{selectColumn("Model", "model", false)}{selectColumn("Serial number", "serialNumber", false)}</div>
      </div>
      {result?.error && <p className="import-error" role="alert">{result.error}</p>}
      {result?.report && <>
        <div className="import-review-stats" role="status">
          <div><strong>{result.report.total}</strong><span>Data rows</span></div>
          <div><strong>{result.report.valid}</strong><span>Valid in file</span></div>
          <div><strong>{result.report.issues.length}</strong><span>Needs review</span></div>
        </div>
        <div className="import-review-table"><h3>First 10 rows</h3><div className="workspace-table-wrap"><table><thead><tr><th>Row</th><th>Asset code</th><th>Tool name</th><th>Category</th><th>Brand</th><th>Model</th><th>Serial</th><th>Review</th></tr></thead><tbody>{result.report.preview.map((row) => <tr key={row.row}><td>{row.row}</td><td>{row.assetCode || "—"}</td><td>{row.name || "—"}</td><td>{row.category || "—"}</td><td>{row.brand || "—"}</td><td>{row.model || "—"}</td><td>{row.serialNumber || "—"}</td><td>{row.valid ? "Valid" : "Needs review"}</td></tr>)}</tbody></table></div></div>
        {result.report.issues.length > 0 && <button className="workspace-button workspace-button-quiet" type="button" onClick={downloadIssues}>Download rows needing review</button>}
        <div className="import-pending">
          <button className="workspace-button workspace-button-quiet" type="button" disabled={checking || starting || Boolean(jobId)} onClick={() => void checkWorkspace()}>{checking ? "Checking workspace…" : "Check company duplicates and capacity"}</button>
          {checkError && <p role="alert">{checkError}</p>}
          {workspaceCheck && <div role="status">
            <p>{workspaceCheck.candidates} new candidates · {workspaceCheck.existing} already in this company · {workspaceCheck.invalid} invalid rows · {workspaceCheck.availableSlots} active-tool slots available.</p>
            {!workspaceCheck.withinCapacity && <p>Only {workspaceCheck.availableSlots} of these candidates fit the current plan.</p>}
            {workspaceCheck.existingCodeExamples.length > 0 && <p>Existing asset codes include: {workspaceCheck.existingCodeExamples.join(", ")}</p>}
          </div>}
          {workspaceCheck && !jobId && <button className="workspace-button" type="button" disabled={starting || checking || result.report.issues.length > 0 || workspaceCheck.invalid > 0 || workspaceCheck.existing > 0 || !workspaceCheck.withinCapacity || workspaceCheck.candidates < 1} onClick={() => void startImport()}>{starting ? "Starting import…" : `Import ${workspaceCheck.candidates} tools`}</button>}
          <p>Import requires every selected row to be valid, unique and within your current plan. Capacity is checked again when you submit.</p>
        </div>
      </>}
    </>}
    {jobId && <div className="import-pending" role="status">
      <h3>Import progress</h3>
      <p>Job {jobId} · {job ? `${job.processed_rows} / ${job.total_rows} processed · ${job.imported_rows} imported · ${job.failed_rows} failed` : "Waiting for progress…"}</p>
      {job?.status === "completed" ? <><p>{job.imported_rows} tools imported successfully.{job.failed_rows > 0 && <> <a href={`/api/import/jobs/${jobId}?format=csv`}>Download error rows</a></>}</p>{job.imported_rows > 0 && <a className="workspace-button" href={`/app/tools/labels?job=${jobId}`}>Generate {job.imported_rows} QR labels</a>}</> : <>{!queued && <p>The job was saved, but the queue is unavailable. No tools will be added until dispatch succeeds.</p>}<p>Processing continues in the background. You can reopen this job from Recent imports.</p><button className="workspace-button workspace-button-quiet" type="button" disabled={starting} onClick={() => void retryDispatch()}>Retry pending batches</button></>}
    </div>}
    {jobError && <p className="import-error" role="alert">{jobError}</p>}
    {recentJobs.length > 0 && <div className="import-review-table"><h3>Recent imports</h3><ul>{recentJobs.map((item) => <li key={item.id}><button className="workspace-button workspace-button-quiet" type="button" onClick={() => { setJobId(item.id); setJob(item); setQueued(true); setJobError(""); }}>{item.filename || "Import"} · {item.imported_rows}/{item.total_rows} imported · {item.status}</button></li>)}</ul></div>}
  </section>;
}
