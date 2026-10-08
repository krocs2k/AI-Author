import { prisma } from '@/lib/db';
import { getActiveLLMConfig } from '@/lib/routellm/config-loader';

/**
 * Generate (or refresh/merge) the Story Bible for a series from its book data,
 * using the LLM. Ownership MUST be verified by the caller before invoking this.
 *
 * Returns the upserted StoryBible record.
 * Throws on hard failures (no series, no books, no API key, LLM/parse errors,
 * or timeout) so callers can decide whether to continue.
 */
export async function generateStoryBibleForSeries(opts: {
  seriesId: string;
  bookId?: string;
}) {
  const { seriesId, bookId } = opts;

  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    include: {
      storyBible: true,
      books: {
        include: { chapters: { select: { title: true, content: true, chapterNumber: true } } },
        orderBy: { seriesOrder: 'asc' },
      },
    },
  });
  if (!series) throw new Error('Series not found');

  const booksToProcess = bookId
    ? series.books.filter((b) => b.id === bookId)
    : series.books;

  if (booksToProcess.length === 0) {
    throw new Error('No books found to process');
  }

  const bookSummaries = booksToProcess
    .map((book) => {
      const title = book.selectedTitle || book.customTitle || book.name || 'Untitled';
      const chapterSummary =
        book.chapters
          ?.sort((a: any, b: any) => a.chapterNumber - b.chapterNumber)
          .map((ch: any) => `Chapter ${ch.chapterNumber}: ${ch.title}\n${(ch.content || '').slice(0, 800)}`)
          .join('\n---\n') || '';

      const characters = ((book as any).characters as any[]) || [];
      const charDescriptions = characters
        .map(
          (c: any) =>
            `${c.name} (${c.role}): ${c.physicalDescription || ''} | ${c.personality?.join(', ') || ''} | Arc: ${c.arc || ''}`
        )
        .join('\n');

      return `Book: "${title}" (Order: ${book.seriesOrder || '?'})
Genre: ${book.selectedGenre || series.genre || 'Unknown'}
Synopsis: ${book.selectedSynopsis || ''}
Characters:\n${charDescriptions}
Chapters:\n${chapterSummary.slice(0, 3000)}`;
    })
    .join('\n\n=== NEXT BOOK ===\n\n');

  const existingBible = series.storyBible
    ? JSON.stringify({
        seriesOverview: series.storyBible.seriesOverview,
        characters: series.storyBible.characters,
        worldBuilding: series.storyBible.worldBuilding,
        plotArcs: series.storyBible.plotArcs,
        themes: series.storyBible.themes,
        storylines: series.storyBible.storylines,
        continuityNotes: series.storyBible.continuityNotes,
      })
    : 'None — this is a fresh generation.';

  const config = await getActiveLLMConfig();
  const apiKey = config.abacusApiKey || process.env.ABACUSAI_API_KEY;
  if (!apiKey) throw new Error('No API key configured');

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

  const model = config.writingModel || config.ideaModel || 'gpt-5.1';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  let response: Response;
  try {
    response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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

  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[1]!.trim());
  } catch {
    console.error('Failed to parse story bible JSON:', raw.slice(0, 500));
    throw new Error('Failed to parse LLM response as JSON');
  }

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
    coverImages: existingCovers,
  };

  const bible = await prisma.storyBible.upsert({
    where: { seriesId },
    create: { seriesId, ...bibleData },
    update: bibleData,
  });

  return bible;
}
