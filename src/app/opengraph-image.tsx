import { ImageResponse } from "next/og";
import { siteConfig } from "../config/site";

export const alt = "TakeMoveReturn — QR construction tool tracking. Take. Move. Return.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: "100%", padding: 80, background: "#f8f7f2", color: "#0b332a" }}><div style={{ display: "flex", fontSize: 38, marginBottom: 40 }}>{siteConfig.name}</div><div style={{ display: "flex", fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>Know who has every tool.</div><div style={{ display: "flex", fontSize: 30, marginTop: 32 }}>QR construction tool tracking · Take. Move. Return.</div><div style={{ display: "flex", fontSize: 26, marginTop: 48, color: "#53675f" }}>{siteConfig.domain}</div></div>, size);
}
