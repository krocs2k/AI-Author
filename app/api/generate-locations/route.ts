import { NextRequest, NextResponse } from 'next/server';
import { routeLLMClient } from '@/lib/routellm';
import { withNovelSystemBible } from '@/lib/routellm/config-loader';

interface ChapterContext {
  chapterNumber?: number;
  title?: string;
  content?: string | null;
}

function buildFallbackLocations(genre: string) {
  return [
    {
      name: 'Primary Setting',
      type: 'Central location',
      description: `The main backdrop where much of this ${genre || ''} story unfolds, grounding the characters and driving the plot forward.`.trim(),
      atmosphere: 'Distinctive mood that reinforces the tone of the story.',
      significance: 'Serves as the anchor point for the central conflict and key turning points.',
    },
    {
      name: 'Secondary Setting',
      type: 'Supporting location',
      description: 'A contrasting environment that broadens the world and gives characters room to grow or clash.',
      atmosphere: 'A tone that complements or opposes the primary setting.',
      significance: 'Hosts pivotal scenes and reveals new dimensions of the characters.',
    },
    {
      name: 'Turning-Point Location',
      type: 'Climactic location',
      description: 'The place where the stakes peak and the story builds toward its resolution.',
      atmosphere: 'Charged, high-tension atmosphere fitting the climax.',
      significance: 'Where the central conflict comes to a head.',
    },
  ];
}

export async function POST(request: NextRequest) {
  let genre = '';
  let title = '';
  try {
    const body = await request.json();
    title = body.title || 'Untitled';
    genre = body.genre || '';
    const synopsis = body.synopsis || '';
    const chapters: ChapterContext[] = Array.isArray(body.chapters) ? body.chapters : [];

    // Build a compact context from chapter openings so the model can ground locations in the actual story.
    const chapterExcerpts = chapters
      .filter((c) => c && c.content)
      .slice(0, 12)
      .map((c) => {
        const excerpt = (c.content || '').replace(/\s+/g, ' ').trim().slice(0, 600);
        return `Chapter ${c.chapterNumber ?? ''}${c.title ? ` - ${c.title}` : ''}: ${excerpt}`;
      })
      .join('\n\n');

    const prompt = `Identify and describe the key locations/settings for "${title}", a ${genre} book.

Synopsis: ${synopsis}

${chapterExcerpts ? `Story excerpts for reference:\n${chapterExcerpts}\n\n` : ''}Extract 5-10 of the most important locations that appear in or are central to this story. Base them on the actual story details provided. For each location provide:
- name: the location's name
- type: what kind of place it is (city, building, natural landmark, realm, etc.)
- description: a vivid physical description (2-4 sentences)
- atmosphere: the mood/feeling of the place
- significance: why this location matters to the plot and characters

Respond ONLY with JSON in this exact shape: { "locations": [ { "name": "", "type": "", "description": "", "atmosphere": "", "significance": "" } ] }`;

    const systemPrompt = await withNovelSystemBible(
      `You are a worldbuilding expert helping an author compile a location bible for a ${genre} novel. Ground every location in the story details provided and never invent contradictory facts.`
    );

    const response = await routeLLMClient.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      responseFormat: { type: 'json_object' },
      taskType: 'marketing-copy',
      taskRequirements: {
        priority: 'speed',
        creativityLevel: 'medium',
        structuredOutput: true,
        maxTokensNeeded: 2000,
      },
      maxTokens: 2000,
      temperature: 0.6,
    });

    const content = response.content || '';

    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      const locations = Array.isArray(parsed.locations) ? parsed.locations : [];
      if (locations.length === 0) {
        return NextResponse.json({ locations: buildFallbackLocations(genre), fallbackUsed: true });
      }
      return NextResponse.json({ locations });
    } catch (parseError) {
      console.error('Location JSON parsing error:', parseError);
      return NextResponse.json({ locations: buildFallbackLocations(genre), fallbackUsed: true });
    }
  } catch (error) {
    console.error('Error generating locations:', error);
    return NextResponse.json({ locations: buildFallbackLocations(genre), fallbackUsed: true });
  }
}
