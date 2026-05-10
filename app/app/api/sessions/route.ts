import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get('folderId');
  const filter: any = { userId };
  if (folderId === 'null' || folderId === '') filter.folderId = null;
  else if (folderId) filter.folderId = folderId;

  const sessions = await prisma.bookSession.findMany({
    where: filter,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true, name: true, selectedTitle: true, customTitle: true, selectedGenre: true,
      currentStep: true, totalWordCount: true, folderId: true,
      createdAt: true, updatedAt: true,
    },
  });
  return NextResponse.json({ sessions });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name, folderId } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const owned = await prisma.bookSession.findFirst({ where: { id, userId } });
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (folderId) {
    const f = await prisma.folder.findFirst({ where: { id: folderId, userId } });
    if (!f) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }
  const data: any = {};
  if (typeof name === 'string') data.name = name.trim() || null;
  if (folderId !== undefined) data.folderId = folderId || null;
  const updated = await prisma.bookSession.update({ where: { id }, data });
  return NextResponse.json({ session: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const owned = await prisma.bookSession.findFirst({ where: { id, userId } });
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.bookSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
