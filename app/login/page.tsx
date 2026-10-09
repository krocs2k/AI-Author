'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, getProviders } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, Chrome, Clock } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pendingApproval, setPendingApproval] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    // Check if Google provider is available
    getProviders().then((providers) => {
      if (providers?.google) {
        setGoogleEnabled(true);
      }
    });

    // Check for pending approval error from URL (Google SSO redirect)
    const urlError = searchParams.get('error');
    if (urlError === 'ACCOUNT_PENDING_APPROVAL') {
      setPendingApproval(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPendingApproval(false);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        if (result.error === 'ACCOUNT_PENDING_APPROVAL') {
          setPendingApproval(true);
        } else {
          setError('Invalid email or password');
        }
      } else {
        // Trigger the welcome splash on the dashboard after a successful login
        try {
          sessionStorage.setItem('aa_welcome', '1');
        } catch (e) {
          /* sessionStorage unavailable - splash will be skipped */
        }
        router.replace('/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard?welcome=1' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md surface-glass ring-gold">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-xl bg-teal-400/25" />
              <Image
                src="/icon-192.png"
                alt="AI Author"
                width={64}
                height={64}
                priority
                className="relative h-16 w-16 rounded-2xl shadow-gold"
              />
            </div>
          </div>
          <CardTitle className="font-display text-3xl font-bold text-gray-50">Welcome Back</CardTitle>
          <CardDescription className="font-serif text-base text-gray-400">Sign in to continue to AI Author</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {pendingApproval && (
              <div className="p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-300">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Account Pending Approval</span>
                </div>
                <p className="text-sm text-amber-200/80">
                  Your account is awaiting administrator approval. You will be able to sign in once an admin has approved your account.
                </p>
              </div>
            )}
            {error && !pendingApproval && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-gray-700/40 border-gray-600 text-white placeholder:text-gray-500"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-gray-700/40 border-gray-600 text-white placeholder:text-gray-500"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {googleEnabled && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-600/70" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-800 px-2 text-gray-400 tracking-wider">Or continue with</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                className="w-full"
              >
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-teal-400 hover:text-teal-300 font-medium">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
