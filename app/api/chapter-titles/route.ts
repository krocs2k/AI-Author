export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateChapterTitle } from '@/lib/chapter-title';
import { isPlaceholderChapterTitle } from '@/lib/export-clean';

interface InChapter { chapterNumber: number; title?: string | null; content?: string | null }

// Fills in real names for chapters whose title is missing or just "Chapter N".
// Returns { titles: { [chapterNumber]: title } } for the chapters it named.
export async function POST(req: NextRequest) {
  const auth = await getServerSession(authOptions);
  if (!auth?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const chapters: InChapter[] = Array.isArray(body?.chapters) ? body.chapters : [];
    const sessionId: string | undefined = typeof body?.sessionId === 'string' ? body.sessionId : undefined;
    const todo = chapters.filter(
      (c) => Number.isFinite(c?.chapterNumber) && (c.content || '').trim() && isPlaceholderChapterTitle(c.title, c.chapterNumber)
    );

    const titles: Record<number, string> = {};
    const CONCURRENCY = 4;
    for (let i = 0; i < todo.length; i += CONCURRENCY) {
      const batch = todo.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map((c) =>
          generateChapterTitle({ bookTitle: body?.bookTitle, genre: body?.genre, chapterNumber: c.chapterNumber, content: c.content || '' })
        )
      );
      batch.forEach((c, idx) => { if (results[idx]) titles[c.chapterNumber] = results[idx] as string; });
    }

    if (sessionId && Object.keys(titles).length) {
      for (const [n, title] of Object.entries(titles)) {
        try {
          await prisma.chapter.updateMany({ where: { sessionId, chapterNumber: Number(n) }, data: { title } });
        } catch (e) {
          console.error('Chapter title save failed:', e);
        }
      }
    }

    return NextResponse.json({ titles });
  } catch (error) {
    console.error('chapter-titles error:', error);
    return NextResponse.json({ error: 'Failed to name chapters' }, { status: 500 });
  }
}
