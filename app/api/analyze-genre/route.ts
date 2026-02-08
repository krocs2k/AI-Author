
import { NextRequest, NextResponse } from 'next/server';
import { routeLLMClient } from '@/lib/routellm';

export async function POST(request: NextRequest) {
  let genre = 'Fiction';
  
  try {
    const body = await request.json();
    genre = body.genre || 'Fiction';

    if (!genre) {
      return NextResponse.json({ error: 'Genre is required' }, { status: 400 });
    }

    console.log(`Starting genre analysis for: ${genre}`);

    // Try LLM call with a race against timeout for faster fallback
    let analysisResult;
    let routingInfo = {
      modelUsed: 'fallback',
      provider: 'system',
      fallbackUsed: true
    };

    try {
      // Create a timeout promise for faster fallback (30 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Quick timeout for better UX')), 30000);
      });

      // Race the API call against the timeout
      const response = await Promise.race([
        routeLLMClient.generateWithSystem(
          `You are a literary analyst. Analyze the ${genre} genre briefly.`,
          `For ${genre} books, provide JSON with "mojoSauce" (topBooks array with 3 items, commonPatterns array, avgChapters number, avgWordsPerChapter number, successFactors array) and "secretSauce" (topAuthors array with 2 items, humanizationTechniques array, commonVoiceElements array). Respond with only valid JSON.`,
          'genre-analysis',
          {
            temperature: 0.3,
            maxTokens: 2000
          }
        ),
        timeoutPromise
      ]) as any;

      // Parse response
      const cleanContent = response.content.replace(/```json\n?|\n?```/g, '').trim();
      analysisResult = JSON.parse(cleanContent);
      
      routingInfo = {
        modelUsed: response.model || 'route-llm',
        provider: response.provider || 'AbacusAI',
        fallbackUsed: false
      };
      
      console.log(`Genre analysis completed using LLM:`, routingInfo);
      
    } catch (llmError) {
      console.log('LLM call failed or timed out, using fallback data:', (llmError as Error).message);
      analysisResult = null;
    }

    // Use fallback if LLM failed or returned invalid data
    if (!analysisResult?.mojoSauce || !analysisResult?.secretSauce) {
      console.log('Using fallback analysis data for:', genre);
      analysisResult = generateFallbackAnalysis(genre);
      routingInfo = {
        modelUsed: 'fallback',
        provider: 'system',
        fallbackUsed: true
      };
    }

    return NextResponse.json({
      ...analysisResult,
      _routeLLM: routingInfo
    });
    
  } catch (error) {
    console.error('Error analyzing genre:', error);
    
    // Return fallback data instead of error to keep flow working
    const fallbackAnalysis = generateFallbackAnalysis(genre);
    
    return NextResponse.json({
      ...fallbackAnalysis,
      _routeLLM: {
        modelUsed: 'fallback',
        provider: 'system',
        fallbackUsed: true,
        error: (error as Error).message
      }
    });
  }
}

function generateFallbackAnalysis(genre: string) {
  return {
    mojoSauce: {
      topBooks: [
        { title: `The Art of ${genre}`, author: 'James Patterson', keyElements: ['Compelling plot', 'Strong characters', 'Page-turning pace'], structure: 'Three-act structure with multiple POVs', themes: ['Redemption', 'Love', 'Justice'] },
        { title: `${genre} Mastery`, author: 'Nora Roberts', keyElements: ['Emotional depth', 'Rich settings', 'Complex relationships'], structure: 'Character-driven narrative', themes: ['Family', 'Transformation', 'Hope'] },
        { title: `Beyond ${genre}`, author: 'Stephen King', keyElements: ['Atmospheric tension', 'Memorable characters', 'Unexpected twists'], structure: 'Building suspense with flashbacks', themes: ['Fear', 'Courage', 'Humanity'] }
      ],
      commonPatterns: ['Strong opening hook', 'Character development through conflict', 'Satisfying resolution', 'Emotional beats every chapter'],
      avgChapters: 25,
      avgWordsPerChapter: 3500,
      successFactors: ['Engaging prose', 'Market appeal', 'Strong voice', 'Relatable characters', 'Universal themes']
    },
    secretSauce: {
      topAuthors: [
        { name: 'James Patterson', writingStyle: 'Fast-paced, short chapters', voiceCharacteristics: ['Direct', 'Punchy', 'Accessible'], dialogueTechniques: ['Snappy exchanges', 'Character-revealing'], narrativeMethods: ['Multiple POVs', 'Cliffhangers'] },
        { name: 'Nora Roberts', writingStyle: 'Rich and immersive', voiceCharacteristics: ['Warm', 'Emotionally resonant', 'Detailed'], dialogueTechniques: ['Natural flow', 'Subtext'], narrativeMethods: ['Deep POV', 'Sensory details'] }
      ],
      humanizationTechniques: ['Varied sentence structure', 'Natural dialogue patterns', 'Emotional authenticity', 'Imperfect characters', 'Realistic reactions'],
      commonVoiceElements: ['Personal touch', 'Unique perspective', 'Consistent tone', 'Reader connection'],
      engagementStrategies: ['Hook readers in first paragraph', 'End chapters with questions', 'Balance action and reflection', 'Create memorable moments']
    }
  };
}
