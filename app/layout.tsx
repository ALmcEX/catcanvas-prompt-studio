import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "CatCanvas — Prompt Studio",
    template: "%s · Prompt Studio",
  },
  description:
    "Create, inspect and run prompt chains in a private creative workspace.",
  robots: { index: false, follow: false },
};
const themeScript = `try{var t=localStorage.getItem('studio-theme');document.documentElement.dataset.theme=['light','dark','system'].includes(t)?t:'system'}catch(e){document.documentElement.dataset.theme='system'}`;
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
