export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { buildEpub, EpubChapterInput } from '@/lib/epub';

function safeName(name: string): string {
  return (name || 'book').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'book';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title: string = body?.title || 'Untitled';
    const chapters: EpubChapterInput[] = Array.isArray(body?.chapters) ? body.chapters : [];
    if (!chapters.some((c) => c?.content && String(c.content).trim())) {
      return NextResponse.json({ error: 'No chapter content to export' }, { status: 400 });
    }

    const buffer = await buildEpub({
      title,
      authorName: body?.authorName || '',
      publishingInfo: body?.publishingInfo || '',
      language: body?.language || 'en',
      forward: body?.forward || '',
      chapters,
      backCoverCopy: body?.backCoverCopy || '',
      coverImageUrl: body?.coverImageUrl || '',
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/epub+zip',
        'Content-Disposition': `attachment; filename="${safeName(title)}.epub"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (error) {
    console.error('Server EPUB generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate EPUB' }, { status: 500 });
  }
}
