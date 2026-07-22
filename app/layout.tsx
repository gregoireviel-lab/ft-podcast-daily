import type { Metadata, Viewport } from "next";
import "./globals.css";
import Analytics from "@/components/Analytics";
import Pwa from "@/components/Pwa";

const SITE_URL = "https://ft-podcast-daily.vercel.app";
const DESCRIPTION =
  "Your daily essential financial briefing — the world's most important financial news, condensed into a short daily audio episode powered by AI.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Essential",
    template: "%s — The Essential",
  },
  description: DESCRIPTION,
  applicationName: "The Essential",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "The Essential",
  },
  openGraph: {
    type: "website",
    siteName: "The Essential",
    title: "The Essential",
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Essential",
    description: DESCRIPTION,
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
    <html lang="en" className="h-full">
      <body className="min-h-full bg-bg text-fg antialiased">
        {children}
        <Pwa />
        <Analytics />
      </body>
    </html>
  );
}
