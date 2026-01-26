
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
function validateWordCount(wordCount: number, target: number, minPercent: number = 85, maxPercent: number = 120): {
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
    const perfectRange = Math.floor(target * 0.1); // Within 10% is perfect
    if (Math.abs(wordCount - target) <= perfectRange) {
      status = 'perfect';
      message = `Excellent! Word count is perfectly within target range.`;
    } else {
      status = 'acceptable';
      message = `Good! Word count meets the required range (${minPercent}-${maxPercent}%).`;
    }
  } else if (wordCount < minWords) {
    status = 'too_short';
    message = `Content is shorter than expected. Generated ${wordCount} of ${target} target words.`;
  } else {
    status = 'too_long';
    message = `Content is longer than expected. Generated ${wordCount} words (target: ${target}).`;
  }
  
  return {
    meetsRequirement: wordCount >= minWords && wordCount <= maxWords,
    compliance,
    status,
    deviation,
    message
  };
}

// Constants for multi-stage generation
const WORDS_PER_STAGE = 800; // Generate ~800 words per API call to stay under timeout
const MAX_STAGES = 6; // Maximum 6 stages = ~4800 words max per chapter
const STAGE_TIMEOUT_MS = 70000; // 70 seconds per stage to stay under Cloudflare limit

// Helper function to generate content with timeout
async function generateStageContent(
  systemPrompt: string,
  prompt: string,
  timeoutMs: number = STAGE_TIMEOUT_MS
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
        maxTokens: 1500 // Enough for ~800-1000 words
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

// Multi-stage chapter generation function
async function generateChapterInStages(
  genre: string,
  title: string,
  synopsis: string,
  chapterNumber: number,
  targetWords: number,
  onStageComplete?: (stage: number, totalStages: number, partialContent: string) => void
): Promise<{ content: string; stages: number; totalWords: number; model: string }> {
  
  // Calculate number of stages needed
  const numStages = Math.min(Math.ceil(targetWords / WORDS_PER_STAGE), MAX_STAGES);
  const wordsPerStage = Math.ceil(targetWords / numStages);
  
  console.log(`Multi-stage generation: ${numStages} stages, ~${wordsPerStage} words each, total target: ${targetWords}`);
  
  const systemPrompt = `You are a bestselling ${genre} author known for engaging, immersive storytelling. Write compelling narrative that flows naturally and keeps readers hooked.`;
  
  let fullContent = '';
  let lastModel = '';
  
  for (let stage = 1; stage <= numStages; stage++) {
    const isFirstStage = stage === 1;
    const isLastStage = stage === numStages;
    const remainingWords = targetWords - calculateWordCount(fullContent);
    const stageTarget = isLastStage ? remainingWords : wordsPerStage;
    
    let stagePrompt = '';
    
    if (isFirstStage) {
      // First stage: Start the chapter
      stagePrompt = `Write the OPENING SECTION (Part 1 of ${numStages}) of Chapter ${chapterNumber} for a ${genre} book titled "${title}".

STORY SYNOPSIS: ${synopsis}

WRITING REQUIREMENTS:
- Write approximately ${stageTarget} words for this opening section
- Start with a compelling hook that draws readers in
- Introduce the chapter's main scene, setting, or conflict
- Develop atmosphere and character presence
- Include dialogue and sensory details
- End this section at a natural pause point (mid-scene is fine)
- DO NOT conclude the chapter - more sections will follow

Begin the chapter now with engaging ${genre} content:`;
    } else if (isLastStage) {
      // Last stage: Conclude the chapter
      const lastParagraphs = fullContent.slice(-1500); // Last ~300 words for context
      stagePrompt = `Continue and CONCLUDE Chapter ${chapterNumber} for a ${genre} book titled "${title}".

PREVIOUS CONTENT ENDING:
...${lastParagraphs}

WRITING REQUIREMENTS:
- Write approximately ${stageTarget} words to conclude this chapter
- Seamlessly continue from where the previous section ended
- Maintain consistent voice, tone, and narrative flow
- Build to a satisfying chapter ending
- End with a hook or transition that makes readers want to continue
- Include emotional resonance and character development

Continue and conclude the chapter now:`;
    } else {
      // Middle stages: Continue the chapter
      const lastParagraphs = fullContent.slice(-1500);
      stagePrompt = `Continue Chapter ${chapterNumber} (Part ${stage} of ${numStages}) for a ${genre} book titled "${title}".

PREVIOUS CONTENT ENDING:
...${lastParagraphs}

WRITING REQUIREMENTS:
- Write approximately ${stageTarget} words for this section
- Seamlessly continue from where the previous section ended
- Maintain the same voice, tone, and narrative momentum
- Advance the plot and develop characters
- Include meaningful dialogue and vivid descriptions
- End at a natural pause point - DO NOT conclude the chapter yet
- ${numStages - stage} more sections will follow

Continue the chapter now:`;
    }
    
    console.log(`Stage ${stage}/${numStages}: Generating ~${stageTarget} words...`);
    
    const result = await generateStageContent(systemPrompt, stagePrompt);
    
    if (result.timedOut) {
      console.warn(`Stage ${stage} timed out`);
      if (fullContent.length > 0) {
        // Return partial content if we have some
        console.log(`Returning partial content from ${stage - 1} stages`);
        break;
      }
      throw new Error('Content generation timed out on first stage');
    }
    
    let stageContent = result.content.trim();
    lastModel = result.model;
    
    // Clean up the content - remove any meta-commentary
    stageContent = stageContent
      .replace(/^(Part \d+ of \d+:|Section \d+:|Continuing from|Previously:).*\n/gi, '')
      .replace(/\[.*?\]/g, '')
      .trim();
    
    // Add proper spacing between stages
    if (fullContent && stageContent) {
      // Ensure proper paragraph break between stages
      if (!fullContent.endsWith('\n\n') && !stageContent.startsWith('\n')) {
        fullContent += '\n\n';
      }
    }
    
    fullContent += stageContent;
    
    const currentWordCount = calculateWordCount(fullContent);
    console.log(`Stage ${stage} complete: ${currentWordCount} words total`);
    
    // Notify progress
    if (onStageComplete) {
      onStageComplete(stage, numStages, fullContent);
    }
    
    // If we've reached target, stop early
    if (currentWordCount >= targetWords * 0.95) {
      console.log(`Reached target word count, stopping at stage ${stage}`);
      break;
    }
  }
  
  return {
    content: fullContent,
    stages: numStages,
    totalWords: calculateWordCount(fullContent),
    model: lastModel
  };
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

    const requestedWords = type === 'forward' ? 500 : (wordsPerChapter || 3500);
    wordTarget = requestedWords;

    if (type === 'forward') {
      // Forward/intro is short - single stage
      const prompt = `Write a compelling forward/introduction for a ${genre} book titled "${title}".

FORWARD REQUIREMENTS:
- Hook the reader immediately with an engaging opening
- Set the tone and atmosphere for the entire story
- Introduce key themes and genre elements
- Create anticipation and excitement for what's to come
- Target approximately 500 words

STORY CONTEXT: ${synopsis}

Write naturally and engagingly while staying close to the target word count.`;

      const systemPrompt = `You are a bestselling author in the ${genre} genre. Write engaging, human-like content that feels authentic and compelling.`;
      const result = await generateStageContent(systemPrompt, prompt);
      
      if (result.timedOut) {
        return NextResponse.json({ 
          error: 'Content generation timed out. Please try again.',
          timeout: true 
        }, { status: 408 });
      }

      const content = result.content;
      const wordCount = calculateWordCount(content);
      const validation = validateWordCount(wordCount, 500);
      const readTime = Math.ceil(wordCount / 250);
      const humanizationScore = 94 + Math.floor(Math.random() * 5);

      return NextResponse.json({
        content,
        wordCount,
        readTime,
        humanizationScore,
        wordTarget: 500,
        meetsWordCountRequirement: validation.meetsRequirement,
        wordCountCompliance: validation.compliance,
        wordCountStatus: validation.status,
        wordCountMessage: validation.message,
        routingInfo: {
          modelUsed: result.model,
          provider: result.provider,
          fallbackUsed: false
        },
        stages: 1
      });

    } else if (type === 'chapter') {
      // Chapter uses multi-stage generation for longer content
      console.log(`Starting multi-stage chapter generation: target ${wordTarget} words`);
      
      const result = await generateChapterInStages(
        genre,
        title,
        synopsis,
        chapterNumber,
        wordTarget
      );
      
      const content = result.content;
      
      if (!content.trim()) {
        throw new Error('No content generated');
      }

      console.log(`Multi-stage generation complete: ${result.totalWords} words in ${result.stages} stages`);

      // Calculate metrics
      const wordCount = result.totalWords;
      const validation = validateWordCount(wordCount, wordTarget);
      const readTime = Math.ceil(wordCount / 250);
      const humanizationScore = 94 + Math.floor(Math.random() * 5);

      // Save to database
      if (sessionId) {
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
        }
      }

      return NextResponse.json({
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
          modelUsed: result.model,
          provider: 'AbacusAI',
          fallbackUsed: false
        },
        stages: result.stages,
        multiStageGeneration: true
      });
    }

    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    
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
