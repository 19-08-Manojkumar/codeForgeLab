import Link from "next/link";
import AuthPageFrame from "../../auth-page-frame";
import { AuthIcon } from "../../auth-ui";
export const metadata = { title: "Check your sign-in link — CodeForge Lab", alternates: { canonical: "/auth/error" } };
export default function Page() {
  return <AuthPageFrame title="This link needs a fresh start" description="It may have expired or already been used. Your account and saved learning are still there." icon="mail"><div className="auth-recovery-note"><h2>What to do next</h2><p>Return to Login to sign in. If you need a new password reset link, select Forgot password.</p></div><Link className="primary-button account-submit" href="/">Back to learning<AuthIcon name="arrow" size={17}/></Link></AuthPageFrame>;
}
