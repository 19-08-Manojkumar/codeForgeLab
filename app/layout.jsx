import "./globals.css";
import "./practice.css";
import "./animation.css";
import "./atmosphere.css";
import "./learning.css";
import "./web.css";

export const metadata = {
  title: "MethodLab — See how code works",
  description: "Practice JavaScript, Python, Java, and C, and learn HTML and CSS with editable code, live browser previews, and visual explanations.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
