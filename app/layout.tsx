import type { Metadata, Viewport } from "next";
import { Inter, Lora, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PWARegister } from "@/components/pwa-register";
import { themeBootScript } from "@/lib/themes";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "AI Author - Craft Your Next Bestseller",
  description: "Create compelling books with AI-powered writing assistance. Generate synopses, titles, chapters, and marketing materials for your next bestselling novel.",
  manifest: "/manifest.json",
  applicationName: "AI Author",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI Author",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon-32.png",
    apple: "/apple-touch-icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1510",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript() }} />
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AI Author" />
        <link rel="apple-touch-icon" href="/apple-touch-icon-180.png" />
      </head>
      <body className={`${inter.variable} ${lora.variable} ${playfair.variable} antialiased bg-gray-900 text-gray-100`}>
        <Providers>
          {children}
        </Providers>
        <PWARegister />
      </body>
    </html>
  );
}
