import type { Metadata } from "next";
import { DM_Sans, Montserrat } from "next/font/google";

import { QueryProvider } from "@/presentation/providers/query-provider";
import { brandAssets } from "@/shared/constants/brand";
import { siteConfig } from "@/shared/config/site";

import "./globals.css";

const fontHeading = Montserrat({
  variable: "--font-mks-heading",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const fontSans = DM_Sans({
  variable: "--font-mks-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  /** Favicon de marca: `public/brand/favicon.png` → `/brand/favicon.png` */
  icons: {
    icon: [{ url: brandAssets.favicon, type: "image/png" }],
    shortcut: brandAssets.favicon,
    apple: [{ url: brandAssets.favicon, sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fontSans.variable} ${fontHeading.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
