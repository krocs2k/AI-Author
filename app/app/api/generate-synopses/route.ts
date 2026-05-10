
import { NextRequest, NextResponse } from 'next/server';
import { routeLLMClient } from '@/lib/routellm';

export async function POST(request: NextRequest) {
  let genre = '';
  try {
    const body = await request.json();
    genre = body.genre;
    const { customTopic, genreAnalysis, seriesContext } = body;

    const topicContext = customTopic ? `with a focus on: ${customTopic}` : '';
    const analysisContext = genreAnalysis ? `
Based on genre analysis:
- Success factors: ${genreAnalysis.successFactors?.join(', ') || 'Strong plot, compelling characters'}
- Common themes: ${genreAnalysis.topBooks?.[0]?.themes?.join(', ') || 'Universal themes'}
- Typical structure: ${genreAnalysis.topBooks?.[0]?.structure || 'Three-act structure'}
` : '';

    // Build series continuity context if this book is part of a series
    let seriesContinuityContext = '';
    if (seriesContext) {
      const parts: string[] = [];
      if (seriesContext.plotArcs?.unresolvedThreads?.length) {
        parts.push(`Unresolved plot threads from previous books: ${seriesContext.plotArcs.unresolvedThreads.join('; ')}`);
      }
      if (seriesContext.plotArcs?.overarching) {
        parts.push(`Overarching series arc: ${seriesContext.plotArcs.overarching}`);
      }
      if (seriesContext.nextBookSuggestions?.length) {
        const suggestions = seriesContext.nextBookSuggestions.map((s: any) => s.concept || s.premise || s.title).filter(Boolean).join('; ');
        if (suggestions) parts.push(`Story Bible suggestions for next book: ${suggestions}`);
      }
      if (seriesContext.characters?.length) {
        const charNames = seriesContext.characters.map((c: any) => `${c.name} (${c.role})`).join(', ');
        parts.push(`Recurring characters: ${charNames}`);
      }
      if (seriesContext.themes?.recurring?.length) {
        parts.push(`Recurring themes: ${seriesContext.themes.recurring.join(', ')}`);
      }
      if (parts.length > 0) {
        seriesContinuityContext = `\n\nIMPORTANT - This is a book in an ongoing series. Incorporate the following continuity:\n${parts.join('\n')}\n\nEnsure synopses continue the series narrative and build on existing characters and plot threads.`;
      }
    }

    // Use RouteLLM for intelligent model selection optimized for creative synopsis generation
    // Reduced from 12 to 8 synopses and from 6000 to 3500 tokens to avoid Cloudflare timeouts
    const response = await routeLLMClient.generateWithSystem(
      `You are a bestselling author and book concept developer. Create compelling book synopses for the ${genre} genre that have high commercial potential.`,
      `Generate 8 unique book synopses for the ${genre} genre ${topicContext}.

${analysisContext}${seriesContinuityContext}

Each synopsis should:
- Be 150-200 words
- Have clear commercial appeal
- Include compelling conflict and stakes
- Feature relatable characters
- Follow successful patterns in the genre
- Have a success probability of 88% or higher

Format as JSON array with objects containing "id", "content", and "successProbability" (88-95). Respond with raw JSON only.`,
      'synopsis-generation',
      {
        taskRequirements: {
          priority: 'speed',
          creativityLevel: 'high',
          structuredOutput: true,
          maxTokensNeeded: 3500
        },
        maxTokens: 3500,
        temperature: 0.7
      }
    );

    let synopses;

    try {
      const cleanContent = response.content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      
      // Ensure we always get an array
      let extractedSynopses = parsed.synopses || parsed;
      if (!Array.isArray(extractedSynopses)) {
        // If it's an object with synopses property, try that
        if (extractedSynopses.synopses && Array.isArray(extractedSynopses.synopses)) {
          extractedSynopses = extractedSynopses.synopses;
        } else {
          // Not an array, use fallback
          extractedSynopses = [];
        }
      }
      synopses = extractedSynopses;
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Fallback synopses
      synopses = [];
    }

    // Ensure we have a valid array
    if (!Array.isArray(synopses)) {
      synopses = [];
    }

    // Ensure all synopses meet minimum probability requirement
    const filteredSynopses = synopses.filter(s => s?.successProbability >= 88);

    if (filteredSynopses.length === 0) {
      // Ensure we always have at least some synopses
      const fallbackSynopses = Array.from({ length: 8 }, (_, i) => ({
        id: `synopsis-${i + 1}`,
        content: `A captivating ${genre} story that combines classic elements of the genre with fresh perspectives. Features compelling characters navigating complex challenges, delivering both emotional depth and the exciting elements readers expect from ${genre} fiction.`,
        successProbability: 88 + Math.floor(Math.random() * 7)
      }));
      
      const routingInfo = {
        modelUsed: response.model,
        provider: response.provider,
        fallbackUsed: response.metadata?.fallbackUsed || false,
        fallbackReason: 'No valid synopses generated, using fallback data'
      };

      console.log(`Synopsis generation fallback triggered:`, routingInfo);
      
      return NextResponse.json(fallbackSynopses.map(s => ({ ...s, _routeLLM: routingInfo })));
    }

    // Add routing metadata to response for debugging
    const routingInfo = {
      modelUsed: response.model,
      provider: response.provider,
      fallbackUsed: response.metadata?.fallbackUsed || false,
      synopsesGenerated: filteredSynopses.length
    };

    console.log(`Synopsis generation completed using RouteLLM:`, routingInfo);

    return NextResponse.json(filteredSynopses.map(s => ({ ...s, _routeLLM: routingInfo })));
  } catch (error) {
    console.error('Error generating synopses:', error);
    
    // Check if it's a timeout error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.includes('timeout') || 
                     errorMessage.includes('524') || 
                     errorMessage.includes('All routing attempts failed');
    
    if (isTimeout) {
      console.log('Synopsis generation timed out, returning fallback synopses');
      // Return fallback synopses on timeout
      const fallbackSynopses = Array.from({ length: 8 }, (_, i) => ({
        id: `synopsis-${i + 1}`,
        content: `A captivating ${genre} story that combines classic elements of the genre with fresh perspectives. Features compelling characters navigating complex challenges, delivering both emotional depth and the exciting elements readers expect from ${genre} fiction.`,
        successProbability: 88 + Math.floor(Math.random() * 7),
        _routeLLM: {
          modelUsed: 'fallback',
          provider: 'fallback',
          fallbackUsed: true,
          fallbackReason: 'Synopsis generation timed out'
        }
      }));
      
      return NextResponse.json(fallbackSynopses);
    }
    
    return NextResponse.json({ error: 'Failed to generate synopses' }, { status: 500 });
  }
}
