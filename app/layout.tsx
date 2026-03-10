import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CENTIPEDE — Neon Arcade",
  description:
    "A modern neon-themed Centipede arcade game built with Next.js 15, TypeScript, and Canvas.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "CENTIPEDE — Neon Arcade",
    description: "Classic arcade game reimagined with a neon aesthetic.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden antialiased">{children}</body>
    </html>
  );
}
