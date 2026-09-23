import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "../config/site";

export const metadata: Metadata = {
  title: siteConfig.descriptor + " | " + siteConfig.name,
  description: "QR-based construction tool tracking that shows who has every tool, where it is, and what happened to it.",
  metadataBase: new URL(siteConfig.siteUrl),
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
