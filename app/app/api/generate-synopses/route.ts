
import { NextRequest, NextResponse } from 'next/server';
import { routeLLMClient } from '@/lib/routellm';

export async function POST(request: NextRequest) {
  try {
    const { genre, customTopic, genreAnalysis } = await request.json();

    const topicContext = customTopic ? `with a focus on: ${customTopic}` : '';
    const analysisContext = genreAnalysis ? `
Based on genre analysis:
- Success factors: ${genreAnalysis.successFactors?.join(', ') || 'Strong plot, compelling characters'}
- Common themes: ${genreAnalysis.topBooks?.[0]?.themes?.join(', ') || 'Universal themes'}
- Typical structure: ${genreAnalysis.topBooks?.[0]?.structure || 'Three-act structure'}
` : '';

    // Use RouteLLM for intelligent model selection optimized for creative synopsis generation
    const response = await routeLLMClient.generateWithSystem(
      `You are a bestselling author and book concept developer. Create compelling book synopses for the ${genre} genre that have high commercial potential.`,
      `Generate 12 unique book synopses for the ${genre} genre ${topicContext}.

${analysisContext}

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
          priority: 'quality',
          creativityLevel: 'high',
          structuredOutput: true,
          maxTokensNeeded: 6000
        }
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
    return NextResponse.json({ error: 'Failed to generate synopses' }, { status: 500 });
  }
}
