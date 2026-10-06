import "./globals.css";

export const metadata = {
  title: "MethodLab — See how code works",
  description: "Learn JavaScript and Python with editable examples, step-by-step animations, and quizzes that explain every answer.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
