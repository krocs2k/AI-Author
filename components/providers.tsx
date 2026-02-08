'use client';

import { SessionProvider } from 'next-auth/react';
import { useState, useEffect, ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SessionProvider>
      {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
    </SessionProvider>
  );
}
