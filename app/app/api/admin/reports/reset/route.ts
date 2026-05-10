import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [logs, cache] = await Promise.all([
    prisma.lLMUsageLog.deleteMany({}),
    prisma.promptCache.deleteMany({}),
  ]);

  return NextResponse.json({
    ok: true,
    deletedLogs: logs.count,
    deletedCache: cache.count,
  });
}
