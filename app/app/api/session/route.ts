
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await prisma.bookSession.create({
      data: {
        currentStep: 1,
        completedSteps: [],
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
    const clientOnlyFields = ['selectedSynopsisId', 'selectedTitleId', 'chapters'];
    
    // Filter out undefined/null values and client-only fields
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([key, value]) => {
        // Skip undefined, null values
        if (value === undefined || value === null) return false;
        // Skip client-only fields
        if (clientOnlyFields.includes(key)) return false;
        // Keep primitives and JSON-serializable values
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
