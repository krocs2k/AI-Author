
import { NextRequest, NextResponse } from 'next/server';
import { routeLLMClient } from '@/lib/routellm';

export async function POST(request: NextRequest) {
  try {
    const { type, title, synopsis, genre } = await request.json();

    let prompt = '';

    if (type === 'cover-prompts') {
      prompt = `Create detailed image generation prompts for book covers for "${title}", a ${genre} book.

Synopsis: ${synopsis}

Generate:
- 5 front cover image prompts (detailed descriptions for AI image generation)
- 5 back cover image prompts

Each prompt should be detailed enough for AI image generation, including:
- Visual style and mood
- Color palette suggestions
- Key visual elements
- Typography style hints
- Overall composition

Format as JSON with "frontCovers" and "backCovers" arrays.`;
    } else if (type === 'sales-copy') {
      prompt = `Write compelling sales copy for "${title}", a ${genre} book using AIDA/PAS techniques.

Synopsis: ${synopsis}

The sales copy should:
- Hook readers with attention-grabbing opening
- Build interest and desire
- Include compelling benefits
- End with clear call-to-action
- Be SEO-optimized for online book sales
- Be 300-500 words

Focus on what makes this book irresistible to ${genre} readers.`;
    } else if (type === 'back-cover') {
      prompt = `Write back cover copy for "${title}", a ${genre} book.

Synopsis: ${synopsis}

The back cover copy should:
- Be 150-200 words
- Hook readers immediately
- Highlight key conflicts and stakes
- End with compelling questions or tension
- Appeal to ${genre} readers specifically
- Include suggested tagline or praise quote placeholder

Also provide an image prompt for the back cover design.

Format as JSON with "copy" and "imagePrompt" keys.`;
    }

    // Use RouteLLM for intelligent model selection optimized for marketing content
    const response = await routeLLMClient.chatCompletion({
      messages: [
        {
          role: 'system',
          content: `You are a book marketing expert specializing in ${genre} fiction. Create compelling marketing materials that drive sales.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      responseFormat: type !== 'sales-copy' ? { type: "json_object" } : undefined,
      taskType: 'marketing-copy',
      taskRequirements: {
        priority: 'quality',
        creativityLevel: 'medium',
        structuredOutput: type !== 'sales-copy',
        maxTokensNeeded: type === 'sales-copy' ? 1500 : 3000
      }
    });

    const content = response.content || '';

    // Add routing metadata
    const routingInfo = {
      modelUsed: response.model,
      provider: response.provider,
      fallbackUsed: response.metadata?.fallbackUsed || false,
      marketingType: type
    };

    console.log(`Marketing content generation completed using RouteLLM:`, routingInfo);

    if (type === 'sales-copy') {
      return NextResponse.json({ 
        content,
        _routeLLM: routingInfo
      });
    }

    // Parse JSON response for other types
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      return NextResponse.json({
        ...parsed,
        _routeLLM: routingInfo
      });
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      
      // Fallback responses
      const fallbackRoutingInfo = {
        ...routingInfo,
        fallbackReason: 'JSON parsing failed, using fallback data'
      };

      if (type === 'cover-prompts') {
        return NextResponse.json({
          frontCovers: [
            'Professional book cover design with elegant typography and genre-appropriate imagery',
            'Modern cover design featuring key story elements with compelling visual hierarchy',
            'Atmospheric cover with mood-setting background and striking title treatment',
            'Clean, commercial design that appeals to target audience with strong shelf presence',
            'Dynamic cover combining character elements with thematic visual metaphors'
          ],
          backCovers: [
            'Clean back cover layout with synopsis, author bio, and review quotes',
            'Professional back design with compelling copy layout and barcode placement',
            'Elegant back cover featuring key story highlights and praise quotes',
            'Commercial back cover design optimized for online and physical retail',
            'Sophisticated back layout balancing text hierarchy and visual appeal'
          ],
          _routeLLM: fallbackRoutingInfo
        });
      } else if (type === 'back-cover') {
        return NextResponse.json({
          copy: content || `Discover the compelling story that ${genre} readers are calling "unforgettable." With rich characters and expertly crafted plot, this book delivers everything fans of the genre love. Don't miss this captivating tale that will keep you turning pages late into the night.`,
          imagePrompt: 'Clean, professional back cover design with elegant typography and subtle genre-themed background elements',
          _routeLLM: fallbackRoutingInfo
        });
      }
      
      return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating marketing content:', error);
    return NextResponse.json({ error: 'Failed to generate marketing content' }, { status: 500 });
  }
}
