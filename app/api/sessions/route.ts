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
  const owned = await prisma.bookSession.findFirst({
    where: { id, userId },
    select: { id: true, seriesId: true },
  });
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Delete the book itself. Chapters are removed automatically via the
  // onDelete: Cascade relation on Chapter.session.
  await prisma.bookSession.delete({ where: { id } });

  // If the book belonged to a series, strip every lingering reference to it
  // from the parent series so no orphaned pointers remain. These are stored in
  // JSON columns (no FK), so they are not cleaned up automatically.
  if (owned.seriesId) {
    try {
      const series = await prisma.series.findUnique({
        where: { id: owned.seriesId },
        include: { storyBible: true },
      });
      if (series) {
        // Remove the deleted book id from the reading order.
        if (Array.isArray(series.bookOrder)) {
          const newOrder = (series.bookOrder as any[]).filter((bid) => bid !== id);
          if (newOrder.length !== (series.bookOrder as any[]).length) {
            await prisma.series.update({
              where: { id: series.id },
              data: { bookOrder: newOrder },
            });
          }
        }

        // Strip per-book entries from the Story Bible JSON arrays.
        const bible = series.storyBible;
        if (bible) {
          const bibleData: any = {};
          const stripByBookId = (val: any) =>
            Array.isArray(val) ? val.filter((e: any) => e?.bookId !== id) : val;

          const newCoverImages = stripByBookId(bible.coverImages);
          if (newCoverImages !== bible.coverImages) bibleData.coverImages = newCoverImages;

          const newTimeline = stripByBookId(bible.timeline);
          if (newTimeline !== bible.timeline) bibleData.timeline = newTimeline;

          // plotArcs.perBook is a nested per-book array.
          if (bible.plotArcs && typeof bible.plotArcs === 'object' && !Array.isArray(bible.plotArcs)) {
            const pa: any = bible.plotArcs;
            if (Array.isArray(pa.perBook)) {
              const filtered = pa.perBook.filter((e: any) => e?.bookId !== id);
              if (filtered.length !== pa.perBook.length) {
                bibleData.plotArcs = { ...pa, perBook: filtered };
              }
            }
          }

          if (Object.keys(bibleData).length > 0) {
            await prisma.storyBible.update({ where: { id: bible.id }, data: bibleData });
          }
        }
      }
    } catch (e) {
      console.warn('Failed to clean up series references for deleted book:', e);
    }
  }

  return NextResponse.json({ ok: true });
}
