import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateStoryBibleForSeries } from '@/lib/story-bible';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const VALID_ROLES = [
  'protagonist', 'antagonist', 'supporting', 'minor',
  'mentor', 'love_interest', 'sidekick', 'foil',
];

function normalizeRole(role: any): string {
  const r = (role || '').toString().toLowerCase().replace(/[\s-]+/g, '_');
  return VALID_ROLES.includes(r) ? r : 'supporting';
}

function bookTitleOf(book: any): string {
  return book.selectedTitle || book.customTitle || book.name || 'Untitled';
}

/**
 * Map a Story Bible character entry to the wizard's Character shape,
 * marking it as a returning character and carrying over its ending
 * growth (arc), prior status and history so the sequel builds on it.
 */
function bibleCharToWizardChar(c: any): any {
  return {
    id: randomUUID(),
    name: c.name || 'Unnamed',
    role: normalizeRole(c.role),
    physicalDescription: c.physicalDesc || c.physicalDescription || '',
    personality: Array.isArray(c.personality) ? c.personality : (c.personality ? [c.personality] : []),
    backstory: c.backstory || '',
    motivation: c.motivation || '',
    arc: c.arc || '',
    relationships: Array.isArray(c.relationships) ? c.relationships : [],
    keyTraits: Array.isArray(c.keyTraits) ? c.keyTraits : [],
    flaws: Array.isArray(c.flaws) ? c.flaws : [],
    strengths: Array.isArray(c.strengths) ? c.strengths : [],
    voiceStyle: c.voiceStyle || c.voiceRef || undefined,
    // Sequel continuity metadata
    returning: true,
    priorArc: c.arc || '',
    priorStatus: c.status || 'active',
    visualRef: c.visualRef || undefined,
  };
}

// POST /api/series/sequel  { sourceBookId }
// Creates a new book that continues from an existing one, carrying over
// characters (with their ending growth), the world/universe and voice,
// while leaving room for new characters. Establishes/continues a series.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sourceBookId } = await req.json().catch(() => ({}));
    if (!sourceBookId) {
      return NextResponse.json({ error: 'sourceBookId required' }, { status: 400 });
    }

    // Ownership check on the source book
    const source = await prisma.bookSession.findFirst({
      where: { id: sourceBookId, userId },
    });
    if (!source) {
      return NextResponse.json({ error: 'Source book not found' }, { status: 404 });
    }

    const sourceTitle = bookTitleOf(source);

    // Resolve the series: reuse the source's series, or create a new one
    // with the source as Book 1.
    let seriesId = source.seriesId;
    if (!seriesId) {
      const newSeries = await prisma.series.create({
        data: {
          name: `${sourceTitle} Series`,
          genre: source.selectedGenre || undefined,
          userId,
          bookOrder: [source.id],
        },
      });
      seriesId = newSeries.id;
      // Ensure a StoryBible row exists for the series
      await prisma.storyBible.upsert({
        where: { seriesId },
        create: { seriesId },
        update: {},
      });
      // Link the source book as Book 1 of the new series
      await prisma.bookSession.update({
        where: { id: source.id },
        data: { seriesId, seriesOrder: 1 },
      });
    }

    // Generate / refresh the Story Bible from the source book so we capture
    // the world, characters and their ending state. Non-fatal on failure.
    let bibleWarning: string | undefined;
    let bible: any = null;
    try {
      bible = await generateStoryBibleForSeries({ seriesId: seriesId!, bookId: source.id });
    } catch (e: any) {
      console.warn('Sequel: story bible generation failed:', e?.message);
      bibleWarning = 'The story bible could not be auto-generated from the source book (it may have timed out). You can regenerate it later from the series view. Returning characters were loaded from available data.';
      // Fall back to any existing bible on the series
      bible = await prisma.storyBible.findUnique({ where: { seriesId: seriesId! } }).catch(() => null);
    }

    // Build the returning-character list. Prefer bible characters (richest,
    // includes arc + status); fall back to the source book's own characters.
    let returningChars: any[] = [];
    const bibleChars = (bible?.characters as any[]) || [];
    if (Array.isArray(bibleChars) && bibleChars.length > 0) {
      returningChars = bibleChars
        .filter((c: any) => (c?.status || 'active') !== 'deceased')
        .map(bibleCharToWizardChar);
    } else if (Array.isArray((source as any).characters)) {
      returningChars = ((source as any).characters as any[]).map((c: any) => ({
        ...c,
        id: c.id || randomUUID(),
        returning: true,
        priorArc: c.arc || '',
        priorStatus: c.status || 'active',
      }));
    }

    // Compute the next order position in the series
    const agg = await prisma.bookSession.aggregate({
      where: { seriesId: seriesId! },
      _max: { seriesOrder: true },
    });
    const nextOrder = (agg._max.seriesOrder || 0) + 1;

    // Create the new book, pre-seeded with returning characters + carried voice
    const newBook = await prisma.bookSession.create({
      data: {
        userId,
        seriesId: seriesId!,
        seriesOrder: nextOrder,
        name: `${sourceTitle} — Book ${nextOrder}`,
        selectedGenre: source.selectedGenre || undefined,
        selectedGenres: (source.selectedGenres as any) ?? undefined,
        genreAnalysis: (source.genreAnalysis as any) ?? undefined,
        authorAnalysis: (source.authorAnalysis as any) ?? undefined,
        characters: returningChars.length > 0 ? returningChars : undefined,
        currentStep: 1,
        completedSteps: [],
      },
    });

    return NextResponse.json({
      seriesId,
      sessionId: newBook.id,
      returningCharacterCount: returningChars.length,
      bibleWarning,
    });
  } catch (error: any) {
    console.error('Sequel creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create sequel' }, { status: 500 });
  }
}
