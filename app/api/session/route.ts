import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);
    const rawUserId = (authSession?.user as any)?.id || null;

    // Guard against a stale/mismatched login token that references a user id
    // which no longer exists in this database (e.g. after the DB was recreated
    // or the admin account was regenerated). Using such an id as a foreign key
    // throws a P2003 constraint error -> 500. If the user cannot be found, fall
    // back to an anonymous session so the wizard never crashes.
    let userId: string | null = null;
    if (rawUserId) {
      const existing = await prisma.user.findUnique({ where: { id: rawUserId }, select: { id: true } });
      userId = existing ? existing.id : null;
    }

    let body: any = {};
    try { body = await request.json(); } catch {}
    const { name, folderId, seriesId } = body || {};

    // If adding to a series, auto-compute the next order
    let seriesOrder: number | null = null;
    if (seriesId) {
      const maxOrder = await prisma.bookSession.aggregate({
        where: { seriesId },
        _max: { seriesOrder: true },
      });
      seriesOrder = (maxOrder._max.seriesOrder || 0) + 1;
    }

    const session = await prisma.bookSession.create({
      data: {
        currentStep: 1,
        completedSteps: [],
        userId,
        name: name || null,
        folderId: folderId || null,
        seriesId: seriesId || null,
        seriesOrder,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const session = await prisma.bookSession.findUnique({
      where: { id: sessionId },
      include: { chapters: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { sessionId, chapters, selectedSynopsisId, selectedTitleId, ...updateData } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Fields that exist in client types but not in database schema
    const clientOnlyFields = ['selectedSynopsisId', 'selectedTitleId', 'chapters', 'characters', 'characterRecommendations', 'chapterRecommendations'];

    // Filter out undefined/null values and client-only fields
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([key, value]) => {
        if (value === undefined) return false;
        if (clientOnlyFields.includes(key)) return false;
        return true;
      })
    );

    const session = await prisma.bookSession.update({
      where: { id: sessionId },
      data: cleanedData,
      include: { chapters: true },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
