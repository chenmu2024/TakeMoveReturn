import type { Metadata } from "next";
import { AuthShell } from "../../../components/auth-shell";

export const metadata: Metadata = { title: "Completing Sign In | TakeMoveReturn", robots: { index: false, follow: false } };

export default function AuthCallbackPage() {
  return <AuthShell variant="callback" />;
}
