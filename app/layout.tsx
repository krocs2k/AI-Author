import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const lora = Lora({ 
  subsets: ["latin"],
  variable: "--font-lora",
});

export const metadata: Metadata = {
  title: "AI Author - Craft Your Next Bestseller",
  description: "Create compelling books with AI-powered writing assistance. Generate synopses, titles, chapters, and marketing materials for your next bestselling novel.",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentYear = new Date().getFullYear();
  
  return (
    <html lang="en" className="dark">
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
      </head>
      <body className={`${inter.variable} ${lora.variable} antialiased bg-gray-900 text-gray-100`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
