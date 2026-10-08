import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateStoryBibleForSeries } from '@/lib/story-bible';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// GET - fetch the story bible for a series
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify series ownership
    const series = await prisma.series.findFirst({
      where: { id: params.id, userId },
      include: {
        storyBible: true,
        books: {
          select: { id: true, name: true, selectedTitle: true, customTitle: true, seriesOrder: true },
          orderBy: { seriesOrder: 'asc' },
        },
      },
    });
    if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 });

    return NextResponse.json({
      series: { id: series.id, name: series.name, genre: series.genre },
      bible: series.storyBible || null,
      books: series.books,
    });
  } catch (error: any) {
    console.error('Story Bible GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - manually update story bible sections
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const series = await prisma.series.findFirst({ where: { id: params.id, userId } });
    if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 });

    const body = await req.json();
    const allowedFields = [
      'seriesOverview', 'characters', 'worldBuilding', 'plotArcs',
      'timeline', 'relationships', 'themes', 'voiceAndStyle',
      'visualGuide', 'coverImages', 'storylines', 'continuityNotes', 'nextBookSuggestions',
    ];

    const data: any = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    const bible = await prisma.storyBible.upsert({
      where: { seriesId: params.id },
      create: { seriesId: params.id, ...data },
      update: data,
    });

    return NextResponse.json(bible);
  } catch (error: any) {
    console.error('Story Bible PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - auto-generate / refresh story bible from book data using LLM
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify series ownership
    const series = await prisma.series.findFirst({ where: { id: params.id, userId } });
    if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 });

    const { bookId } = await req.json().catch(() => ({}));

    const bible = await generateStoryBibleForSeries({ seriesId: params.id, bookId });

    return NextResponse.json(bible);
  } catch (error: any) {
    console.error('Story Bible generation error:', error);
    const status = /not found|No books/i.test(error?.message || '') ? 400 : 500;
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status });
  }
}
