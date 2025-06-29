
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { synopsis, genre } = await request.json();

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `You are a book marketing expert specializing in creating compelling, marketable book titles for the ${genre} genre.`
          },
          {
            role: 'user',
            content: `Based on this synopsis: "${synopsis}"

Generate 8 compelling book titles for this ${genre} story. Each title should:
- Be memorable and marketable
- Reflect the story's core themes
- Appeal to the target audience
- Stand out in the ${genre} market
- Be neither too long nor too short

For each title, provide a brief reasoning explaining why it would work well.

Format as JSON array with objects containing "id", "title", and "reasoning".`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    let titles;

    try {
      const content = data.choices?.[0]?.message?.content || '{}';
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      titles = parsed.titles || parsed;
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Fallback titles
      titles = [
        { id: 'title-1', title: 'The Last Chapter', reasoning: 'Evokes mystery and finality' },
        { id: 'title-2', title: 'Shadows of Tomorrow', reasoning: 'Creates intrigue about the future' },
        { id: 'title-3', title: 'The Hidden Truth', reasoning: 'Suggests secrets to be revealed' },
        { id: 'title-4', title: 'Beyond the Horizon', reasoning: 'Implies adventure and discovery' },
        { id: 'title-5', title: 'The Silent Promise', reasoning: 'Creates emotional connection' },
        { id: 'title-6', title: 'Echoes of the Heart', reasoning: 'Appeals to emotional depth' },
        { id: 'title-7', title: 'The Turning Point', reasoning: 'Suggests crucial moments' },
        { id: 'title-8', title: 'Whispers in the Dark', reasoning: 'Creates atmosphere and mystery' }
      ];
    }

    return NextResponse.json(Array.isArray(titles) ? titles : []);
  } catch (error) {
    console.error('Error generating titles:', error);
    return NextResponse.json({ error: 'Failed to generate titles' }, { status: 500 });
  }
}
