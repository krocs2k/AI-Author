
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { genre } = await request.json();

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [
          {
            role: 'system',
            content: `You are an expert literary analyst specializing in bestselling books. Analyze the ${genre} genre and provide detailed insights for authors.`
          },
          {
            role: 'user',
            content: `Analyze the ${genre} genre and provide:

1. MojoSauce Analysis (Top 10 bestselling books in ${genre} from last 5 years):
- Key successful books with their success elements
- Common story structures and themes
- Average chapter count and words per chapter
- Success factors that make books bestsellers

2. SecretSauce Analysis (Top authors in ${genre}):
- Writing styles and techniques of successful authors
- Dialogue composition methods
- Narrative techniques
- Voice characteristics that create 90%+ humanized content

Format as JSON with "mojoSauce" and "secretSauce" keys. Respond with raw JSON only.`
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    let analysisResult;
    
    try {
      // Clean and parse JSON response
      const content = data.choices?.[0]?.message?.content || '{}';
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      analysisResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Fallback with simulated data
      analysisResult = {
        mojoSauce: {
          topBooks: [
            { title: `Bestseller in ${genre}`, author: 'Top Author', keyElements: ['Compelling plot', 'Strong characters'], structure: 'Three-act structure', themes: ['Universal themes'] }
          ],
          commonPatterns: ['Strong opening', 'Character development', 'Satisfying resolution'],
          avgChapters: 20,
          avgWordsPerChapter: 3500,
          successFactors: ['Engaging prose', 'Market appeal', 'Strong voice']
        },
        secretSauce: {
          topAuthors: [
            { name: 'Leading Author', writingStyle: 'Engaging narrative', voiceCharacteristics: ['Authentic', 'Relatable'], dialogueTechniques: ['Natural flow'], narrativeMethods: ['Show don\'t tell'] }
          ],
          humanizationTechniques: ['Varied sentence structure', 'Natural dialogue', 'Emotional authenticity'],
          commonVoiceElements: ['Personal touch', 'Unique perspective'],
          engagementStrategies: ['Hook readers early', 'Maintain tension']
        }
      };
    }

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error('Error analyzing genre:', error);
    return NextResponse.json({ error: 'Failed to analyze genre' }, { status: 500 });
  }
}
