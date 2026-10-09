'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { BookOpen, Sparkles, PenTool, BarChart3, Feather } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Home() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800/70 bg-gray-950/70 backdrop-blur-xl">
        <div className="container mx-auto flex h-18 items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Image src="/icon-192.png" alt="AI Author" width={38} height={38} className="h-9 w-9 rounded-lg shadow-gold" />
            <h1 className="font-display text-2xl font-bold text-gold-gradient">AI Author</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 surface-glass ring-gold rounded-full text-teal-400 text-sm mb-8">
            <Sparkles className="h-4 w-4" />
            <span className="tracking-wide">AI-Powered Book Creation</span>
          </div>
          <h2 className="font-display text-5xl md:text-7xl font-bold text-gray-50 mb-8 leading-[1.05]">
            Craft Your Next <span className="text-gold-gradient italic">Bestseller</span>
          </h2>
          <p className="font-serif text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Transform your ideas into compelling books with AI-powered writing assistance &mdash;
            from synopsis to marketing materials, everything your next masterpiece deserves.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="px-8">
                <Feather className="mr-2 h-5 w-5" />
                Start Writing Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 pb-28">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="group p-8 surface-glass rounded-2xl border border-gray-700/50 shadow-card transition-all duration-300 hover:border-teal-400/30 hover:-translate-y-1">
              <div className="p-3 bg-teal-400/15 ring-gold rounded-xl w-fit mb-5">
                <Sparkles className="h-6 w-6 text-teal-400" />
              </div>
              <h3 className="font-display text-xl font-semibold text-gray-50 mb-3">MojoSauce Analysis</h3>
              <p className="text-gray-400 leading-relaxed">
                Research and analyze bestselling books in your genre to understand what makes them successful.
              </p>
            </div>
            <div className="group p-8 surface-glass rounded-2xl border border-gray-700/50 shadow-card transition-all duration-300 hover:border-teal-400/30 hover:-translate-y-1">
              <div className="p-3 bg-teal-400/15 ring-gold rounded-xl w-fit mb-5">
                <PenTool className="h-6 w-6 text-teal-400" />
              </div>
              <h3 className="font-display text-xl font-semibold text-gray-50 mb-3">SecretSauce Writing</h3>
              <p className="text-gray-400 leading-relaxed">
                Generate humanized content that matches bestselling authors' styles with 94%+ quality scores.
              </p>
            </div>
            <div className="group p-8 surface-glass rounded-2xl border border-gray-700/50 shadow-card transition-all duration-300 hover:border-teal-400/30 hover:-translate-y-1">
              <div className="p-3 bg-teal-400/15 ring-gold rounded-xl w-fit mb-5">
                <BarChart3 className="h-6 w-6 text-teal-400" />
              </div>
              <h3 className="font-display text-xl font-semibold text-gray-50 mb-3">Success Prediction</h3>
              <p className="text-gray-400 leading-relaxed">
                Get success probability ratings for your content based on historical bestseller trends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/70 bg-gray-950/40 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-teal-400" />
              <span className="font-display text-lg font-semibold text-gray-200">AI Author</span>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} AI Author. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
