"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Tool = { id: string; name: string; asset_code: string; qr_token: string };

export function BatchLabels({ tools, siteUrl }: { tools: Tool[]; siteUrl: string }) {
  const [images, setImages] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>(() => tools.map((tool) => tool.id));
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function generate() {
      const next: Record<string, string> = {};
      try {
        for (let index = 0; index < tools.length; index += 20) {
          const batch = tools.slice(index, index + 20);
          const encoded = await Promise.all(batch.map(async (tool) => {
            const svg = await QRCode.toString(`${siteUrl}/q/${tool.qr_token}`, { type: "svg", errorCorrectionLevel: "M", margin: 1, width: 240 });
            return [tool.id, `data:image/svg+xml,${encodeURIComponent(svg)}`] as const;
          }));
          if (cancelled) return;
          Object.assign(next, Object.fromEntries(encoded));
          setImages({ ...next });
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }
    void generate();
    return () => { cancelled = true; };
  }, [tools, siteUrl]);

  const ready = tools.length > 0 && !error && Object.keys(images).length === tools.length;
  return <>
    <div className="batch-label-controls"><button type="button" onClick={() => setSelected(tools.map((tool) => tool.id))}>Select all</button><button type="button" onClick={() => setSelected([])}>Clear selection</button><span>{selected.length} selected · {Object.keys(images).length}/{tools.length} QR images ready</span><button type="button" disabled={!ready || selected.length === 0} onClick={() => window.print()}>Print / Save as PDF</button></div>
    {error && <p role="alert">Some QR images could not be generated. Reload before printing.</p>}
    {!tools.length && <p>No labels are available on this page.</p>}
    <div className="batch-label-sheet" aria-label="QR label preview">{tools.map((tool) => <label className={selected.includes(tool.id) ? "batch-label-item" : "batch-label-item batch-label-unselected"} key={tool.id}>
      <input type="checkbox" checked={selected.includes(tool.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, tool.id] : current.filter((id) => id !== tool.id))} aria-label={`Print label for ${tool.name}`} />
      {images[tool.id] ? <img src={images[tool.id]} width={120} height={120} alt="" /> : <span className="batch-label-loading">Preparing QR…</span>}
      <strong>{tool.name}</strong><small>{tool.asset_code}</small>
    </label>)}</div>
  </>;
}
