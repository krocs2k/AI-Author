import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function requireUserId() {
  const session = await getServerSession(authOptions);
  const id = (session?.user as any)?.id as string | undefined;
  return id || null;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const folders = await prisma.folder.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, parentId: true, createdAt: true, updatedAt: true,
              _count: { select: { sessions: true, children: true } } },
  });
  return NextResponse.json({ folders });
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, parentId } = await req.json();
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 });
  }
  if (parentId) {
    const parent = await prisma.folder.findFirst({ where: { id: parentId, userId } });
    if (!parent) return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 });
  }
  const folder = await prisma.folder.create({
    data: { name: name.trim(), userId, parentId: parentId || null },
  });
  return NextResponse.json({ folder });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, name, parentId } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const folder = await prisma.folder.findFirst({ where: { id, userId } });
  if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Prevent setting parent to self or a descendant (cycle prevention)
  if (parentId && parentId === id) {
    return NextResponse.json({ error: 'Cannot set folder as its own parent' }, { status: 400 });
  }
  // Walk up the prospective parent chain to ensure no cycle
  if (parentId) {
    let cursor: string | null = parentId;
    const seen = new Set<string>();
    while (cursor) {
      if (cursor === id) return NextResponse.json({ error: 'Cycle detected' }, { status: 400 });
      if (seen.has(cursor)) break;
      seen.add(cursor);
      const next: { parentId: string | null } | null = await prisma.folder.findFirst({
        where: { id: cursor, userId },
        select: { parentId: true },
      });
      cursor = next?.parentId || null;
    }
  }
  const data: any = {};
  if (typeof name === 'string' && name.trim()) data.name = name.trim();
  if (parentId !== undefined) data.parentId = parentId || null;
  const updated = await prisma.folder.update({ where: { id }, data });
  return NextResponse.json({ folder: updated });
}

export async function DELETE(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const folder = await prisma.folder.findFirst({ where: { id, userId } });
  if (!folder) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.folder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
