// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Trading Game - Bubble Experiment",
  description:
    "A classroom experiment on Market Efficiency and Bubbles. Trade dividend assets and analyze fundamental value.",
  keywords: ["bubbles", "market efficiency", "finance game", "economics", "trading simulation"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
