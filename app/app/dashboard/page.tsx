'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import AIAuthorWizard from '@/components/ai-author-wizard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DashboardPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><LoadingSpinner /></div>}>
      <AIAuthorWizard />
    </Suspense>
  );
}
