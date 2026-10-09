'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, Suspense } from 'react';
import AIAuthorWizard from '@/components/ai-author-wizard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { WelcomeSplash } from '@/components/welcome-splash';

function DashboardContent() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSplash, setShowSplash] = useState(false);
  // Ref guard survives React Strict Mode's double-invoked effect so the
  // one-shot welcome flag isn't consumed twice (which would hide the splash).
  const decidedRef = useRef(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  // Decide whether to show the welcome splash once, on arrival after login.
  useEffect(() => {
    if (decidedRef.current) return;
    if (status !== 'authenticated') return;
    decidedRef.current = true;

    let shouldShow = false;
    try {
      if (sessionStorage.getItem('aa_welcome') === '1') {
        shouldShow = true;
        sessionStorage.removeItem('aa_welcome');
      }
    } catch (e) {
      /* sessionStorage unavailable */
    }
    if (searchParams.get('welcome') === '1') {
      shouldShow = true;
      // Clean the query param from the URL without a reload
      router.replace('/dashboard');
    }

    if (shouldShow) {
      setShowSplash(true);
    }
  }, [status, searchParams, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      {showSplash && (
        <WelcomeSplash
          name={session.user?.name}
          duration={6000}
          onFinish={() => setShowSplash(false)}
        />
      )}
      <AIAuthorWizard />
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
