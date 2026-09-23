import { notFound } from "next/navigation";

const copy: Record<string, { title: string; detail: string }> = {
  login: { title: "Sign in to TakeMoveReturn", detail: "Secure workspace sign-in will be enabled when Supabase Auth is connected." },
  signup: { title: "Start tracking tools", detail: "Create a workspace, invite an admin, and begin with 25 free active tools once Supabase Auth is configured." },
  "forgot-password": { title: "Reset your password", detail: "Password reset is unavailable until the secure authentication provider is configured." },
  callback: { title: "Completing sign-in", detail: "Authentication callback handling is waiting for Supabase credentials." },
};

export default async function AuthPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const page = copy[(await params).slug.join("/")];
  if (!page) notFound();
  return <main><p>TAKEMOVERETURN</p><h1>{page.title}</h1><p>{page.detail}</p><p><strong>BLOCKED_BY_EXTERNAL_CREDENTIALS:</strong> NEXT_PUBLIC_SUPABASE_URL and Supabase Auth keys.</p><a href="/">Return home</a></main>;
}
