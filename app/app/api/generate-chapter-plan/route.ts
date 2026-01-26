
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
  },
  'contemporary-fiction': {
    genre: 'Contemporary Fiction',
    recommendedChapters: 24,
    recommendedWordsPerChapter: 3500,
    totalWordTarget: 84000,
    chapterStructure: { opening: 3, rising: 10, climax: 5, falling: 4, resolution: 2 },
    reasoning: 'Contemporary fiction explores modern life with relatable characters and situations. The 24-chapter structure balances character development with plot progression, allowing exploration of current social themes.',
    topBooksReference: [
      { title: 'Where the Crawdads Sing', author: 'Delia Owens', chapterCount: 58, avgWordsPerChapter: 1800, totalWords: 104000, structure: 'Dual timeline, nature focus' },
      { title: 'The Midnight Library', author: 'Matt Haig', chapterCount: 60, avgWordsPerChapter: 1200, totalWords: 72000, structure: 'Episodic, philosophical' },
      { title: 'A Man Called Ove', author: 'Fredrik Backman', chapterCount: 39, avgWordsPerChapter: 2100, totalWords: 82000, structure: 'Character study, humor' },
      { title: 'Eleanor Oliphant Is Completely Fine', author: 'Gail Honeyman', chapterCount: 49, avgWordsPerChapter: 1700, totalWords: 83000, structure: 'First person, gradual reveal' },
    ],
    paceGuidelines: [
      'First 3 chapters: Establish protagonist\'s world and central conflict',
      'Chapters 4-13: Develop relationships and explore themes',
      'Chapters 14-18: Crisis or turning point',
      'Chapters 19-22: Resolution building',
      'Final chapters: Meaningful conclusion with emotional payoff'
    ],
    structureTips: [
      'Ground the story in specific, authentic details',
      'Use dialogue to reveal character',
      'Balance internal and external conflict',
      'Let theme emerge organically from story'
    ]
  },
  'adventure': {
    genre: 'Adventure',
    recommendedChapters: 30,
    recommendedWordsPerChapter: 3000,
    totalWordTarget: 90000,
    chapterStructure: { opening: 3, rising: 14, climax: 6, falling: 4, resolution: 3 },
    reasoning: 'Adventure novels thrive on action and discovery. The 30-chapter structure provides room for multiple set pieces, escalating challenges, and exploration while maintaining momentum.',
    topBooksReference: [
      { title: 'Treasure Island', author: 'Robert Louis Stevenson', chapterCount: 34, avgWordsPerChapter: 2000, totalWords: 68000, structure: 'Classic quest structure' },
      { title: 'The Count of Monte Cristo', author: 'Alexandre Dumas', chapterCount: 117, avgWordsPerChapter: 4000, totalWords: 464000, structure: 'Epic revenge saga' },
      { title: 'Life of Pi', author: 'Yann Martel', chapterCount: 100, avgWordsPerChapter: 1000, totalWords: 100000, structure: 'Survival narrative' },
      { title: 'Ready Player One', author: 'Ernest Cline', chapterCount: 39, avgWordsPerChapter: 2800, totalWords: 109000, structure: 'Quest with puzzles' },
    ],
    paceGuidelines: [
      'First 3 chapters: Establish hero and inciting adventure',
      'Chapters 4-17: Series of escalating challenges and discoveries',
      'Chapters 18-23: Darkest moment, major setback',
      'Chapters 24-27: Rally and final push',
      'Final chapters: Climactic confrontation and resolution'
    ],
    structureTips: [
      'End chapters on cliffhangers to maintain momentum',
      'Vary action scenes with quieter character moments',
      'Each challenge should raise the stakes',
      'The world itself can be a character'
    ]
  },
  'crime': {
    genre: 'Crime',
    recommendedChapters: 32,
    recommendedWordsPerChapter: 2800,
    totalWordTarget: 90000,
    chapterStructure: { opening: 3, rising: 15, climax: 6, falling: 5, resolution: 3 },
    reasoning: 'Crime fiction requires careful plotting with criminal activities, investigation, and justice. The 32-chapter structure allows for complex schemes, multiple perspectives, and satisfying reveals.',
    topBooksReference: [
      { title: 'The Godfather', author: 'Mario Puzo', chapterCount: 30, avgWordsPerChapter: 5000, totalWords: 150000, structure: 'Family saga, multiple POV' },
      { title: 'In Cold Blood', author: 'Truman Capote', chapterCount: 4, avgWordsPerChapter: 27500, totalWords: 110000, structure: 'True crime narrative' },
      { title: 'The Lincoln Lawyer', author: 'Michael Connelly', chapterCount: 38, avgWordsPerChapter: 2500, totalWords: 95000, structure: 'Legal thriller pacing' },
      { title: 'The Town', author: 'Chuck Hogan', chapterCount: 30, avgWordsPerChapter: 3000, totalWords: 90000, structure: 'Heist with character depth' },
    ],
    paceGuidelines: [
      'First 3 chapters: Establish crime world and protagonist',
      'Chapters 4-18: Develop scheme, build tension, show stakes',
      'Chapters 19-24: Complications and betrayals',
      'Chapters 25-29: Confrontation and consequences',
      'Final chapters: Justice (or lack thereof) and aftermath'
    ],
    structureTips: [
      'Create morally complex characters on both sides',
      'Show the human cost of crime',
      'Use procedural details to build authenticity',
      'Subvert expectations about heroes and villains'
    ]
  },
  'western': {
    genre: 'Western',
    recommendedChapters: 25,
    recommendedWordsPerChapter: 3200,
    totalWordTarget: 80000,
    chapterStructure: { opening: 3, rising: 11, climax: 5, falling: 4, resolution: 2 },
    reasoning: 'Western novels balance frontier action with themes of justice and survival. The 25-chapter structure accommodates journey narratives, showdowns, and character development in the expansive landscape.',
    topBooksReference: [
      { title: 'Lonesome Dove', author: 'Larry McMurtry', chapterCount: 100, avgWordsPerChapter: 4000, totalWords: 400000, structure: 'Epic journey' },
      { title: 'True Grit', author: 'Charles Portis', chapterCount: 7, avgWordsPerChapter: 7000, totalWords: 49000, structure: 'Compact revenge tale' },
      { title: 'Blood Meridian', author: 'Cormac McCarthy', chapterCount: 23, avgWordsPerChapter: 5500, totalWords: 127000, structure: 'Dark episodic journey' },
      { title: 'News of the World', author: 'Paulette Jiles', chapterCount: 14, avgWordsPerChapter: 5000, totalWords: 70000, structure: 'Road narrative' },
    ],
    paceGuidelines: [
      'First 3 chapters: Establish setting, protagonist, and inciting incident',
      'Chapters 4-14: Journey with escalating conflicts',
      'Chapters 15-19: Approach to final confrontation',
      'Chapters 20-23: Showdown and consequences',
      'Final chapters: New equilibrium on the frontier'
    ],
    structureTips: [
      'Let the landscape shape the narrative',
      'Use period-appropriate dialogue sparingly',
      'Balance action with moral complexity',
      'Explore themes of civilization vs. wilderness'
    ]
  },
  'paranormal': {
    genre: 'Paranormal',
    recommendedChapters: 28,
    recommendedWordsPerChapter: 3000,
    totalWordTarget: 84000,
    chapterStructure: { opening: 4, rising: 12, climax: 5, falling: 4, resolution: 3 },
    reasoning: 'Paranormal fiction blends supernatural elements with character-driven stories. The 28-chapter structure allows for world-building, supernatural rules, and romantic or mysterious subplots.',
    topBooksReference: [
      { title: 'Interview with the Vampire', author: 'Anne Rice', chapterCount: 4, avgWordsPerChapter: 24000, totalWords: 96000, structure: 'Interview frame, long chapters' },
      { title: 'A Discovery of Witches', author: 'Deborah Harkness', chapterCount: 40, avgWordsPerChapter: 3000, totalWords: 120000, structure: 'Paranormal romance' },
      { title: 'The Southern Book Club\'s Guide to Slaying Vampires', author: 'Grady Hendrix', chapterCount: 32, avgWordsPerChapter: 2800, totalWords: 90000, structure: 'Horror-comedy hybrid' },
      { title: 'Practical Magic', author: 'Alice Hoffman', chapterCount: 12, avgWordsPerChapter: 5500, totalWords: 66000, structure: 'Magical realism' },
    ],
    paceGuidelines: [
      'First 4 chapters: Introduce supernatural elements and protagonist',
      'Chapters 5-16: Explore paranormal world, develop relationships',
      'Chapters 17-21: Supernatural crisis escalates',
      'Chapters 22-25: Confrontation with supernatural forces',
      'Final chapters: Resolution balancing both worlds'
    ],
    structureTips: [
      'Establish clear rules for your supernatural elements',
      'Ground fantastical elements in emotional reality',
      'Use the paranormal to explore real human themes',
      'Balance wonder with danger'
    ]
  },
  'dystopian': {
    genre: 'Dystopian',
    recommendedChapters: 30,
    recommendedWordsPerChapter: 3200,
    totalWordTarget: 96000,
    chapterStructure: { opening: 4, rising: 13, climax: 6, falling: 4, resolution: 3 },
    reasoning: 'Dystopian novels require world-building to establish oppressive systems before the protagonist can challenge them. The 30-chapter structure supports revelation, rebellion, and transformation.',
    topBooksReference: [
      { title: '1984', author: 'George Orwell', chapterCount: 23, avgWordsPerChapter: 4000, totalWords: 92000, structure: 'Three-part political thriller' },
      { title: 'The Handmaid\'s Tale', author: 'Margaret Atwood', chapterCount: 46, avgWordsPerChapter: 2000, totalWords: 92000, structure: 'Fragmented first person' },
      { title: 'Brave New World', author: 'Aldous Huxley', chapterCount: 18, avgWordsPerChapter: 3500, totalWords: 63000, structure: 'World-building focus' },
      { title: 'Station Eleven', author: 'Emily St. John Mandel', chapterCount: 55, avgWordsPerChapter: 1600, totalWords: 88000, structure: 'Non-linear, multiple POV' },
    ],
    paceGuidelines: [
      'First 4 chapters: Establish dystopian world and protagonist\'s place',
      'Chapters 5-17: Discovery of truth, growing resistance',
      'Chapters 18-23: Point of no return, open rebellion',
      'Chapters 24-27: Climactic struggle against the system',
      'Final chapters: Outcome and implications for the future'
    ],
    structureTips: [
      'Show the dystopia through daily life, not exposition',
      'Create believable mechanisms of control',
      'Balance personal and political stakes',
      'Let the ending reflect your thematic intent'
    ]
  },
  'comedy': {
    genre: 'Comedy',
    recommendedChapters: 22,
    recommendedWordsPerChapter: 3000,
    totalWordTarget: 66000,
    chapterStructure: { opening: 3, rising: 9, climax: 4, falling: 4, resolution: 2 },
    reasoning: 'Comedy novels require tight pacing for maximum comedic effect. The 22-chapter structure keeps the humor flowing while allowing for character development and satisfying story arcs.',
    topBooksReference: [
      { title: 'Good Omens', author: 'Terry Pratchett & Neil Gaiman', chapterCount: 28, avgWordsPerChapter: 3500, totalWords: 98000, structure: 'Ensemble comedy' },
      { title: 'The Hitchhiker\'s Guide to the Galaxy', author: 'Douglas Adams', chapterCount: 35, avgWordsPerChapter: 1500, totalWords: 52000, structure: 'Episodic absurdist' },
      { title: 'Bridget Jones\'s Diary', author: 'Helen Fielding', chapterCount: 12, avgWordsPerChapter: 6000, totalWords: 72000, structure: 'Diary format' },
      { title: 'Anxious People', author: 'Fredrik Backman', chapterCount: 63, avgWordsPerChapter: 1200, totalWords: 76000, structure: 'Chaotic ensemble' },
    ],
    paceGuidelines: [
      'First 3 chapters: Establish comedic tone and protagonist\'s flaw',
      'Chapters 4-12: Escalating absurdity and complications',
      'Chapters 13-16: Maximum chaos, everything goes wrong',
      'Chapters 17-20: Unexpected resolution to complications',
      'Final chapters: Heartfelt conclusion beneath the humor'
    ],
    structureTips: [
      'Ground humor in relatable character flaws',
      'Build running gags that pay off later',
      'Balance laugh-out-loud moments with heart',
      'Use chapter endings for punchlines or reversals'
    ]
  },
  'biography': {
    genre: 'Biography',
    recommendedChapters: 25,
    recommendedWordsPerChapter: 4000,
    totalWordTarget: 100000,
    chapterStructure: { opening: 3, rising: 11, climax: 5, falling: 4, resolution: 2 },
    reasoning: 'Biographies need space to cover a subject\'s life comprehensively while maintaining narrative drive. The 25-chapter structure allows for chronological development with thematic depth.',
    topBooksReference: [
      { title: 'Steve Jobs', author: 'Walter Isaacson', chapterCount: 42, avgWordsPerChapter: 4500, totalWords: 190000, structure: 'Chronological, detailed' },
      { title: 'Alexander Hamilton', author: 'Ron Chernow', chapterCount: 42, avgWordsPerChapter: 4800, totalWords: 202000, structure: 'Comprehensive historical' },
      { title: 'Becoming', author: 'Michelle Obama', chapterCount: 24, avgWordsPerChapter: 3500, totalWords: 84000, structure: 'Three-act personal journey' },
      { title: 'The Autobiography of Malcolm X', author: 'Malcolm X & Alex Haley', chapterCount: 19, avgWordsPerChapter: 5000, totalWords: 95000, structure: 'Transformation narrative' },
    ],
    paceGuidelines: [
      'First 3 chapters: Origins and formative experiences',
      'Chapters 4-14: Rise and key accomplishments',
      'Chapters 15-19: Challenges, conflicts, and turning points',
      'Chapters 20-23: Later career and legacy',
      'Final chapters: Assessment and lasting impact'
    ],
    structureTips: [
      'Find the narrative arc within the facts',
      'Balance achievement with personal struggle',
      'Use scenes and dialogue to bring history alive',
      'Connect individual story to broader context'
    ]
  },
  'self-help': {
    genre: 'Self-Help',
    recommendedChapters: 15,
    recommendedWordsPerChapter: 4000,
    totalWordTarget: 60000,
    chapterStructure: { opening: 2, rising: 7, climax: 3, falling: 2, resolution: 1 },
    reasoning: 'Self-help books need clear, actionable structure. The 15-chapter format provides focused content without overwhelming readers, with each chapter addressing a specific concept or technique.',
    topBooksReference: [
      { title: 'Atomic Habits', author: 'James Clear', chapterCount: 20, avgWordsPerChapter: 3500, totalWords: 70000, structure: 'Framework with examples' },
      { title: 'The 7 Habits of Highly Effective People', author: 'Stephen Covey', chapterCount: 15, avgWordsPerChapter: 6000, totalWords: 90000, structure: 'Principle-based chapters' },
      { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', chapterCount: 38, avgWordsPerChapter: 3500, totalWords: 133000, structure: 'Research-based exploration' },
      { title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson', chapterCount: 9, avgWordsPerChapter: 6500, totalWords: 58000, structure: 'Conversational, direct' },
    ],
    paceGuidelines: [
      'First 2 chapters: Hook reader with problem and promise',
      'Chapters 3-9: Core concepts and techniques',
      'Chapters 10-12: Advanced applications and common pitfalls',
      'Chapters 13-14: Integration and maintenance',
      'Final chapter: Call to action and resources'
    ],
    structureTips: [
      'Start each chapter with a compelling story or example',
      'Include actionable exercises and summaries',
      'Use research and data to support claims',
      'Make concepts memorable with frameworks'
    ]
  },
  'business': {
    genre: 'Business',
    recommendedChapters: 18,
    recommendedWordsPerChapter: 3500,
    totalWordTarget: 63000,
    chapterStructure: { opening: 2, rising: 9, climax: 3, falling: 3, resolution: 1 },
    reasoning: 'Business books need to balance insight with practicality. The 18-chapter structure allows for comprehensive coverage while respecting busy readers\' time.',
    topBooksReference: [
      { title: 'Good to Great', author: 'Jim Collins', chapterCount: 9, avgWordsPerChapter: 7000, totalWords: 63000, structure: 'Research findings format' },
      { title: 'Zero to One', author: 'Peter Thiel', chapterCount: 14, avgWordsPerChapter: 3500, totalWords: 49000, structure: 'Concise contrarian insights' },
      { title: 'The Lean Startup', author: 'Eric Ries', chapterCount: 13, avgWordsPerChapter: 4500, totalWords: 58000, structure: 'Framework and case studies' },
      { title: 'Shoe Dog', author: 'Phil Knight', chapterCount: 21, avgWordsPerChapter: 3000, totalWords: 63000, structure: 'Narrative memoir' },
    ],
    paceGuidelines: [
      'First 2 chapters: Establish central thesis and hook',
      'Chapters 3-11: Build framework with case studies',
      'Chapters 12-14: Address implementation challenges',
      'Chapters 15-17: Advanced strategies and scaling',
      'Final chapter: Summary and future outlook'
    ],
    structureTips: [
      'Lead with stories, then extract principles',
      'Include real company examples and data',
      'Provide clear takeaways for each chapter',
      'Balance theory with practical application'
    ]
  },
  'health-fitness': {
    genre: 'Health & Fitness',
    recommendedChapters: 16,
    recommendedWordsPerChapter: 3500,
    totalWordTarget: 56000,
    chapterStructure: { opening: 2, rising: 8, climax: 3, falling: 2, resolution: 1 },
    reasoning: 'Health and fitness books need to educate and motivate. The 16-chapter structure provides room for scientific foundation, practical protocols, and psychological support.',
    topBooksReference: [
      { title: 'Why We Sleep', author: 'Matthew Walker', chapterCount: 16, avgWordsPerChapter: 6000, totalWords: 96000, structure: 'Science-based exploration' },
      { title: 'Outlive', author: 'Peter Attia', chapterCount: 17, avgWordsPerChapter: 5500, totalWords: 94000, structure: 'Comprehensive health guide' },
      { title: 'Can\'t Hurt Me', author: 'David Goggins', chapterCount: 11, avgWordsPerChapter: 5000, totalWords: 55000, structure: 'Memoir with challenges' },
      { title: 'The Body', author: 'Bill Bryson', chapterCount: 23, avgWordsPerChapter: 3500, totalWords: 80000, structure: 'Entertaining science' },
    ],
    paceGuidelines: [
      'First 2 chapters: Why this matters, establish credibility',
      'Chapters 3-10: Core science and methodology',
      'Chapters 11-13: Practical implementation plans',
      'Chapters 14-15: Troubleshooting and adaptation',
      'Final chapter: Long-term maintenance and motivation'
    ],
    structureTips: [
      'Balance scientific depth with accessibility',
      'Include sample protocols and schedules',
      'Address psychological barriers to change',
      'Use success stories for motivation'
    ]
  }
};

// Default recommendations for any unlisted genre
const DEFAULT_CHAPTER_RECOMMENDATIONS: ChapterRecommendations = {
  genre: 'General Fiction',
  recommendedChapters: 25,
  recommendedWordsPerChapter: 3200,
  totalWordTarget: 80000,
  chapterStructure: { opening: 3, rising: 11, climax: 5, falling: 4, resolution: 2 },
  reasoning: 'A balanced structure that works for most fiction genres. The 25-chapter format provides enough room for character development and plot complexity while maintaining reader engagement.',
  topBooksReference: [
    { title: 'Industry Standard', author: 'Various', chapterCount: 25, avgWordsPerChapter: 3200, totalWords: 80000, structure: 'Three-act structure' },
  ],
  paceGuidelines: [
    'First 3 chapters: Establish characters, setting, and central conflict',
    'Chapters 4-14: Build complications and deepen relationships',
    'Chapters 15-19: Crisis and turning point',
    'Chapters 20-23: Resolution building',
    'Final chapters: Satisfying conclusion'
  ],
  structureTips: [
    'Every chapter should advance plot or character',
    'End chapters with hooks to maintain momentum',
    'Balance action with reflection',
    'Ensure all story threads are resolved'
  ]
};

export async function POST(request: NextRequest) {
  try {
    const { action, genre, customConfig } = await request.json();

    if (action === 'getRecommendations') {
      // Get genre-based recommendations
      const genreKey = genre?.toLowerCase().replace(/\s+/g, '-') || 'literary-fiction';
      const recommendations = GENRE_CHAPTER_RECOMMENDATIONS[genreKey] || {
        ...DEFAULT_CHAPTER_RECOMMENDATIONS,
        genre: genre || 'General Fiction'
      };

      return NextResponse.json({
        success: true,
        recommendations,
        availableGenres: Object.keys(GENRE_CHAPTER_RECOMMENDATIONS)
      });
    }

    if (action === 'customizeConfig') {
      // User wants to customize based on recommendations
      const genreKey = genre?.toLowerCase().replace(/\s+/g, '-') || 'literary-fiction';
      const baseRecommendations = GENRE_CHAPTER_RECOMMENDATIONS[genreKey] || {
        ...DEFAULT_CHAPTER_RECOMMENDATIONS,
        genre: genre || 'General Fiction'
      };

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
