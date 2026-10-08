import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/image-generator';
import { prisma } from '@/lib/db';
import { getActiveLLMConfig } from '@/lib/routellm/config-loader';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { sessionId, action, customPrompt, coverType, authorName, publishingInfo } = await req.json();

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
    // Prefer values passed in the request (latest UI state) and fall back to what
    // is stored on the session so cover text stays correct on regenerate/restore.
    const author = (authorName ?? session.authorName ?? '').toString().trim();
    const publishing = (publishingInfo ?? session.publishingInfo ?? '').toString().trim();
    const blurb = (session.backCoverCopy || session.salesCopy || synopsis || '').toString();

    // Build a rich cover prompt from the book
    const chapterTitles = session.chapters?.map(c => c.title).filter(Boolean).join(', ') || '';

    if (action === 'generate') {
      const isBack = coverType === 'back';
      const coverPrompt = customPrompt || (isBack
        ? buildBackCoverPrompt(title, genre, blurb, author, publishing)
        : buildCoverPrompt(title, genre, synopsis, chapterTitles, author, publishing));

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
    const { sessionId, imageUrl, prompt, model, coverType, authorName, publishingInfo } = await req.json();
    if (!sessionId || !imageUrl) {
      return NextResponse.json({ error: 'sessionId and imageUrl required' }, { status: 400 });
    }

    const isBack = coverType === 'back';
    const data: any = isBack
      ? {
          backCoverImageUrl: imageUrl,
          backCoverImagePrompt: prompt || null,
          backCoverImageModel: model || null,
        }
      : {
          coverImageUrl: imageUrl,
          coverImagePrompt: prompt || null,
          coverImageModel: model || null,
        };
    // Persist author / publishing details alongside the saved cover when provided.
    if (authorName !== undefined) data.authorName = (authorName || '').toString().trim() || null;
    if (publishingInfo !== undefined) data.publishingInfo = (publishingInfo || '').toString().trim() || null;

    const updated = await prisma.bookSession.update({
      where: { id: sessionId },
      data,
    });

    // Only the FRONT cover feeds the series story bible's cover gallery.
    if (!isBack && updated.seriesId) {
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

function buildCoverPrompt(
  title: string,
  genre: string,
  synopsis: string,
  chapterTitles: string,
  author?: string,
  publishing?: string,
): string {
  const authorLine = author
    ? `- Render the author name "${author}" clearly and legibly at the BOTTOM of the cover`
    : `- Author name area at bottom`;
  const publishingLine = publishing
    ? `- Include the publishing information "${publishing}" in small, tasteful text near the bottom edge`
    : '';
  return `Create a professional, visually striking FRONT book cover for:

Title: "${title}"
Genre: ${genre}
Synopsis: ${synopsis.slice(0, 500)}
${chapterTitles ? `Key chapters: ${chapterTitles.slice(0, 200)}` : ''}
${author ? `Author: ${author}` : ''}
${publishing ? `Publisher: ${publishing}` : ''}

Requirements:
- Professional book cover design suitable for publication
- Genre-appropriate visual style and mood
- Bold, legible title text "${title}" prominently displayed at the top or center
${authorLine}
${publishingLine}
- Eye-catching composition that would appeal on bookstore shelves and online thumbnails
- Rich colors and dramatic lighting appropriate for ${genre}
- Spell all text exactly as written, with correct spelling and clean typography
- No placeholder text, no lorem ipsum`;
}

function buildBackCoverPrompt(
  title: string,
  genre: string,
  blurb: string,
  author?: string,
  publishing?: string,
): string {
  const authorLine = author
    ? `- Include a short author credit line "${author}" near the bottom`
    : '';
  const publishingLine = publishing
    ? `- Include the publishing information "${publishing}" in small print at the bottom`
    : '';
  return `Create a professional BACK book cover that visually matches the front cover for:

Title: "${title}"
Genre: ${genre}
Back-cover blurb to feature: ${blurb.slice(0, 600)}
${author ? `Author: ${author}` : ''}
${publishing ? `Publisher: ${publishing}` : ''}

Requirements:
- Back-cover layout: genre-appropriate background and mood consistent with a matching front cover
- A clear, readable text panel presenting the blurb above (concise, well laid out, legible body text)
${authorLine}
${publishingLine}
- Reserve a small blank rectangle in the bottom-right corner as a placeholder for a barcode/ISBN
- Portrait book-cover proportions, print-ready composition
- Spell all text exactly as written, with correct spelling and clean typography
- No placeholder text, no lorem ipsum`;
}
