import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - list user's series
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const series = await prisma.series.findMany({
      where: { userId },
      include: {
        books: {
          select: { id: true, name: true, selectedTitle: true, customTitle: true, seriesOrder: true, coverImageUrl: true, currentStep: true },
          orderBy: { seriesOrder: 'asc' },
        },
        storyBible: { select: { id: true, updatedAt: true } },
        _count: { select: { books: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(series);
  } catch (error: any) {
    console.error('Series list error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - create a new series
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description, genre } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Series name required' }, { status: 400 });

    const series = await prisma.series.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        genre: genre || null,
        userId,
        bookOrder: [],
      },
    });

    // Auto-create an empty story bible
    await prisma.storyBible.create({
      data: { seriesId: series.id },
    });

    return NextResponse.json(series, { status: 201 });
  } catch (error: any) {
    console.error('Series create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - update series (rename, reorder books, add/remove books)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, name, description, genre, bookOrder, addBookId, removeBookId } = await req.json();
    if (!id) return NextResponse.json({ error: 'Series ID required' }, { status: 400 });

    // Verify ownership
    const existing = await prisma.series.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Series not found' }, { status: 404 });

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (genre !== undefined) data.genre = genre;
    if (bookOrder !== undefined) data.bookOrder = bookOrder;

    // Add a book to the series
    if (addBookId) {
      const book = await prisma.bookSession.findFirst({ where: { id: addBookId, userId } });
      if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

      const maxOrder = await prisma.bookSession.aggregate({
        where: { seriesId: id },
        _max: { seriesOrder: true },
      });
      const nextOrder = (maxOrder._max.seriesOrder || 0) + 1;

      await prisma.bookSession.update({
        where: { id: addBookId },
        data: { seriesId: id, seriesOrder: nextOrder },
      });
    }

    // Remove a book from the series
    if (removeBookId) {
      await prisma.bookSession.update({
        where: { id: removeBookId },
        data: { seriesId: null, seriesOrder: null },
      });
    }

    const updated = await prisma.series.update({
      where: { id },
      data,
      include: {
        books: {
          select: { id: true, name: true, selectedTitle: true, customTitle: true, seriesOrder: true, coverImageUrl: true, currentStep: true },
          orderBy: { seriesOrder: 'asc' },
        },
        _count: { select: { books: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Series update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - delete series (keeps books, just unlinks them)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Series ID required' }, { status: 400 });

    const existing = await prisma.series.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Series not found' }, { status: 404 });

    // Unlink books first
    await prisma.bookSession.updateMany({
      where: { seriesId: id },
      data: { seriesId: null, seriesOrder: null },
    });

    // Delete series (cascade deletes story bible)
    await prisma.series.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Series delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
