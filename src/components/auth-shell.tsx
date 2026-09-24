import Link from "next/link";
import { IconArrowRight, IconCheck, IconLock } from "@tabler/icons-react";

export type AuthVariant = "login" | "signup" | "forgot-password" | "callback";

const copy: Record<AuthVariant, { eyebrow: string; title: string; detail: string; submit: string }> = {
  login: { eyebrow: "SECURE WORKSPACE ACCESS", title: "Sign in to your workspace.", detail: "Use your company account to access tools, workers, locations, and the full TAKE, MOVE, RETURN history.", submit: "Sign in" },
  signup: { eyebrow: "START WITH 25 TOOLS", title: "Set up your first workspace.", detail: "Create a company workspace, invite an admin, and give your crew a clear way to account for reusable tools.", submit: "Create workspace" },
  "forgot-password": { eyebrow: "ACCOUNT RECOVERY", title: "Reset your password.", detail: "Enter the account email and the connected authentication service will send the next step.", submit: "Send reset link" },
  callback: { eyebrow: "AUTHENTICATION", title: "Completing sign-in.", detail: "The secure callback will return you to the correct workspace after authentication is connected.", submit: "Return to home" },
};

function AuthForm({ variant }: { variant: AuthVariant }) {
  const current = copy[variant];
  if (variant === "callback") return <div className="auth-callback-state"><div className="auth-spinner" aria-hidden="true" /><p>Waiting for the authentication provider response.</p><Link className="auth-secondary-link" href="/">Return home <IconArrowRight size={16} aria-hidden="true" /></Link></div>;
  return <div className="auth-form"><label htmlFor="auth-email">Work email</label><input id="auth-email" type="email" placeholder="you@company.com" disabled /><p className="auth-field-note">Enabled after Supabase Auth is connected.</p>{variant !== "forgot-password" && <><label htmlFor="auth-password">Password</label><input id="auth-password" type="password" placeholder="••••••••" disabled /></>}{variant === "signup" && <><label htmlFor="auth-company">Company name</label><input id="auth-company" type="text" placeholder="Your construction company" disabled /></>}<button className="auth-submit" type="button" disabled>{current.submit}<IconArrowRight size={17} aria-hidden="true" /></button>{variant === "login" && <Link className="auth-secondary-link" href="/auth/forgot-password">Forgot password? <IconArrowRight size={15} aria-hidden="true" /></Link>}{variant === "forgot-password" && <Link className="auth-secondary-link" href="/auth/login">Back to sign in <IconArrowRight size={15} aria-hidden="true" /></Link>}{variant === "signup" && <p className="auth-legal-note">By continuing, your workspace will use the configured privacy and data-processing terms.</p>}</div>;
}

export function AuthShell({ variant }: { variant: AuthVariant }) {
  const current = copy[variant];
  return <main className="auth-page"><section className="auth-brand-panel"><Link className="auth-brand" href="/"><strong>TakeMoveReturn</strong><span>Construction Tool Tracking Software</span></Link><div className="auth-brand-copy"><p className="eyebrow">TAKE. MOVE. RETURN.</p><h1>Know where every tool is before the next crew needs it.</h1><ul><li><IconCheck size={17} aria-hidden="true" />QR workflow from a phone browser</li><li><IconCheck size={17} aria-hidden="true" />Unlimited field workers across plans</li><li><IconCheck size={17} aria-hidden="true" />A durable history for every handoff</li></ul></div><p className="auth-brand-footer">Built for small construction crews.</p></section><section className="auth-card-panel"><div className="auth-card"><p className="eyebrow">{current.eyebrow}</p><h2>{current.title}</h2><p className="auth-detail">{current.detail}</p><div className="auth-connection-note"><IconLock size={17} aria-hidden="true" /><div><strong>Secure connection not configured</strong><span>This preview will not submit credentials or create records until Supabase Auth is connected.</span></div></div><AuthForm variant={variant} />{variant === "login" && <p className="auth-switch">New to TakeMoveReturn? <Link href="/auth/signup">Create a workspace</Link></p>}{variant === "signup" && <p className="auth-switch">Already have a workspace? <Link href="/auth/login">Sign in</Link></p>}</div></section></main>;
}
