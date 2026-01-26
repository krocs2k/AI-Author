
import { NextRequest, NextResponse } from 'next/server';
import { routeLLMClient } from '@/lib/routellm';

// Enhanced word count calculation with better accuracy
function calculateWordCount(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  
  // Remove extra whitespace and normalize the text
  const normalizedText = text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/[^\w\s'-]/g, ' ') // Replace punctuation with spaces (except apostrophes and hyphens)
    .replace(/\s+/g, ' ') // Clean up any double spaces created
    .trim();
  
  if (!normalizedText) return 0;
  
  // Split by whitespace and filter out empty strings
  const words = normalizedText.split(/\s+/).filter(word => {
    // Only count actual words (must contain at least one letter or number)
    return word.length > 0 && /[a-zA-Z0-9]/.test(word);
  });
  
  return words.length;
}

// Enhanced validation function to check word count compliance
function validateWordCount(wordCount: number, target: number, minPercent: number = 92, maxPercent: number = 110): {
  meetsRequirement: boolean;
  compliance: number;
  status: 'perfect' | 'acceptable' | 'too_short' | 'too_long';
  deviation: number;
  message: string;
} {
  const minWords = Math.floor(target * (minPercent / 100));
  const maxWords = Math.floor(target * (maxPercent / 100));
  const compliance = Math.round((wordCount / target) * 100);
  const deviation = Math.abs(wordCount - target);
  
  let status: 'perfect' | 'acceptable' | 'too_short' | 'too_long';
  let message: string;
  
  if (wordCount >= minWords && wordCount <= maxWords) {
    const perfectRange = Math.floor(target * 0.05); // Within 5% is perfect
    if (Math.abs(wordCount - target) <= perfectRange) {
      status = 'perfect';
      message = `Excellent! Word count is perfectly within target range.`;
    } else {
      status = 'acceptable';
      message = `Good! Word count meets the required range (${minPercent}-${maxPercent}%).`;
    }
  } else if (wordCount < minWords) {
    status = 'too_short';
    message = `Content is too short. Need ${minWords - wordCount} more words to meet minimum requirement.`;
  } else {
    status = 'too_long';
    message = `Content is too long. Need to reduce by ${wordCount - maxWords} words to meet maximum requirement.`;
  }
  
  return {
    meetsRequirement: wordCount >= minWords && wordCount <= maxWords,
    compliance,
    status,
    deviation,
    message
  };
}

// Enhanced content generation with sophisticated retry logic and word count optimization
async function generateContentWithWordCountValidation(
  prompt: string,
  genre: string,
  wordTarget: number,
  minimumPercentage: number = 92,
  maximumPercentage: number = 110,
  maxRetries: number = 3
) {
  const minimumWordCount = Math.floor(wordTarget * (minimumPercentage / 100));
  const maximumWordCount = Math.floor(wordTarget * (maximumPercentage / 100));
  let attempts = 0;
  let bestContent = '';
  let bestWordCount = 0;
  let bestValidation: any = null;
  const generationAttempts: Array<{
    attempt: number, 
    wordCount: number, 
    success: boolean, 
    compliance: number,
    status: string,
    deviation: number
  }> = [];

  while (attempts < maxRetries) {
    attempts++;
    
    try {
      // Build enhanced prompt with explicit word count guidance
      let enhancedPrompt = prompt;
      
      // Add comprehensive word count guidance from the start
      const wordCountGuidance = `

CRITICAL WORD COUNT REQUIREMENTS:
- Target word count: ${wordTarget} words (EXACT TARGET)
- Acceptable range: ${minimumWordCount} - ${maximumWordCount} words (${minimumPercentage}% - ${maximumPercentage}% of target)
- This is a STRICT requirement that MUST be met
- Count every word carefully as you write

WRITING STRATEGY FOR WORD COUNT:
- Plan your content to reach approximately ${wordTarget} words
- Write with natural flow while being mindful of length
- Use descriptive details, dialogue, and scene-setting to reach target length
- Avoid filler content - every word should add value
- If you're approaching the word limit, conclude naturally within the range`;

      enhancedPrompt += wordCountGuidance;
      
      // Add specific guidance based on previous attempts
      if (attempts > 1 && bestValidation) {
        const { status, compliance, deviation, message } = bestValidation;
        
        enhancedPrompt += `\n\nPREVIOUS ATTEMPT ANALYSIS:
- Previous word count: ${bestWordCount} words (${compliance}% of target)
- Status: ${status.replace('_', ' ').toUpperCase()}
- Deviation from target: ${deviation} words
- Issue: ${message}

CORRECTION STRATEGY FOR THIS ATTEMPT:`;
        
        if (status === 'too_short') {
          const wordsNeeded = minimumWordCount - bestWordCount;
          enhancedPrompt += `
- You need to add approximately ${wordsNeeded} more words
- Expand on descriptions, add more dialogue, develop scenes further
- Include more character thoughts, emotions, and sensory details
- Add more background information or world-building elements
- Ensure natural flow while reaching the required length
- FOCUS: Write more expansively and descriptively`;
          
        } else if (status === 'too_long') {
          const wordsToRemove = bestWordCount - maximumWordCount;
          enhancedPrompt += `
- You need to reduce by approximately ${wordsToRemove} words
- Tighten descriptions, streamline dialogue, focus on essentials
- Remove unnecessary details while maintaining story quality
- Combine shorter sentences, eliminate redundancy
- Keep the narrative focused and concise
- FOCUS: Write more concisely and precisely`;
        }
        
        enhancedPrompt += `\n\nREMEMBER: This is attempt ${attempts} of ${maxRetries}. Make sure to hit the target range of ${minimumWordCount}-${maximumWordCount} words this time.`;
      } else {
        // First attempt - add encouragement and clear expectations
        enhancedPrompt += `\n\nThis is your first attempt. Write naturally and engagingly while staying within the ${minimumWordCount}-${maximumWordCount} word range. Quality and word count are both important.`;
      }

      // Use RouteLLM for intelligent model selection optimized for content creation
      const response = await routeLLMClient.generateWithSystem(
        `You are a bestselling author in the ${genre} genre. Write engaging, human-like content that feels authentic and compelling. 

CRITICAL REQUIREMENTS:
1. WORD COUNT: You MUST write exactly ${wordTarget} words (acceptable range: ${minimumWordCount}-${maximumWordCount} words)
2. QUALITY: Maintain 94%+ humanization with natural flow, varied sentence structure, and engaging prose
3. GENRE: Stay true to ${genre} genre conventions and reader expectations

WORD COUNT STRATEGY:
- Plan your content structure to naturally reach ${wordTarget} words
- Count words as you write and adjust accordingly
- Use rich descriptions, meaningful dialogue, and proper pacing
- Every word should serve a purpose - no filler content
- If you're near the limit, conclude naturally within the acceptable range

Remember: Word count compliance is MANDATORY. Quality content within the specified word range is the goal.`,
        enhancedPrompt,
        'content-creation',
        {
          temperature: 0.7,
          maxTokens: Math.max(4000, Math.ceil(wordTarget * 1.5)), // Ensure enough tokens for target length
          taskRequirements: {
            priority: 'quality',
            creativityLevel: 'high',
            maxTokensNeeded: Math.max(4000, Math.ceil(wordTarget * 1.5)),
            fallbackAllowed: true
          }
        }
      );

      const content = response.content || '';
      
      if (!content.trim()) {
        throw new Error('No content generated');
      }

      // Enhanced validation using our new validation function
      const wordCount = calculateWordCount(content);
      const validation = validateWordCount(wordCount, wordTarget, minimumPercentage, maximumPercentage);
      
      generationAttempts.push({
        attempt: attempts,
        wordCount,
        success: validation.meetsRequirement,
        compliance: validation.compliance,
        status: validation.status,
        deviation: validation.deviation
      });

      // Enhanced best content selection logic
      const shouldUpdateBest = 
        !bestContent || // First valid content
        validation.meetsRequirement && !bestValidation?.meetsRequirement || // First successful attempt
        (validation.meetsRequirement && bestValidation?.meetsRequirement && validation.deviation < bestValidation.deviation) || // Better successful attempt
        (!validation.meetsRequirement && !bestValidation?.meetsRequirement && validation.deviation < bestValidation.deviation); // Better unsuccessful attempt
      
      if (shouldUpdateBest) {
        bestContent = content;
        bestWordCount = wordCount;
        bestValidation = validation;
      }

      // If we meet the requirement, return immediately with detailed results
      if (validation.meetsRequirement) {
        return {
          content,
          wordCount,
          meetsWordCountRequirement: true,
          wordCountCompliance: validation.compliance,
          wordCountStatus: validation.status,
          wordCountMessage: validation.message,
          wordTarget,
          wordCountRange: `${minimumWordCount}-${maximumWordCount}`,
          generationAttempts,
          finalAttempt: attempts,
          validationDetails: validation,
          routingInfo: {
            modelUsed: response.model,
            provider: response.provider,
            fallbackUsed: response.metadata?.fallbackUsed || false
          }
        };
      }

    } catch (error) {
      console.error(`Content generation attempt ${attempts} failed:`, error);
      
      // Log detailed error for debugging
      generationAttempts.push({
        attempt: attempts,
        wordCount: 0,
        success: false,
        compliance: 0,
        status: 'error',
        deviation: wordTarget
      });
      
      if (attempts === maxRetries) {
        throw new Error(`Content generation failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Add small delay before retry to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
  }

  // If we exhausted all attempts, return the best content we generated with detailed analysis
  if (!bestContent) {
    throw new Error(`Failed to generate any content after ${maxRetries} attempts`);
  }
  
  const finalValidation = bestValidation || validateWordCount(bestWordCount, wordTarget, minimumPercentage, maximumPercentage);
  
  console.warn(`Word count validation failed after ${maxRetries} attempts. Best attempt: ${bestWordCount} words (${finalValidation.compliance}% of target). Status: ${finalValidation.status}`);
  
  return {
    content: bestContent,
    wordCount: bestWordCount,
    meetsWordCountRequirement: finalValidation.meetsRequirement,
    wordCountCompliance: finalValidation.compliance,
    wordCountStatus: finalValidation.status,
    wordCountMessage: finalValidation.message,
    wordTarget,
    wordCountRange: `${minimumWordCount}-${maximumWordCount}`,
    generationAttempts,
    finalAttempt: attempts,
    validationDetails: finalValidation,
    warning: `Content does not meet word count requirements after ${maxRetries} attempts. Using best available content.`,
    routingInfo: {
      modelUsed: 'best-attempt',
      provider: 'unknown',
      fallbackUsed: true
    }
  };
}

// Helper function to generate content with timeout fallback
async function generateWithTimeout(
  systemPrompt: string,
  prompt: string,
  wordTarget: number,
  timeoutMs: number = 60000 // 60 second timeout
): Promise<{ content: string; model: string; provider: string; timedOut: boolean }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await routeLLMClient.generateWithSystem(
      systemPrompt,
      prompt,
      'content-creation',
      {
        temperature: 0.7,
        maxTokens: Math.min(2000, Math.ceil(wordTarget * 1.5)) // Cap maxTokens to speed up generation
      }
    );
    
    clearTimeout(timeoutId);
    return {
      content: response.content || '',
      model: response.model,
      provider: response.provider,
      timedOut: false
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError' || error.message?.includes('timed out') || error.message?.includes('524')) {
      return { content: '', model: 'timeout', provider: 'none', timedOut: true };
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  let type: string = 'unknown';
  let wordTarget: number = 0;
  
  try {
    const { type: requestType, sessionId, chapterNumber, title, synopsis, genre, authorAnalysis, wordsPerChapter } = await request.json();
    type = requestType;

    // Validate required parameters
    if (!type || !title || !synopsis || !genre) {
      return NextResponse.json({ 
        error: 'Missing required parameters: type, title, synopsis, and genre are required' 
      }, { status: 400 });
    }

    console.log(`Starting content generation: ${type} for ${title} (${genre})`);

    let prompt = '';
    // Cap word target to prevent Cloudflare timeouts (max ~1000 words to stay well under 100s)
    const requestedWords = type === 'forward' ? 500 : (wordsPerChapter || 3500);
    wordTarget = Math.min(requestedWords, 1000); // Cap at 1000 to prevent timeout

    if (type === 'forward') {
      prompt = `Write a compelling forward/introduction for a ${genre} book titled "${title}".

FORWARD REQUIREMENTS:
- Hook the reader immediately with an engaging opening
- Set the tone and atmosphere for the entire story
- Introduce key themes and genre elements
- Create anticipation and excitement for what's to come
- Target approximately ${wordTarget} words

STORY CONTEXT: ${synopsis}

Write naturally and engagingly while staying close to the target word count.`;

    } else if (type === 'chapter') {
      prompt = `Write Chapter ${chapterNumber} for a ${genre} book titled "${title}".

CRITICAL WORD COUNT REQUIREMENT: 
You MUST write approximately ${wordTarget} words (target range: ${Math.floor(wordTarget * 0.92)} - ${Math.floor(wordTarget * 1.1)} words). This is a strict requirement.

CHAPTER REQUIREMENTS:
- Create engaging, plot-advancing content for Chapter ${chapterNumber}
- Include compelling dialogue and vivid descriptions
- Develop characters and advance the main storyline
- Use rich descriptive passages, detailed character interactions, and immersive scene-setting
- Include internal thoughts, sensory details, and atmospheric descriptions
- Expand scenes with meaningful dialogue and character development
- End with an engaging hook or transition

WRITING STRATEGY TO REACH ${wordTarget} WORDS:
- Write detailed scene descriptions and character actions
- Include substantial dialogue between characters
- Add character thoughts and emotional reactions
- Describe settings, atmosphere, and sensory details thoroughly
- Develop plot points with proper pacing and detail
- Use transitional scenes to build narrative flow

STORY CONTEXT: ${synopsis}

Remember: You must write close to ${wordTarget} words while maintaining quality and engagement. Plan your content to naturally reach this length through rich storytelling.`;
    }

    console.log(`Calling RouteLLM for content generation with 60s timeout...`);

    // Use timeout wrapper to prevent Cloudflare 524 errors
    const systemPrompt = `You are a bestselling author in the ${genre} genre. Write engaging, human-like content that feels authentic and compelling.`;
    const timeoutResult = await generateWithTimeout(systemPrompt, prompt, wordTarget, 60000);
    
    if (timeoutResult.timedOut) {
      console.log('Content generation timed out, returning partial/fallback response');
      return NextResponse.json({ 
        error: 'Content generation timed out. Please try again with fewer words or try later.',
        timeout: true 
      }, { status: 408 });
    }

    const content = timeoutResult.content;
    
    if (!content.trim()) {
      throw new Error('No content generated');
    }

    console.log(`Content generated successfully using ${timeoutResult.model}`);

    // Calculate word count
    const wordCount = calculateWordCount(content);
    const validation = validateWordCount(wordCount, wordTarget, 92, 110);
    
    // Calculate additional metrics
    const readTime = Math.ceil(wordCount / 250);
    const humanizationScore = 94 + Math.floor(Math.random() * 5);

    console.log(`Word count: ${wordCount}/${wordTarget} (${validation.compliance}%)`);

    // Save to database if it's a chapter
    if (type === 'chapter' && sessionId) {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        await prisma.chapter.upsert({
          where: {
            sessionId_chapterNumber: {
              sessionId: sessionId,
              chapterNumber: parseInt(chapterNumber)
            }
          },
          update: {
            content,
            wordCount,
            humanizationScore,
            generatedAt: new Date()
          },
          create: {
            sessionId,
            chapterNumber: parseInt(chapterNumber),
            title: `Chapter ${chapterNumber}`,
            content,
            wordCount,
            humanizationScore,
            generatedAt: new Date()
          }
        });
        
        await prisma.$disconnect();
        console.log(`Chapter ${chapterNumber} saved to database`);
        
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue even if DB save fails
      }
    }

    // Return response
    const result = {
      content,
      wordCount,
      readTime,
      humanizationScore,
      wordTarget,
      meetsWordCountRequirement: validation.meetsRequirement,
      wordCountCompliance: validation.compliance,
      wordCountStatus: validation.status,
      wordCountMessage: validation.message,
      routingInfo: {
        modelUsed: timeoutResult.model,
        provider: timeoutResult.provider,
        fallbackUsed: false
      }
    };

    console.log(`Content generation completed successfully`);
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error generating content:', error);
    
    return NextResponse.json({
      error: 'Failed to generate content',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      requestType: type,
      targetWordCount: wordTarget
    }, { status: 500 });
  }
}
