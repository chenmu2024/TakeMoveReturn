import Link from "next/link";
import { IconArrowRight, IconCheck, IconLock } from "@tabler/icons-react";
import { requestPasswordReset, signIn, signUp, updatePassword } from "../app/auth/actions";

export type AuthVariant = "login" | "signup" | "forgot-password" | "update-password";

const copy: Record<AuthVariant, { eyebrow: string; title: string; detail: string; submit: string }> = {
  login: { eyebrow: "SECURE WORKSPACE ACCESS", title: "Sign in to your workspace.", detail: "Use your company account to access tools, workers, locations, and the full TAKE, MOVE, RETURN history.", submit: "Sign in" },
  signup: { eyebrow: "START WITH 25 TOOLS", title: "Set up your first workspace.", detail: "Create your account, then verify your email to begin company setup.", submit: "Create account" },
  "forgot-password": { eyebrow: "ACCOUNT RECOVERY", title: "Reset your password.", detail: "Enter your account email and we will send a reset link if it exists.", submit: "Send reset link" },
  "update-password": { eyebrow: "ACCOUNT RECOVERY", title: "Choose a new password.", detail: "Use at least 12 characters for your new password.", submit: "Update password" },
};

const notices: Record<string, string> = {
  unavailable: "Sign-in is temporarily unavailable. Please try again later.",
  required: "Check the required fields. New passwords need at least 12 characters.",
  invalid: "Email or password not recognized. Check your details or reset your password.",
  "signup-error": "The account could not be created. Please try again.",
  "check-email": "Check your email for a verification link before signing in.",
  "reset-sent": "If an account exists for this email, a reset link is on its way.",
  "update-error": "The password could not be updated. Please request a new reset link.",
  "session-expired": "Your sign-in link has expired. Please sign in again.",
  "callback-error": "The sign-in link could not be verified. Please request a new one.",
};

function AuthForm({ variant }: { variant: AuthVariant }) {
  const current = copy[variant];
  const action = variant === "login" ? signIn : variant === "signup" ? signUp : variant === "forgot-password" ? requestPasswordReset : updatePassword;
  return <form className="auth-form" action={action}>
    {variant !== "update-password" && <><label htmlFor="auth-email">Work email</label><input id="auth-email" name="email" type="email" placeholder="you@company.com" required autoComplete="email" /></>}
    {variant !== "forgot-password" && <><label htmlFor="auth-password">{variant === "update-password" ? "New password" : "Password"}</label><input id="auth-password" name="password" type="password" placeholder="At least 12 characters" required minLength={variant === "login" ? undefined : 12} autoComplete={variant === "login" ? "current-password" : "new-password"} /></>}
    {variant === "signup" && <><label htmlFor="auth-company">Company name</label><input id="auth-company" name="company" type="text" placeholder="Your construction company" required minLength={2} maxLength={120} autoComplete="organization" /></>}
    <button className="auth-submit" type="submit">{current.submit}<IconArrowRight size={17} aria-hidden="true" /></button>
    {variant === "login" && <Link className="auth-secondary-link" href="/auth/forgot-password">Forgot password? <IconArrowRight size={15} aria-hidden="true" /></Link>}
    {variant === "forgot-password" && <Link className="auth-secondary-link" href="/auth/login">Back to sign in <IconArrowRight size={15} aria-hidden="true" /></Link>}
    {variant === "signup" && <p className="auth-legal-note">Your company record will be created after you verify your email and finish workspace setup.</p>}
  </form>;
}

export function AuthShell({ variant, notice, connected }: { variant: AuthVariant; notice?: string; connected: boolean }) {
  const current = copy[variant];
  return <main className="auth-page"><section className="auth-brand-panel"><Link className="auth-brand" href="/"><strong>TakeMoveReturn</strong><span>Construction Tool Tracking Software</span></Link><div className="auth-brand-copy"><p className="eyebrow">TAKE. MOVE. RETURN.</p><h1>Know where every tool is before the next crew needs it.</h1><ul><li><IconCheck size={17} aria-hidden="true" />QR workflow from a phone browser</li><li><IconCheck size={17} aria-hidden="true" />Unlimited field workers across plans</li><li><IconCheck size={17} aria-hidden="true" />A durable history for every handoff</li></ul></div><p className="auth-brand-footer">Built for small construction crews.</p></section><section className="auth-card-panel"><div className="auth-card"><p className="eyebrow">{current.eyebrow}</p><h2>{current.title}</h2><p className="auth-detail">{current.detail}</p>{!connected && <div className="auth-connection-note"><IconLock size={17} aria-hidden="true" /><div><strong>Account access is not open yet</strong><span>Registration and sign-in stay disabled until company data and security checks are complete.</span></div></div>}{notice && notices[notice] && <p className="auth-connection-note" role="status">{notices[notice]}</p>}{connected ? <AuthForm variant={variant} /> : <p className="auth-field-note">You can review the public site while account access is being prepared.</p>}{variant === "login" && <p className="auth-switch">New to TakeMoveReturn? <Link href="/auth/signup">Create an account</Link></p>}{variant === "signup" && <p className="auth-switch">Already have an account? <Link href="/auth/login">Sign in</Link></p>}</div></section></main>;
}
