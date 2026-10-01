import Link from "next/link";

export type ServiceParams = { notice?: string; toolQuery?: string | string[]; toolPage?: string | string[]; page?: string | string[]; schedulePage?: string | string[] };

export function servicePage(value?: string | string[]) {
  return typeof value === "string" && /^[1-9]\d{0,3}$/.test(value) ? Number(value) : 1;
}

export function ServicePages({ params, parameter, page, count, label }: { params: ServiceParams; parameter: string; page: number; count: number; label: string }) {
  const pages = Math.max(1, Math.ceil(count / 50));
  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (typeof value === "string" && value && key !== "notice") query.set(key, value);
    query.set(parameter, String(target));
    return `?${query}`;
  };
  return <nav className="service-pages" aria-label={label}>
    <span>{count.toLocaleString("en-US")} {count === 1 ? "record" : "records"} · page {page} of {pages}</span>
    <div>{page > 1 && <Link href={href(page - 1)}>Previous</Link>}{page < pages && <Link href={href(page + 1)}>Next</Link>}</div>
  </nav>;
}
