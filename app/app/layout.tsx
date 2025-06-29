
import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

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
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${lora.variable} antialiased bg-gray-900 text-gray-100`}>
        <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/75">
          <div className="container mx-auto flex h-16 items-center px-4">
            <div className="max-w-6xl mx-auto w-full flex items-center justify-center">
              <h1 className="text-2xl font-bold text-teal-400 font-[family-name:var(--font-inter)]">
                AI Author
              </h1>
            </div>
          </div>
        </header>
        
        <main className="flex-1">
          {children}
        </main>
        
        <footer className="border-t border-gray-800 bg-gray-900">
          <div className="container mx-auto px-4 py-6">
            <div className="max-w-6xl mx-auto text-center">
              <p className="text-sm text-gray-400">
                © 2025 AI Author. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
