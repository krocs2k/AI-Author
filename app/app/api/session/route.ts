
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
    const { sessionId, chapters, ...updateData } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Filter out undefined/null values and ensure no relation fields are passed
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([key, value]) => {
        // Skip undefined, null values, and any nested objects that might be relations
        if (value === undefined || value === null) return false;
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
