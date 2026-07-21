import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://ft-podcast-daily.vercel.app";
const DESCRIPTION =
  "Ton briefing quotidien Financial Times — l'essentiel de l'actualité économique en un épisode audio, généré chaque matin par IA.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FT Daily Podcast",
    template: "%s — FT Daily",
  },
  description: DESCRIPTION,
  applicationName: "FT Daily",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FT Daily",
  },
  openGraph: {
    type: "website",
    siteName: "FT Daily Podcast",
    title: "FT Daily Podcast",
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "fr_FR",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "FT Daily Podcast" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FT Daily Podcast",
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
