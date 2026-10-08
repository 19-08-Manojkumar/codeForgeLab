import Link from "next/link";
export const metadata = { title: "Check your sign-in link — CodeForge Lab", alternates: { canonical: "/auth/error" } };
export default function Page() {
  return <main className="auth-page"><Link className="brand-wordmark auth-brand" href="/">Code<strong>Forge</strong> Lab.</Link><section className="auth-card"><h1>We couldn't confirm this link</h1><p>It may have expired or already been used. Return to the home page to sign in or request a new password reset link.</p><Link className="primary-button" href="/">Back to learning</Link></section></main>;
}
