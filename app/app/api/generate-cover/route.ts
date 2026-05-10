import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/image-generator';
import { prisma } from '@/lib/db';
import { getActiveLLMConfig } from '@/lib/routellm/config-loader';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { sessionId, action, customPrompt } = await req.json();

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

    const title = session.selectedTitle || session.customTitle || 'Untitled';
    const genre = session.selectedGenre || 'fiction';
    const synopsis = session.selectedSynopsis || '';

    // Build a rich cover prompt from the book
    const chapterTitles = session.chapters?.map(c => c.title).filter(Boolean).join(', ') || '';

    if (action === 'generate') {
      const coverPrompt = customPrompt || buildCoverPrompt(title, genre, synopsis, chapterTitles);

      const config = await getActiveLLMConfig();
      const results = await generateImage(coverPrompt, {
        aspectRatio: '2:3',
        numImages: 2,
        model: config.imageModel || undefined,
      });

      return NextResponse.json({
        images: results.map(r => ({
          imageUrl: r.imageUrl,
          prompt: r.prompt,
          model: r.model,
        })),
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use action: "generate"' }, { status: 400 });
  } catch (error: any) {
    console.error('Cover generation error:', error);
    return NextResponse.json({ error: error.message || 'Cover generation failed' }, { status: 500 });
  }
}

// PATCH to save selected cover to the session
export async function PATCH(req: NextRequest) {
  try {
    const { sessionId, imageUrl, prompt, model } = await req.json();
    if (!sessionId || !imageUrl) {
      return NextResponse.json({ error: 'sessionId and imageUrl required' }, { status: 400 });
    }

    const updated = await prisma.bookSession.update({
      where: { id: sessionId },
      data: {
        coverImageUrl: imageUrl,
        coverImagePrompt: prompt || null,
        coverImageModel: model || null,
      },
    });

    // If this session belongs to a series, update the story bible's coverImages
    if (updated.seriesId) {
      try {
        const bible = await prisma.storyBible.findUnique({ where: { seriesId: updated.seriesId } });
        if (bible) {
          const existing: any[] = (bible.coverImages as any[]) || [];
          const idx = existing.findIndex((e: any) => e.bookId === sessionId);
          const entry = { bookId: sessionId, imageUrl, prompt, model, savedAt: new Date().toISOString() };
          if (idx >= 0) existing[idx] = entry; else existing.push(entry);
          await prisma.storyBible.update({
            where: { id: bible.id },
            data: { coverImages: existing },
          });
        }
      } catch (e) {
        console.warn('Failed to update story bible cover images:', e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Cover save error:', error);
    return NextResponse.json({ error: error.message || 'Save failed' }, { status: 500 });
  }
}

function buildCoverPrompt(title: string, genre: string, synopsis: string, chapterTitles: string): string {
  return `Create a professional, visually striking book cover for:

Title: "${title}"
Genre: ${genre}
Synopsis: ${synopsis.slice(0, 500)}
${chapterTitles ? `Key chapters: ${chapterTitles.slice(0, 200)}` : ''}

Requirements:
- Professional book cover design suitable for publication
- Genre-appropriate visual style and mood
- Bold, legible title text "${title}" prominently displayed
- Author name area at bottom
- Eye-catching composition that would appeal on bookstore shelves and online thumbnails
- Rich colors and dramatic lighting appropriate for ${genre}
- No placeholder text except the title`;
}
