
import { NextRequest, NextResponse } from 'next/server';
import { ChapterRecommendations } from '@/lib/types';

// Genre-based chapter count recommendations based on analysis of bestselling books
const GENRE_CHAPTER_RECOMMENDATIONS: Record<string, ChapterRecommendations> = {
  'romance': {
    genre: 'Romance',
    recommendedChapters: 25,
    recommendedWordsPerChapter: 3000,
    totalWordTarget: 75000,
    chapterStructure: { opening: 3, rising: 10, climax: 4, falling: 5, resolution: 3 },
    reasoning: 'Romance novels benefit from a steady emotional build-up. The 25-chapter structure allows for gradual relationship development, with plenty of room for meet-cute moments, conflicts, and satisfying resolutions. Top romance bestsellers average 70,000-80,000 words.',
    topBooksReference: [
      { title: 'Pride and Prejudice', author: 'Jane Austen', chapterCount: 61, avgWordsPerChapter: 2000, totalWords: 122000, structure: 'Epistolary with short chapters' },
      { title: 'The Notebook', author: 'Nicholas Sparks', chapterCount: 24, avgWordsPerChapter: 2500, totalWords: 60000, structure: 'Dual timeline' },
      { title: 'Outlander', author: 'Diana Gabaldon', chapterCount: 43, avgWordsPerChapter: 7000, totalWords: 305000, structure: 'Epic saga format' },
      { title: 'Beach Read', author: 'Emily Henry', chapterCount: 28, avgWordsPerChapter: 2800, totalWords: 78000, structure: 'Contemporary pacing' },
    ],
    paceGuidelines: [
      'First 3 chapters: Establish protagonists separately, hint at chemistry',
      'Chapters 4-13: Build attraction through forced proximity or shared goals',
      'Chapters 14-17: Major conflict or "dark moment" that separates leads',
      'Chapters 18-22: Resolution of conflicts, grand gestures',
      'Final chapters: Happily ever after with emotional payoff'
    ],
    structureTips: [
      'Include a "meet-cute" in the first 2 chapters',
      'Plan 3-4 romantic escalation beats',
      'Place the "black moment" at 65-70% mark',
      'End chapters on emotional hooks to maintain page-turner quality'
    ]
  },
  'mystery': {
    genre: 'Mystery',
    recommendedChapters: 30,
    recommendedWordsPerChapter: 2500,
    totalWordTarget: 75000,
    chapterStructure: { opening: 3, rising: 15, climax: 5, falling: 4, resolution: 3 },
    reasoning: 'Mystery novels require careful clue placement and red herrings. The 30-chapter structure provides ample opportunity to introduce suspects, plant evidence, and build suspense. Shorter chapters keep readers turning pages.',
    topBooksReference: [
      { title: 'Gone Girl', author: 'Gillian Flynn', chapterCount: 55, avgWordsPerChapter: 2200, totalWords: 120000, structure: 'Dual POV with short chapters' },
      { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', chapterCount: 28, avgWordsPerChapter: 5000, totalWords: 140000, structure: 'Multiple storylines converging' },
      { title: 'And Then There Were None', author: 'Agatha Christie', chapterCount: 16, avgWordsPerChapter: 3500, totalWords: 56000, structure: 'Isolated setting, countdown' },
      { title: 'Big Little Lies', author: 'Liane Moriarty', chapterCount: 80, avgWordsPerChapter: 1200, totalWords: 96000, structure: 'Multiple POV, short chapters' },
    ],
    paceGuidelines: [
      'First 3 chapters: Introduce crime/mystery and protagonist detective',
      'Chapters 4-18: Investigate suspects, plant clues and red herrings',
      'Chapters 19-23: Major revelation or twist that changes investigation',
      'Chapters 24-27: Race to solve before consequences',
      'Final chapters: Reveal, confrontation, and aftermath'
    ],
    structureTips: [
      'End each chapter with a hook or mini-cliffhanger',
      'Introduce the victim or crime by chapter 3',
      'Plant the crucial clue early but make it seem insignificant',
      'Include at least 3 viable suspects with clear motives'
    ]
  },
  'fantasy': {
    genre: 'Fantasy',
    recommendedChapters: 35,
    recommendedWordsPerChapter: 4000,
    totalWordTarget: 140000,
    chapterStructure: { opening: 5, rising: 15, climax: 6, falling: 5, resolution: 4 },
    reasoning: 'Fantasy requires extensive world-building alongside plot development. Longer chapters allow for immersive descriptions while the higher chapter count supports complex magic systems, multiple characters, and epic scope. Fantasy readers expect substantial books.',
    topBooksReference: [
      { title: 'The Fellowship of the Ring', author: 'J.R.R. Tolkien', chapterCount: 22, avgWordsPerChapter: 8000, totalWords: 177000, structure: 'Quest narrative, episodic' },
      { title: "Harry Potter and the Philosopher's Stone", author: 'J.K. Rowling', chapterCount: 17, avgWordsPerChapter: 4700, totalWords: 77000, structure: 'Academic year structure' },
      { title: 'A Game of Thrones', author: 'George R.R. Martin', chapterCount: 73, avgWordsPerChapter: 4000, totalWords: 292000, structure: 'Multiple POV chapters' },
      { title: 'The Name of the Wind', author: 'Patrick Rothfuss', chapterCount: 92, avgWordsPerChapter: 2700, totalWords: 250000, structure: 'Frame narrative, short chapters' },
    ],
    paceGuidelines: [
      'First 5 chapters: Establish ordinary world, introduce protagonist, hint at magic',
      'Chapters 6-20: Call to adventure, gathering allies, learning abilities',
      'Chapters 21-26: Major setback, loss, or betrayal',
      'Chapters 27-31: Prepare for final confrontation, last revelations',
      'Final chapters: Climactic battle/confrontation and new status quo'
    ],
    structureTips: [
      'Weave world-building into action, not info-dumps',
      'Introduce magical rules early and stay consistent',
      'Include a mentor figure who provides exposition naturally',
      'Plan for series potential while delivering a complete arc'
    ]
  },
  'thriller': {
    genre: 'Thriller',
    recommendedChapters: 40,
    recommendedWordsPerChapter: 2000,
    totalWordTarget: 80000,
    chapterStructure: { opening: 3, rising: 20, climax: 8, falling: 5, resolution: 4 },
    reasoning: 'Thrillers demand relentless pacing with short, punchy chapters that create a can\'t-stop-reading effect. The 40-chapter structure with shorter chapters maintains constant tension and allows for rapid scene changes and cliffhangers.',
    topBooksReference: [
      { title: 'The Silence of the Lambs', author: 'Thomas Harris', chapterCount: 61, avgWordsPerChapter: 1500, totalWords: 90000, structure: 'Alternating timelines' },
      { title: 'The Da Vinci Code', author: 'Dan Brown', chapterCount: 105, avgWordsPerChapter: 850, totalWords: 89000, structure: 'Ultra-short chapters, constant cliffhangers' },
      { title: 'The Girl on the Train', author: 'Paula Hawkins', chapterCount: 107, avgWordsPerChapter: 800, totalWords: 85000, structure: 'Multiple POV, diary format' },
      { title: 'Gone', author: 'Michael Grant', chapterCount: 52, avgWordsPerChapter: 2300, totalWords: 120000, structure: 'Multiple POV, survival thriller' },
    ],
    paceGuidelines: [
      'First 3 chapters: Hook reader with danger or mystery, establish stakes',
      'Chapters 4-23: Escalating threats, narrow escapes, revelations',
      'Chapters 24-31: Major twist, everything protagonist knew is wrong',
      'Chapters 32-36: Race against time, highest stakes',
      'Final chapters: Confrontation, resolution, possible sequel hook'
    ],
    structureTips: [
      'Every chapter must end with urgency or question',
      'Keep chapters under 2500 words for pacing',
      'Introduce the antagonist\'s perspective strategically',
      'Maintain a ticking clock element throughout'
    ]
  },
  'science-fiction': {
    genre: 'Science Fiction',
    recommendedChapters: 30,
    recommendedWordsPerChapter: 3500,
    totalWordTarget: 105000,
    chapterStructure: { opening: 4, rising: 13, climax: 5, falling: 5, resolution: 3 },
    reasoning: 'Science fiction balances world-building with narrative momentum. The 30-chapter structure allows for exploration of technological concepts and their implications while maintaining story progression. Readers expect intellectual engagement alongside adventure.',
    topBooksReference: [
      { title: 'Dune', author: 'Frank Herbert', chapterCount: 22, avgWordsPerChapter: 8500, totalWords: 187000, structure: 'Epic narrative with appendices' },
      { title: "Ender's Game", author: 'Orson Scott Card', chapterCount: 15, avgWordsPerChapter: 6700, totalWords: 100000, structure: 'Military academy arc' },
      { title: 'The Martian', author: 'Andy Weir', chapterCount: 26, avgWordsPerChapter: 3500, totalWords: 91000, structure: 'Log entries and third-person mix' },
      { title: 'Project Hail Mary', author: 'Andy Weir', chapterCount: 31, avgWordsPerChapter: 3000, totalWords: 93000, structure: 'Dual timeline, problem-solving focus' },
    ],
    paceGuidelines: [
      'First 4 chapters: Establish setting, technology, and protagonist\'s role',
      'Chapters 5-17: Discover the central problem/conflict, gather resources',
      'Chapters 18-22: Major complication, technology fails or reveals danger',
      'Chapters 23-27: Apply learned knowledge to solve crisis',
      'Final chapters: Resolution and implications for humanity/future'
    ],
    structureTips: [
      'Introduce technology through character interaction, not exposition',
      'Ground speculative elements in real science where possible',
      'Use chapter breaks to shift between macro and micro perspectives',
      'Include a "sense of wonder" moment every 5-7 chapters'
    ]
  },
  'horror': {
    genre: 'Horror',
    recommendedChapters: 28,
    recommendedWordsPerChapter: 2800,
    totalWordTarget: 78000,
    chapterStructure: { opening: 4, rising: 12, climax: 5, falling: 4, resolution: 3 },
    reasoning: 'Horror requires building dread gradually while punctuating with scares. The 28-chapter structure allows for slow-burn tension with strategic payoffs. Chapter lengths vary to control pacing—longer for atmosphere, shorter for action.',
    topBooksReference: [
      { title: 'It', author: 'Stephen King', chapterCount: 23, avgWordsPerChapter: 20000, totalWords: 445000, structure: 'Dual timeline epic' },
      { title: 'The Shining', author: 'Stephen King', chapterCount: 58, avgWordsPerChapter: 2600, totalWords: 150000, structure: 'Isolated setting, psychological build' },
      { title: 'Pet Sematary', author: 'Stephen King', chapterCount: 60, avgWordsPerChapter: 2000, totalWords: 120000, structure: 'Slow-burn domestic horror' },
      { title: 'Mexican Gothic', author: 'Silvia Moreno-Garcia', chapterCount: 31, avgWordsPerChapter: 2500, totalWords: 78000, structure: 'Gothic atmosphere, mystery elements' },
    ],
    paceGuidelines: [
      'First 4 chapters: Establish normalcy, introduce location, hint at wrongness',
      'Chapters 5-16: Escalating strange events, protagonist investigates',
      'Chapters 17-21: Full horror revealed, highest danger',
      'Chapters 22-25: Fight or flight, major losses possible',
      'Final chapters: Survival or tragic ending, lingering unease'
    ],
    structureTips: [
      'End chapters at moments of maximum tension',
      'Alternate between dread-building and action sequences',
      'Use shorter chapters during intense sequences',
      'Leave some questions unanswered for lasting effect'
    ]
  },
  'historical-fiction': {
    genre: 'Historical Fiction',
    recommendedChapters: 32,
    recommendedWordsPerChapter: 3200,
    totalWordTarget: 102000,
    chapterStructure: { opening: 4, rising: 14, climax: 6, falling: 5, resolution: 3 },
    reasoning: 'Historical fiction must balance period detail with narrative drive. The 32-chapter structure provides room for immersive historical context while maintaining modern pacing expectations. Readers seek both education and entertainment.',
    topBooksReference: [
      { title: 'The Pillars of the Earth', author: 'Ken Follett', chapterCount: 18, avgWordsPerChapter: 20000, totalWords: 360000, structure: 'Decade-spanning epic' },
      { title: 'All the Light We Cannot See', author: 'Anthony Doerr', chapterCount: 165, avgWordsPerChapter: 600, totalWords: 99000, structure: 'Vignette style, short chapters' },
      { title: 'The Book Thief', author: 'Markus Zusak', chapterCount: 88, avgWordsPerChapter: 1000, totalWords: 88000, structure: 'Unique narrator, episodic' },
      { title: 'Pachinko', author: 'Min Jin Lee', chapterCount: 36, avgWordsPerChapter: 3000, totalWords: 108000, structure: 'Generational saga' },
    ],
    paceGuidelines: [
      'First 4 chapters: Establish time period, social context, protagonist\'s world',
      'Chapters 5-18: Personal story intersects with historical events',
      'Chapters 19-24: Historical crisis impacts protagonist directly',
      'Chapters 25-29: Navigate through historical climax',
      'Final chapters: Resolution that acknowledges historical reality'
    ],
    structureTips: [
      'Weave historical details into character experience, not lectures',
      'Use period-appropriate language without being inaccessible',
      'Connect personal stakes to larger historical movements',
      'Include author\'s note distinguishing fact from fiction'
    ]
  },
  'young-adult': {
    genre: 'Young Adult',
    recommendedChapters: 25,
    recommendedWordsPerChapter: 2800,
    totalWordTarget: 70000,
    chapterStructure: { opening: 3, rising: 11, climax: 5, falling: 4, resolution: 2 },
    reasoning: 'YA readers expect fast pacing and relatable protagonists facing identity-defining challenges. The 25-chapter structure maintains momentum while allowing for character development. First-person narration is common and enhances connection.',
    topBooksReference: [
      { title: 'The Hunger Games', author: 'Suzanne Collins', chapterCount: 27, avgWordsPerChapter: 3500, totalWords: 99000, structure: 'Three-act survival narrative' },
      { title: 'Twilight', author: 'Stephenie Meyer', chapterCount: 24, avgWordsPerChapter: 5000, totalWords: 119000, structure: 'Romance-focused, first person' },
      { title: 'The Fault in Our Stars', author: 'John Green', chapterCount: 25, avgWordsPerChapter: 2800, totalWords: 70000, structure: 'Contemporary, first person' },
      { title: 'Six of Crows', author: 'Leigh Bardugo', chapterCount: 46, avgWordsPerChapter: 2500, totalWords: 115000, structure: 'Multiple POV heist' },
    ],
    paceGuidelines: [
      'First 3 chapters: Establish protagonist\'s ordinary world and dissatisfaction',
      'Chapters 4-14: Inciting incident, new world, forming relationships',
      'Chapters 15-19: Major conflict or betrayal, identity crisis',
      'Chapters 20-23: Growth, acceptance, preparing for final challenge',
      'Final chapters: Confrontation and earned transformation'
    ],
    structureTips: [
      'Start with a strong voice that hooks immediately',
      'Include authentic teen dialogue and concerns',
      'Build a found family or close friendship group',
      'End chapters with emotional or action hooks'
    ]
  },
  'literary-fiction': {
    genre: 'Literary Fiction',
    recommendedChapters: 22,
    recommendedWordsPerChapter: 4000,
    totalWordTarget: 88000,
    chapterStructure: { opening: 4, rising: 9, climax: 4, falling: 3, resolution: 2 },
    reasoning: 'Literary fiction prioritizes prose quality and thematic depth over plot mechanics. The 22-chapter structure allows for contemplative pacing and careful character development. Internal journey often matters more than external events.',
    topBooksReference: [
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', chapterCount: 9, avgWordsPerChapter: 5500, totalWords: 49000, structure: 'Compact, symbolic' },
      { title: 'Beloved', author: 'Toni Morrison', chapterCount: 28, avgWordsPerChapter: 3500, totalWords: 100000, structure: 'Non-linear, poetic' },
      { title: 'The Kite Runner', author: 'Khaled Hosseini', chapterCount: 25, avgWordsPerChapter: 4000, totalWords: 100000, structure: 'Memory-driven narrative' },
      { title: 'Normal People', author: 'Sally Rooney', chapterCount: 22, avgWordsPerChapter: 3000, totalWords: 66000, structure: 'Episodic, dialogue-heavy' },
    ],
    paceGuidelines: [
      'First 4 chapters: Establish voice, introduce central relationship or theme',
      'Chapters 5-13: Deepen characterization, explore thematic questions',
      'Chapters 14-17: Culmination of internal/external conflicts',
      'Chapters 18-20: Aftermath and reflection',
      'Final chapters: Resolution or deliberate ambiguity'
    ],
    structureTips: [
      'Prioritize prose style and thematic coherence',
      'Allow for quiet moments of reflection',
      'Use symbolic elements to deepen meaning',
      'Trust readers to engage with ambiguity'
    ]
  },
  'memoir': {
    genre: 'Memoir',
    recommendedChapters: 20,
    recommendedWordsPerChapter: 3500,
    totalWordTarget: 70000,
    chapterStructure: { opening: 3, rising: 8, climax: 4, falling: 3, resolution: 2 },
    reasoning: 'Memoirs benefit from focused storytelling around specific themes or periods. The 20-chapter structure allows for meaningful reflection while maintaining narrative drive. Each chapter should reveal something significant about the author\'s journey.',
    topBooksReference: [
      { title: 'Educated', author: 'Tara Westover', chapterCount: 40, avgWordsPerChapter: 2500, totalWords: 100000, structure: 'Chronological with thematic chapters' },
      { title: 'The Glass Castle', author: 'Jeannette Walls', chapterCount: 68, avgWordsPerChapter: 1200, totalWords: 82000, structure: 'Vignette style, short chapters' },
      { title: 'Born a Crime', author: 'Trevor Noah', chapterCount: 18, avgWordsPerChapter: 5000, totalWords: 90000, structure: 'Themed chapters with essays' },
      { title: 'Crying in H Mart', author: 'Michelle Zauner', chapterCount: 20, avgWordsPerChapter: 4000, totalWords: 80000, structure: 'Memory-driven, thematic' },
    ],
    paceGuidelines: [
      'First 3 chapters: Establish central theme/conflict and narrative voice',
      'Chapters 4-11: Key memories and experiences that shaped you',
      'Chapters 12-15: Turning point or crisis moment',
      'Chapters 16-18: Processing, growth, realizations',
      'Final chapters: Where you are now, what you learned'
    ],
    structureTips: [
      'Organize around themes rather than strict chronology',
      'Include sensory details that bring memories to life',
      'Be honest about your own flaws and growth',
      'Connect personal experience to universal themes'
    ]
  }
};

export async function POST(request: NextRequest) {
  try {
    const { action, genre, customConfig } = await request.json();

    if (action === 'getRecommendations') {
      // Get genre-based recommendations
      const genreKey = genre?.toLowerCase().replace(/\s+/g, '-') || 'literary-fiction';
      const recommendations = GENRE_CHAPTER_RECOMMENDATIONS[genreKey] || GENRE_CHAPTER_RECOMMENDATIONS['literary-fiction'];

      return NextResponse.json({
        success: true,
        recommendations,
        availableGenres: Object.keys(GENRE_CHAPTER_RECOMMENDATIONS)
      });
    }

    if (action === 'customizeConfig') {
      // User wants to customize based on recommendations
      const genreKey = genre?.toLowerCase().replace(/\s+/g, '-') || 'literary-fiction';
      const baseRecommendations = GENRE_CHAPTER_RECOMMENDATIONS[genreKey] || GENRE_CHAPTER_RECOMMENDATIONS['literary-fiction'];

      // Merge custom config with base recommendations
      const customized = {
        ...baseRecommendations,
        recommendedChapters: customConfig?.chapters || baseRecommendations.recommendedChapters,
        recommendedWordsPerChapter: customConfig?.wordsPerChapter || baseRecommendations.recommendedWordsPerChapter,
        totalWordTarget: (customConfig?.chapters || baseRecommendations.recommendedChapters) * 
                        (customConfig?.wordsPerChapter || baseRecommendations.recommendedWordsPerChapter),
      };

      // Recalculate chapter structure distribution if chapters changed
      if (customConfig?.chapters && customConfig.chapters !== baseRecommendations.recommendedChapters) {
        const total = customConfig.chapters;
        customized.chapterStructure = {
          opening: Math.max(2, Math.round(total * 0.12)),
          rising: Math.round(total * 0.42),
          climax: Math.round(total * 0.16),
          falling: Math.round(total * 0.16),
          resolution: Math.max(2, Math.round(total * 0.14))
        };
        // Ensure totals match
        const sum = Object.values(customized.chapterStructure).reduce((a, b) => a + b, 0);
        if (sum !== total) {
          customized.chapterStructure.rising += (total - sum);
        }
      }

      return NextResponse.json({
        success: true,
        recommendations: customized
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Chapter plan API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chapter plan request' },
      { status: 500 }
    );
  }
}
