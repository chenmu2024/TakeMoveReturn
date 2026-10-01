import { siteConfig } from "../../config/site";

export function isTrustedWriteOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.NODE_ENV === "production"
    ? siteConfig.siteUrl
    : (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000");
  return origin === expected;
}
