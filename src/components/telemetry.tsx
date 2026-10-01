"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
const posthogHost = (process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com").replace(/\/$/, "");
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

function anonymousId() {
  const key = "tmr_telemetry_id";
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const value = crypto.randomUUID();
    sessionStorage.setItem(key, value);
    return value;
  } catch {
    return crypto.randomUUID();
  }
}

export async function captureProductEvent(event: string, properties: Record<string, unknown> = {}) {
  if (gaId && window.gtag) window.gtag("event", event, properties);
  if (posthogKey) {
    await fetch(`${posthogHost}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: posthogKey,
        distinct_id: anonymousId(),
        event,
        properties: {
          ...properties,
          $process_person_profile: false,
          $current_url: location.href,
          $pathname: location.pathname,
        },
      }),
      keepalive: true,
    }).catch(() => undefined);
  }
}

function sentryEndpoint(dsn: string) {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\/+|\/+$/g, "");
    if (!projectId || !url.username) return null;
    return {
      endpoint: `${url.protocol}//${url.host}/api/${projectId}/envelope/`,
      publicKey: url.username,
    };
  } catch {
    return null;
  }
}

export async function captureClientError(error: unknown, context: Record<string, unknown> = {}) {
  if (!sentryDsn) return;
  const target = sentryEndpoint(sentryDsn);
  if (!target) return;

  const value = error instanceof Error ? error.message : String(error);
  const type = error instanceof Error ? error.name : "Error";
  const eventId = crypto.randomUUID().replaceAll("-", "");
  const envelopeHeader = JSON.stringify({ event_id: eventId, dsn: sentryDsn, sent_at: new Date().toISOString() });
  const itemHeader = JSON.stringify({ type: "event" });
  const payload = JSON.stringify({
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "javascript",
    level: "error",
    environment: process.env.NODE_ENV,
    exception: { values: [{ type, value }] },
    request: { url: location.origin + location.pathname },
    tags: { surface: "web", ...Object.fromEntries(Object.entries(context).filter(([, v]) => typeof v === "string" || typeof v === "number" || typeof v === "boolean")) },
  });

  await fetch(target.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-sentry-envelope",
      "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${target.publicKey}, sentry_client=takemovereturn-web/1.0`,
    },
    body: `${envelopeHeader}\n${itemHeader}\n${payload}`,
    keepalive: true,
  }).catch(() => undefined);
}

export function Telemetry() {
  const pathname = usePathname();

  useEffect(() => {
    if (gaId && window.gtag) window.gtag("config", gaId, { page_path: pathname });
    void captureProductEvent("$pageview", { path: pathname });
  }, [pathname]);

  return <>
    {gaId && <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="tmr-ga" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', '${gaId}', { send_page_view: false });
      `}</Script>
    </>}
  </>;
}
