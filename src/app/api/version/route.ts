export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      service: "takemovereturn",
      commit: process.env.NEXT_PUBLIC_BUILD_SHA || "unknown",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );
}
