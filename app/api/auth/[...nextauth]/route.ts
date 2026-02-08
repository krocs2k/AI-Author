import NextAuth from 'next-auth';
import { createAuthOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest, context: { params: { nextauth: string[] } }) {
  const authOptions = await createAuthOptions();
  return NextAuth(req as any, context as any, authOptions);
}

export { handler as GET, handler as POST };
