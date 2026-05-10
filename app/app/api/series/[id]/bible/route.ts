import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveLLMConfig } from '@/lib/routellm/config-loader';

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

    const series = await prisma.series.findFirst({
      where: { id: params.id, userId },
      include: {
        storyBible: true,
        books: {
          include: { chapters: { select: { title: true, content: true, chapterNumber: true } } },
          orderBy: { seriesOrder: 'asc' },
        },
      },
    });
    if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 });

    const { bookId } = await req.json().catch(() => ({}));

    // Gather book data for context
    const booksToProcess = bookId
      ? series.books.filter(b => b.id === bookId)
      : series.books;

    if (booksToProcess.length === 0) {
      return NextResponse.json({ error: 'No books found to process' }, { status: 400 });
    }

    const bookSummaries = booksToProcess.map(book => {
      const title = book.selectedTitle || book.customTitle || book.name || 'Untitled';
      const chapterSummary = book.chapters
        ?.sort((a: any, b: any) => a.chapterNumber - b.chapterNumber)
        .map((ch: any) => `Chapter ${ch.chapterNumber}: ${ch.title}\n${(ch.content || '').slice(0, 800)}`)
        .join('\n---\n') || '';
      
      const characters = ((book as any).characters as any[]) || [];
      const charDescriptions = characters.map((c: any) =>
        `${c.name} (${c.role}): ${c.physicalDescription || ''} | ${c.personality?.join(', ') || ''} | Arc: ${c.arc || ''}`
      ).join('\n');

      return `Book: "${title}" (Order: ${book.seriesOrder || '?'})
Genre: ${book.selectedGenre || series.genre || 'Unknown'}
Synopsis: ${book.selectedSynopsis || ''}
Characters:\n${charDescriptions}
Chapters:\n${chapterSummary.slice(0, 3000)}`;
    }).join('\n\n=== NEXT BOOK ===\n\n');

    const existingBible = series.storyBible ? JSON.stringify({
      seriesOverview: series.storyBible.seriesOverview,
      characters: series.storyBible.characters,
      worldBuilding: series.storyBible.worldBuilding,
      plotArcs: series.storyBible.plotArcs,
      themes: series.storyBible.themes,
      storylines: series.storyBible.storylines,
      continuityNotes: series.storyBible.continuityNotes,
    }) : 'None — this is a fresh generation.';

    const config = await getActiveLLMConfig();
    const apiKey = config.abacusApiKey || process.env.ABACUSAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No API key configured' }, { status: 500 });

    const systemPrompt = `You are a professional story bible editor for book series. Your job is to analyze books and maintain a comprehensive, consistent story bible that tracks all narrative elements across the series.

Return ONLY valid JSON with these exact keys (all values should be objects or arrays as specified):
{
  "seriesOverview": { "title": "...", "genre": "...", "themes": ["..."], "tone": "...", "targetAudience": "...", "logline": "..." },
  "characters": [{ "name": "...", "role": "protagonist|antagonist|supporting|minor", "physicalDesc": "...", "personality": ["..."], "arc": "...", "visualRef": "...", "backstory": "...", "firstAppearance": "...", "status": "active|deceased|missing" }],
  "worldBuilding": { "settings": ["..."], "locations": [{ "name": "...", "description": "..." }], "rules": ["..."], "mythology": "...", "technology": "...", "culture": "..." },
  "plotArcs": { "overarching": "...", "perBook": [{ "bookTitle": "...", "arc": "...", "resolution": "..." }], "unresolvedThreads": ["..."] },
  "timeline": [{ "event": "...", "bookTitle": "...", "chapter": "...", "chronologicalOrder": 1 }],
  "relationships": [{ "char1": "...", "char2": "...", "type": "...", "evolution": [{ "bookTitle": "...", "state": "..." }] }],
  "themes": { "recurring": ["..."], "symbols": ["..."], "motifs": ["..."] },
  "voiceAndStyle": { "pov": "...", "narrativeVoice": "...", "toneGuidelines": ["..."], "prohibitions": ["..."] },
  "visualGuide": { "characterAppearances": [{ "name": "...", "description": "..." }], "colorPalette": ["..."], "artStyle": "..." },
  "storylines": [{ "name": "...", "status": "active|resolved|dormant", "description": "...", "books": ["..."] }],
  "continuityNotes": ["..."],
  "nextBookSuggestions": [{ "title": "...", "concept": "...", "premise": "...", "conflictsToResolve": ["..."] }]
}`;

    const userPrompt = `Series: "${series.name}"\nGenre: ${series.genre || 'Unknown'}\nDescription: ${series.description || 'N/A'}\n\nExisting Story Bible:\n${existingBible}\n\nBook Data to Process:\n${bookSummaries.slice(0, 12000)}\n\n${series.storyBible ? 'MERGE the new book data into the existing story bible. Preserve all existing entries and add/update based on the new book content. Update character arcs, add new characters, advance plot arcs, and suggest what could happen next.' : 'Generate a complete story bible from this book data. Be thorough but concise.'}`;

    const model = config.selectedModel || 'gpt-5.1';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    let response: Response;
    try {
      response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.4,
          max_tokens: 8000,
        }),
        signal: controller.signal,
      });
    } catch (e: any) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') throw new Error('Story bible generation timed out');
      throw e;
    }
    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`LLM call failed (${response.status}): ${err}`);
    }

    const llmData = await response.json();
    const raw = llmData.choices?.[0]?.message?.content || '';

    // Extract JSON from response (may be wrapped in markdown)
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      console.error('Failed to parse story bible JSON:', raw.slice(0, 500));
      return NextResponse.json({ error: 'Failed to parse LLM response as JSON' }, { status: 500 });
    }

    // Preserve existing cover images (not LLM-generated)
    const existingCovers = series.storyBible?.coverImages || [];

    const bibleData: any = {
      seriesOverview: parsed.seriesOverview || null,
      characters: parsed.characters || null,
      worldBuilding: parsed.worldBuilding || null,
      plotArcs: parsed.plotArcs || null,
      timeline: parsed.timeline || null,
      relationships: parsed.relationships || null,
      themes: parsed.themes || null,
      voiceAndStyle: parsed.voiceAndStyle || null,
      visualGuide: parsed.visualGuide || null,
      storylines: parsed.storylines || null,
      continuityNotes: parsed.continuityNotes || null,
      nextBookSuggestions: parsed.nextBookSuggestions || null,
      coverImages: existingCovers, // keep manually saved covers
    };

    const bible = await prisma.storyBible.upsert({
      where: { seriesId: params.id },
      create: { seriesId: params.id, ...bibleData },
      update: bibleData,
    });

    return NextResponse.json(bible);
  } catch (error: any) {
    console.error('Story Bible generation error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
