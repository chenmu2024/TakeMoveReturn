import { withSupabase } from "npm:@supabase/server";

const ITERATIONS = 600_000;

function decode(value: unknown, length: number): Uint8Array | null {
  if (typeof value !== "string") return null;
  try {
    const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
    return bytes.length === length ? bytes : null;
  } catch {
    return null;
  }
}

export default {
  fetch: withSupabase({ auth: "secret" }, async (request: Request) => {
    if (request.method !== "POST") return new Response(null, { status: 405 });
    let body: { peppered?: unknown; salt?: unknown; iterations?: unknown };
    try {
      body = await request.json();
    } catch {
      return new Response(null, { status: 400 });
    }
    const peppered = decode(body?.peppered, 32);
    const salt = decode(body?.salt, 16);
    if (!peppered || !salt || body?.iterations !== ITERATIONS) return new Response(null, { status: 400 });
    const key = await crypto.subtle.importKey("raw", peppered as BufferSource, "PBKDF2", false, ["deriveBits"]);
    const derived = new Uint8Array(await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: ITERATIONS }, key, 256,
    ));
    return Response.json({ hash: btoa(String.fromCharCode(...derived)) });
  }),
};
