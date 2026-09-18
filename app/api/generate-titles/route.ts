
import { NextRequest, NextResponse } from 'next/server';
import { routeLLMClient } from '@/lib/routellm';
import { withNovelSystemBible } from '@/lib/routellm/config-loader';

export async function POST(request: NextRequest) {
  try {
    const { synopsis, genre } = await request.json();

    // Use RouteLLM for intelligent model selection optimized for creative title generation
    // Reduced from 3000 to 2000 tokens for faster response times
    const titleSystemPrompt = await withNovelSystemBible(`You are a book marketing expert specializing in creating compelling, marketable book titles for the ${genre} genre.`);
    const response = await routeLLMClient.chatCompletion({
      messages: [
        {
          role: 'system',
          content: titleSystemPrompt
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
      responseFormat: { type: "json_object" },
      taskType: 'title-generation',
      taskRequirements: {
        priority: 'speed',
        creativityLevel: 'high',
        structuredOutput: true,
        maxTokensNeeded: 2000
      },
      maxTokens: 2000,
      temperature: 0.7
    });

    let titles;

    try {
      const cleanContent = response.content.replace(/```json\n?|\n?```/g, '').trim();
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

    // Ensure we have an array
    const finalTitles = Array.isArray(titles) ? titles : [];

    // Add routing metadata to response for debugging
    const routingInfo = {
      modelUsed: response.model,
      provider: response.provider,
      fallbackUsed: response.metadata?.fallbackUsed || false,
      titlesGenerated: finalTitles.length
    };

    console.log(`Title generation completed using RouteLLM:`, routingInfo);

    return NextResponse.json(finalTitles.map(t => ({ ...t, _routeLLM: routingInfo })));
  } catch (error) {
    console.error('Error generating titles:', error);
    
    // Check if it's a timeout error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.includes('timeout') || 
                     errorMessage.includes('524') || 
                     errorMessage.includes('All routing attempts failed');
    
    if (isTimeout) {
      console.log('Title generation timed out, returning fallback titles');
      // Return fallback titles on timeout
      const fallbackTitles = [
        { id: 'title-1', title: 'The Last Chapter', reasoning: 'Evokes mystery and finality', _routeLLM: { fallbackUsed: true } },
        { id: 'title-2', title: 'Shadows of Tomorrow', reasoning: 'Creates intrigue about the future', _routeLLM: { fallbackUsed: true } },
        { id: 'title-3', title: 'The Hidden Truth', reasoning: 'Suggests secrets to be revealed', _routeLLM: { fallbackUsed: true } },
        { id: 'title-4', title: 'Beyond the Horizon', reasoning: 'Implies adventure and discovery', _routeLLM: { fallbackUsed: true } },
        { id: 'title-5', title: 'The Silent Promise', reasoning: 'Creates emotional connection', _routeLLM: { fallbackUsed: true } },
        { id: 'title-6', title: 'Echoes of the Heart', reasoning: 'Appeals to emotional depth', _routeLLM: { fallbackUsed: true } },
        { id: 'title-7', title: 'The Turning Point', reasoning: 'Suggests crucial moments', _routeLLM: { fallbackUsed: true } },
        { id: 'title-8', title: 'Whispers in the Dark', reasoning: 'Creates atmosphere and mystery', _routeLLM: { fallbackUsed: true } }
      ];
      
      return NextResponse.json(fallbackTitles);
    }
    
    return NextResponse.json({ error: 'Failed to generate titles' }, { status: 500 });
  }
}
