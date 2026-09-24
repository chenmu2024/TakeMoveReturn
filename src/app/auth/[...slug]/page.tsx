import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthShell, type AuthVariant } from "../../../components/auth-shell";

const variants = new Set<AuthVariant>(["login", "signup", "forgot-password", "callback"]);

export default async function AuthPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const key = (await params).slug.join("/") as AuthVariant;
  if (!variants.has(key)) notFound();
  return <AuthShell variant={key} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const key = (await params).slug.join("/");
  return { title: `${key === "signup" ? "Create Workspace" : key === "forgot-password" ? "Reset Password" : "Sign In"} | TakeMoveReturn`, robots: { index: false, follow: false } };
}
