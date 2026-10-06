import "./globals.css";
import "./practice.css";
import "./animation.css";

export const metadata = {
  title: "MethodLab — See how code works",
  description: "Practice JavaScript, Python, Java, and C with methods, programming basics, interview questions, and guided coding problems.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
