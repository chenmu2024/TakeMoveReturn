export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { status: "ok", service: "takemovereturn" },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
