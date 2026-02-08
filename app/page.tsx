'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Sparkles, PenTool, BarChart3 } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/75">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-teal-400" />
            <h1 className="text-2xl font-bold text-teal-400">AI Author</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-teal-500 hover:bg-teal-600 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/20 rounded-full text-teal-400 text-sm mb-6">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Book Creation</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Craft Your Next <span className="text-teal-400">Bestseller</span>
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Transform your ideas into compelling books with AI-powered writing assistance. 
            From synopsis to marketing materials, create everything you need for your next masterpiece.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white px-8">
                Start Writing Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="p-3 bg-purple-500/20 rounded-lg w-fit mb-4">
                <Sparkles className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">MojoSauce Analysis</h3>
              <p className="text-gray-400">
                Research and analyze bestselling books in your genre to understand what makes them successful.
              </p>
            </div>
            <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="p-3 bg-blue-500/20 rounded-lg w-fit mb-4">
                <PenTool className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">SecretSauce Writing</h3>
              <p className="text-gray-400">
                Generate humanized content that matches bestselling authors' styles with 94%+ quality scores.
              </p>
            </div>
            <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="p-3 bg-teal-500/20 rounded-lg w-fit mb-4">
                <BarChart3 className="h-6 w-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Success Prediction</h3>
              <p className="text-gray-400">
                Get success probability ratings for your content based on historical bestseller trends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} AI Author. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
