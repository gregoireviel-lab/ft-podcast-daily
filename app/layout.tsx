import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://ft-podcast-daily.vercel.app";
const DESCRIPTION =
  "Ton briefing quotidien — l'essentiel de l'actualité économique en un épisode audio, généré chaque matin par IA.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kairos",
    template: "%s — Kairos",
  },
  description: DESCRIPTION,
  applicationName: "Kairos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kairos",
  },
  openGraph: {
    type: "website",
    siteName: "Kairos",
    title: "Kairos",
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "fr_FR",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Kairos" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kairos",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f11",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}
