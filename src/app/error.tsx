"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("TakeMoveReturn route error", error);
  }, [error]);

  return <main className="marketing-page">
    <section className="not-found-page" role="alert">
      <p className="eyebrow">TEMPORARY ERROR</p>
      <h1>That action could not be completed.</h1>
      <p>Your data has not been intentionally changed by this error screen. Try the request again. If it keeps failing, return to the workspace or contact support.</p>
      <div className="hero-actions">
        <button className="button" type="button" onClick={reset}>Try again</button>
        <Link className="button button-quiet" href="/app/dashboard">Open workspace</Link>
      </div>
      {error.digest && <p className="microcopy">Reference: {error.digest}</p>}
    </section>
  </main>;
}
