import "./globals.css";
import "./practice.css";
import "./animation.css";
import "./atmosphere.css";
import "./learning.css";
import "./web.css";
import "./related-learning.css";
import "./auth.css";
import "./coding-journey.css";
import "./home-overview.css";
import "./web-design.css";
import { siteBrand } from "../lib/site.mjs";

export const metadata = {
  metadataBase: new URL(siteBrand.url),
  title: siteBrand.title,
  applicationName: siteBrand.name,
  description: siteBrand.description,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: siteBrand.name, title: siteBrand.title, description: siteBrand.description, url: "/" },
  twitter: { card: "summary", title: siteBrand.title, description: siteBrand.description },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
