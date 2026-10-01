"use client";

import { useEffect } from "react";
import { captureClientError } from "../components/telemetry";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("TakeMoveReturn global error", error);
    void captureClientError(error, { boundary: "global", digest: error.digest ?? "" });
  }, [error]);

  return <html lang="en"><body style={{ margin: 0, fontFamily: "Arial, Helvetica, sans-serif", background: "#fbfaf5", color: "#0b3027" }}>
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "15vh 24px 80px" }}>
      <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".14em", color: "#52645d" }}>SERVICE ERROR</p>
      <h1 style={{ fontSize: "clamp(2.4rem,7vw,5rem)", lineHeight: .95, letterSpacing: "-.06em", margin: "12px 0 20px" }}>TakeMoveReturn could not load this page.</h1>
      <p style={{ maxWidth: 620, color: "#52645d", lineHeight: 1.6 }}>Try again. If the problem continues, use support@takemovereturn.com and include the reference below when one is shown.</p>
      <button type="button" onClick={reset} style={{ marginTop: 18, padding: "12px 18px", borderRadius: 7, border: "1px solid #e8551f", background: "#e8551f", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Try again</button>
      {error.digest && <p style={{ marginTop: 18, color: "#7a8680", fontSize: 13 }}>Reference: {error.digest}</p>}
    </main>
  </body></html>;
}
