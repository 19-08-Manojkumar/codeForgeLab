import Link from "next/link";
import { AuthIcon } from "./auth-ui";

export default function AuthPageFrame({ title, description, icon = "lock", children }) {
  return <main className="auth-page">
    <Link className="auth-brand" href="/"><span className="auth-brand-mark"><AuthIcon name="code"/></span><span>Code<strong>Forge</strong> Lab<span className="brand-period">.</span></span></Link>
    <section className="auth-card" aria-labelledby="auth-page-title">
      <span className="auth-heading-icon"><AuthIcon name={icon} size={24}/></span>
      <span className="eyebrow">YOUR LEARNING ACCOUNT</span>
      <h1 id="auth-page-title">{title}</h1>
      {description && <p className="auth-description">{description}</p>}
      {children}
    </section>
    <Link className="auth-back-link" href="/"><AuthIcon name="back" size={16}/>Back to CodeForge Lab</Link>
  </main>;
}
