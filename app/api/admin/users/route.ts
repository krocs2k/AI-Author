import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Bulk delete multiple users by id
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No user IDs provided' }, { status: 400 });
    }

    // Never allow admins to remove their own account in a bulk operation
    const currentUserId = (session.user as any).id;
    const idsToDelete = ids.filter((id) => id !== currentUserId);

    if (idsToDelete.length === 0) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    const result = await prisma.user.deleteMany({
      where: { id: { in: idsToDelete } },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      skippedSelf: ids.length !== idsToDelete.length,
    });
  } catch (error) {
    console.error('Error deleting users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
