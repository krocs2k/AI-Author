
import { NextRequest, NextResponse } from 'next/server';
import { routeLLMClient } from '@/lib/routellm';
import { Character, CharacterRecommendations, CharacterRole } from '@/lib/types';

// Genre-based character count recommendations based on analysis of bestselling books
const GENRE_CHARACTER_RECOMMENDATIONS: Record<string, CharacterRecommendations> = {
  'romance': {
    genre: 'Romance',
    totalRecommended: 6,
    breakdown: { protagonists: 2, antagonists: 1, supporting: 2, minor: 1 },
    reasoning: 'Romance novels typically focus on two main characters (the romantic leads) with a small supporting cast. Too many characters can dilute the emotional intensity of the central relationship.',
    topBooksReference: [
      { title: 'Pride and Prejudice', characterCount: 8, mainCharacters: 2 },
      { title: 'The Notebook', characterCount: 5, mainCharacters: 2 },
      { title: 'Outlander', characterCount: 10, mainCharacters: 2 },
    ],
    genreSpecificTips: [
      'Create clear romantic tension between leads',
      'Give each lead distinct personality traits that complement/conflict',
      'Include a "best friend" character for each lead',
      'Consider a romantic rival or obstacle character'
    ]
  },
  'mystery': {
    genre: 'Mystery',
    totalRecommended: 10,
    breakdown: { protagonists: 1, antagonists: 1, supporting: 5, minor: 3 },
    reasoning: 'Mystery novels require enough characters to serve as potential suspects while keeping the reader guessing. The detective/protagonist needs a supporting cast of witnesses, allies, and red herrings.',
    topBooksReference: [
      { title: 'Gone Girl', characterCount: 8, mainCharacters: 2 },
      { title: 'The Girl with the Dragon Tattoo', characterCount: 12, mainCharacters: 2 },
      { title: 'And Then There Were None', characterCount: 10, mainCharacters: 10 },
    ],
    genreSpecificTips: [
      'Include multiple suspects with clear motives',
      'Create a trustworthy sidekick or partner for the protagonist',
      'Develop the antagonist thoroughly (even if hidden)',
      'Add red herring characters to misdirect readers'
    ]
  },
  'fantasy': {
    genre: 'Fantasy',
    totalRecommended: 12,
    breakdown: { protagonists: 1, antagonists: 2, supporting: 5, minor: 4 },
    reasoning: 'Fantasy often involves quests and world-building that require a diverse cast. Group dynamics (like a fellowship) are common, along with various factions and magical beings.',
    topBooksReference: [
      { title: 'The Lord of the Rings', characterCount: 20, mainCharacters: 9 },
      { title: 'Harry Potter', characterCount: 15, mainCharacters: 3 },
      { title: 'A Game of Thrones', characterCount: 25, mainCharacters: 8 },
    ],
    genreSpecificTips: [
      'Create a diverse party/group with complementary skills',
      'Include mentor figures who guide the protagonist',
      'Develop faction leaders and political figures',
      'Add unique magical beings or creatures as characters'
    ]
  },
  'thriller': {
    genre: 'Thriller',
    totalRecommended: 8,
    breakdown: { protagonists: 1, antagonists: 1, supporting: 4, minor: 2 },
    reasoning: 'Thrillers need focused tension between protagonist and antagonist. Supporting characters should raise stakes through relationships or serve as potential victims/allies.',
    topBooksReference: [
      { title: 'The Silence of the Lambs', characterCount: 8, mainCharacters: 2 },
      { title: 'The Da Vinci Code', characterCount: 7, mainCharacters: 3 },
      { title: 'The Girl on the Train', characterCount: 6, mainCharacters: 3 },
    ],
    genreSpecificTips: [
      'Make the antagonist genuinely threatening and intelligent',
      'Include characters who are in danger to raise stakes',
      'Create an ally who may or may not be trustworthy',
      'Add authority figures (law enforcement, government)'
    ]
  },
  'science-fiction': {
    genre: 'Science Fiction',
    totalRecommended: 10,
    breakdown: { protagonists: 1, antagonists: 1, supporting: 5, minor: 3 },
    reasoning: 'Sci-fi often explores humanity through diverse perspectives. Crew members, AI companions, and representatives of different factions/species enrich the world.',
    topBooksReference: [
      { title: 'Dune', characterCount: 15, mainCharacters: 4 },
      { title: 'Ender\'s Game', characterCount: 12, mainCharacters: 1 },
      { title: 'The Martian', characterCount: 8, mainCharacters: 1 },
    ],
    genreSpecificTips: [
      'Include characters representing different viewpoints on technology',
      'Consider AI or non-human characters',
      'Create scientists/experts who explain concepts naturally',
      'Add characters from different cultures or worlds'
    ]
  },
  'horror': {
    genre: 'Horror',
    totalRecommended: 7,
    breakdown: { protagonists: 1, antagonists: 1, supporting: 3, minor: 2 },
    reasoning: 'Horror works best with a contained cast where readers can form attachments before characters face danger. Too many characters dilute the fear.',
    topBooksReference: [
      { title: 'It', characterCount: 12, mainCharacters: 7 },
      { title: 'The Shining', characterCount: 5, mainCharacters: 3 },
      { title: 'Pet Sematary', characterCount: 6, mainCharacters: 2 },
    ],
    genreSpecificTips: [
      'Create sympathetic characters readers will fear for',
      'Include a skeptic who doubts the supernatural',
      'Add a character who knows more than they reveal',
      'Consider children or vulnerable characters for higher stakes'
    ]
  },
  'historical-fiction': {
    genre: 'Historical Fiction',
    totalRecommended: 10,
    breakdown: { protagonists: 1, antagonists: 1, supporting: 5, minor: 3 },
    reasoning: 'Historical fiction benefits from characters representing different social classes and perspectives of the era to bring the period to life authentically.',
    topBooksReference: [
      { title: 'The Pillars of the Earth', characterCount: 15, mainCharacters: 5 },
      { title: 'All the Light We Cannot See', characterCount: 8, mainCharacters: 2 },
      { title: 'The Book Thief', characterCount: 10, mainCharacters: 3 },
    ],
    genreSpecificTips: [
      'Include characters from different social strata',
      'Create characters who embody period attitudes',
      'Add historical figures as minor characters when appropriate',
      'Develop characters who challenge period norms'
    ]
  },
  'young-adult': {
    genre: 'Young Adult',
    totalRecommended: 8,
    breakdown: { protagonists: 1, antagonists: 1, supporting: 4, minor: 2 },
    reasoning: 'YA focuses on the protagonist\'s growth with a tight friend group. Adult figures (parents, teachers, mentors) play important supporting roles.',
    topBooksReference: [
      { title: 'The Hunger Games', characterCount: 10, mainCharacters: 3 },
      { title: 'Twilight', characterCount: 8, mainCharacters: 3 },
      { title: 'The Fault in Our Stars', characterCount: 6, mainCharacters: 2 },
    ],
    genreSpecificTips: [
      'Create a relatable protagonist with clear growth arc',
      'Include a best friend or close confidant',
      'Add complex adult figures (not purely good or bad)',
      'Consider romantic interest as major character'
    ]
  },
  'literary-fiction': {
    genre: 'Literary Fiction',
    totalRecommended: 8,
    breakdown: { protagonists: 1, antagonists: 0, supporting: 5, minor: 2 },
    reasoning: 'Literary fiction focuses on deep character development. Fewer characters allow for more nuanced exploration of internal conflicts and relationships.',
    topBooksReference: [
      { title: 'The Great Gatsby', characterCount: 7, mainCharacters: 2 },
      { title: 'To Kill a Mockingbird', characterCount: 10, mainCharacters: 3 },
      { title: 'Normal People', characterCount: 5, mainCharacters: 2 },
    ],
    genreSpecificTips: [
      'Focus on internal conflicts over external antagonists',
      'Create morally complex characters',
      'Develop rich backstories and motivations',
      'Use supporting characters to reflect themes'
    ]
  },
  'crime': {
    genre: 'Crime',
    totalRecommended: 10,
    breakdown: { protagonists: 1, antagonists: 2, supporting: 4, minor: 3 },
    reasoning: 'Crime novels need a criminal element, law enforcement, victims, and witnesses. The interplay between these groups drives the plot.',
    topBooksReference: [
      { title: 'The Godfather', characterCount: 15, mainCharacters: 5 },
      { title: 'In Cold Blood', characterCount: 8, mainCharacters: 4 },
      { title: 'The Lincoln Lawyer', characterCount: 10, mainCharacters: 2 },
    ],
    genreSpecificTips: [
      'Create a compelling criminal with understandable motives',
      'Include law enforcement with personal stakes',
      'Add informants or morally gray characters',
      'Develop victims as full characters, not just plot devices'
    ]
  },
  'contemporary-fiction': {
    genre: 'Contemporary Fiction',
    totalRecommended: 8,
    breakdown: { protagonists: 1, antagonists: 1, supporting: 4, minor: 2 },
    reasoning: 'Contemporary fiction focuses on character depth and realistic relationships. A moderate cast allows for nuanced exploration of modern life and social dynamics.',
    topBooksReference: [
      { title: 'Where the Crawdads Sing', characterCount: 10, mainCharacters: 2 },
      { title: 'A Man Called Ove', characterCount: 8, mainCharacters: 1 },
      { title: 'Eleanor Oliphant Is Completely Fine', characterCount: 7, mainCharacters: 1 },
    ],
    genreSpecificTips: [
      'Create flawed, relatable protagonists',
      'Develop supporting characters with their own stories',
      'Use relationships to reveal character growth',
      'Ground characters in authentic, contemporary settings'
    ]
  },
  'adventure': {
    genre: 'Adventure',
    totalRecommended: 10,
    breakdown: { protagonists: 1, antagonists: 2, supporting: 4, minor: 3 },
    reasoning: 'Adventure stories need a hero, obstacles (human and environmental), allies, and local characters encountered along the journey.',
    topBooksReference: [
      { title: 'Treasure Island', characterCount: 12, mainCharacters: 3 },
      { title: 'Life of Pi', characterCount: 5, mainCharacters: 1 },
      { title: 'Ready Player One', characterCount: 10, mainCharacters: 4 },
    ],
    genreSpecificTips: [
      'Give the protagonist skills that will be tested',
      'Create antagonists who are formidable obstacles',
      'Include a loyal companion or team',
      'Add local guides or characters with crucial knowledge'
    ]
  },
  'western': {
    genre: 'Western',
    totalRecommended: 9,
    breakdown: { protagonists: 1, antagonists: 2, supporting: 4, minor: 2 },
    reasoning: 'Westerns feature solitary heroes, outlaws, lawmen, and frontier settlers. The cast should reflect the isolation and harsh realities of frontier life.',
    topBooksReference: [
      { title: 'Lonesome Dove', characterCount: 15, mainCharacters: 4 },
      { title: 'True Grit', characterCount: 8, mainCharacters: 3 },
      { title: 'Blood Meridian', characterCount: 12, mainCharacters: 2 },
    ],
    genreSpecificTips: [
      'Create a protagonist shaped by frontier hardship',
      'Include morally ambiguous outlaws or lawmen',
      'Add townspeople who represent civilization',
      'Consider Indigenous characters with authentic depth'
    ]
  },
  'paranormal': {
    genre: 'Paranormal',
    totalRecommended: 9,
    breakdown: { protagonists: 1, antagonists: 2, supporting: 4, minor: 2 },
    reasoning: 'Paranormal fiction balances supernatural beings with human characters. The mix creates tension between normal and otherworldly worlds.',
    topBooksReference: [
      { title: 'Interview with the Vampire', characterCount: 8, mainCharacters: 3 },
      { title: 'A Discovery of Witches', characterCount: 12, mainCharacters: 2 },
      { title: 'Practical Magic', characterCount: 8, mainCharacters: 4 },
    ],
    genreSpecificTips: [
      'Define clear rules for supernatural characters',
      'Include skeptics who ground the story',
      'Create supernatural beings with human motivations',
      'Add characters who bridge both worlds'
    ]
  },
  'dystopian': {
    genre: 'Dystopian',
    totalRecommended: 10,
    breakdown: { protagonists: 1, antagonists: 2, supporting: 5, minor: 2 },
    reasoning: 'Dystopian fiction needs rebels, authority figures, and citizens at different levels of awareness. The cast should represent the system and those who challenge it.',
    topBooksReference: [
      { title: '1984', characterCount: 8, mainCharacters: 2 },
      { title: 'The Hunger Games', characterCount: 12, mainCharacters: 3 },
      { title: 'The Handmaid\'s Tale', characterCount: 10, mainCharacters: 1 },
    ],
    genreSpecificTips: [
      'Create a protagonist who awakens to the truth',
      'Include authority figures who embody the system',
      'Add fellow rebels with different motivations',
      'Develop characters who represent the compliant masses'
    ]
  },
  'comedy': {
    genre: 'Comedy',
    totalRecommended: 10,
    breakdown: { protagonists: 1, antagonists: 1, supporting: 5, minor: 3 },
    reasoning: 'Comedy thrives on character dynamics and misunderstandings. An ensemble cast allows for multiple comedic relationships and running gags.',
    topBooksReference: [
      { title: 'Good Omens', characterCount: 15, mainCharacters: 2 },
      { title: 'Bridget Jones\'s Diary', characterCount: 8, mainCharacters: 3 },
      { title: 'The Hitchhiker\'s Guide to the Galaxy', characterCount: 8, mainCharacters: 4 },
    ],
    genreSpecificTips: [
      'Give each character a distinct comedic trait',
      'Create mismatched pairs for maximum humor',
      'Include a straight man to react to absurdity',
      'Develop characters whose flaws drive the comedy'
    ]
  },
  'biography': {
    genre: 'Biography',
    totalRecommended: 12,
    breakdown: { protagonists: 1, antagonists: 1, supporting: 7, minor: 3 },
    reasoning: 'Biographies center on the subject but need family, colleagues, rivals, and historical figures to provide context and conflict.',
    topBooksReference: [
      { title: 'Steve Jobs', characterCount: 20, mainCharacters: 1 },
      { title: 'Alexander Hamilton', characterCount: 25, mainCharacters: 5 },
      { title: 'Becoming', characterCount: 15, mainCharacters: 3 },
    ],
    genreSpecificTips: [
      'Present the subject with both strengths and flaws',
      'Include key relationships that shaped the person',
      'Add rivals or opponents who provide conflict',
      'Develop mentors and influences on the subject'
    ]
  },
  'self-help': {
    genre: 'Self-Help',
    totalRecommended: 6,
    breakdown: { protagonists: 1, antagonists: 0, supporting: 3, minor: 2 },
    reasoning: 'Self-help uses case studies and examples rather than traditional characters. Focus on relatable personas that readers can identify with.',
    topBooksReference: [
      { title: 'Atomic Habits', characterCount: 5, mainCharacters: 1 },
      { title: 'The 7 Habits', characterCount: 4, mainCharacters: 1 },
      { title: 'Can\'t Hurt Me', characterCount: 8, mainCharacters: 1 },
    ],
    genreSpecificTips: [
      'Use the author as a guide character',
      'Create composite case study personas',
      'Include success story examples',
      'Add relatable "before" characters for transformation arcs'
    ]
  },
  'business': {
    genre: 'Business',
    totalRecommended: 8,
    breakdown: { protagonists: 1, antagonists: 1, supporting: 4, minor: 2 },
    reasoning: 'Business books feature entrepreneurs, executives, and industry examples. Characters serve to illustrate principles and strategies.',
    topBooksReference: [
      { title: 'Good to Great', characterCount: 10, mainCharacters: 5 },
      { title: 'Shoe Dog', characterCount: 15, mainCharacters: 1 },
      { title: 'The Lean Startup', characterCount: 6, mainCharacters: 1 },
    ],
    genreSpecificTips: [
      'Use real business leaders as case studies',
      'Create composite characters for sensitive examples',
      'Include both successes and cautionary tales',
      'Develop mentor figures who embody key principles'
    ]
  },
  'health-fitness': {
    genre: 'Health & Fitness',
    totalRecommended: 6,
    breakdown: { protagonists: 1, antagonists: 0, supporting: 3, minor: 2 },
    reasoning: 'Health books use patient cases, research subjects, and the author as guide. Characters illustrate health journeys and transformations.',
    topBooksReference: [
      { title: 'Why We Sleep', characterCount: 4, mainCharacters: 1 },
      { title: 'Can\'t Hurt Me', characterCount: 8, mainCharacters: 1 },
      { title: 'The Body', characterCount: 6, mainCharacters: 1 },
    ],
    genreSpecificTips: [
      'Use the author as authoritative guide',
      'Include patient/client transformation stories',
      'Add research subjects as examples',
      'Create relatable personas at different health stages'
    ]
  },
  'memoir': {
    genre: 'Memoir',
    totalRecommended: 10,
    breakdown: { protagonists: 1, antagonists: 1, supporting: 5, minor: 3 },
    reasoning: 'Memoirs center on the author but need family, friends, and significant others to provide context, conflict, and emotional depth.',
    topBooksReference: [
      { title: 'Educated', characterCount: 12, mainCharacters: 4 },
      { title: 'The Glass Castle', characterCount: 10, mainCharacters: 5 },
      { title: 'Born a Crime', characterCount: 8, mainCharacters: 2 },
    ],
    genreSpecificTips: [
      'Present yourself honestly, including flaws',
      'Develop family members as full characters',
      'Include characters who challenged or shaped you',
      'Add voices that represent different perspectives on events'
    ]
  },
};

// Default recommendations for genres not specifically defined
const DEFAULT_RECOMMENDATIONS: CharacterRecommendations = {
  genre: 'General Fiction',
  totalRecommended: 8,
  breakdown: { protagonists: 1, antagonists: 1, supporting: 4, minor: 2 },
  reasoning: 'A balanced cast allows for character development while maintaining reader engagement. The protagonist should have meaningful relationships that drive the story.',
  topBooksReference: [
    { title: 'Industry Average', characterCount: 8, mainCharacters: 3 },
  ],
  genreSpecificTips: [
    'Every character should serve a purpose in the story',
    'Avoid introducing too many characters too quickly',
    'Give supporting characters their own goals and arcs',
    'Ensure characters have distinct voices and personalities'
  ]
};

// Helper function to generate content - relies on routeLLMClient's internal timeout
async function generateWithTimeout(
  systemPrompt: string,
  prompt: string
): Promise<{ content: string; model: string; timedOut: boolean }> {
  try {
    const response = await routeLLMClient.generateWithSystem(
      systemPrompt,
      prompt,
      'content-creation',
      { temperature: 0.7, maxTokens: 1500 } // Reduced tokens for faster response
    );
    
    return { content: response.content || '', model: response.model, timedOut: false };
  } catch (error: any) {
    if (error.message?.includes('timeout') || error.message?.includes('All routing attempts failed')) {
      console.warn('Character generation timed out, returning null');
      return { content: '', model: 'timeout', timedOut: true };
    }
    throw error;
  }
}

// Generate a single character with full development
async function generateSingleCharacter(
  genre: string,
  synopsis: string,
  title: string,
  role: CharacterRole,
  existingCharacters: Character[],
  characterNumber: number
): Promise<Character | null> {
  const existingNames = existingCharacters.map(c => c.name).join(', ');
  const existingRoles = existingCharacters.map(c => `${c.name} (${c.role})`).join(', ');
  
  const roleDescriptions: Record<CharacterRole, string> = {
    protagonist: 'the main character who drives the story forward',
    antagonist: 'the opposing force or villain who creates conflict',
    supporting: 'a key secondary character who aids or influences the protagonist',
    minor: 'a background character who adds depth to the world',
    mentor: 'a wise guide who helps the protagonist develop',
    love_interest: 'a romantic interest for the protagonist',
    sidekick: 'a loyal companion to the protagonist',
    foil: 'a character who contrasts with the protagonist to highlight their traits'
  };
  
  const systemPrompt = `You are an expert character designer for ${genre} novels. Create compelling, three-dimensional characters that readers will remember. Your characters should feel authentic and serve their narrative purpose while avoiding clichés.`;
  
  const prompt = `Create a detailed character for a ${genre} book titled "${title}".

STORY SYNOPSIS:
${synopsis}

CHARACTER ROLE: ${role.toUpperCase()} - ${roleDescriptions[role]}

${existingCharacters.length > 0 ? `EXISTING CHARACTERS (avoid name conflicts and ensure relationships make sense):
${existingRoles}\n` : ''}

Generate a complete character profile in the following JSON format. Be creative with names (appropriate to the genre/setting) and make the character unique and memorable:

{
  "name": "Character's full name",
  "age": "Age or age range (e.g., 'mid-30s', '28')",
  "gender": "Character's gender",
  "occupation": "Job or role in society",
  "physicalDescription": "2-3 sentences describing appearance, distinguishing features",
  "personality": ["trait1", "trait2", "trait3", "trait4"],
  "backstory": "2-3 sentences about their past that shapes who they are",
  "motivation": "What drives this character? What do they want?",
  "arc": "How will this character change throughout the story?",
  "keyTraits": ["defining characteristic 1", "defining characteristic 2", "defining characteristic 3"],
  "flaws": ["flaw1", "flaw2"],
  "strengths": ["strength1", "strength2", "strength3"],
  "voiceStyle": "How they speak - formal, casual, witty, etc.",
  "relationships": [${existingCharacters.length > 0 ? `{"characterName": "existing character name", "relationship": "their relationship"}` : ''}]
}

Respond ONLY with the JSON object, no additional text.`;

  const result = await generateWithTimeout(systemPrompt, prompt);
  
  if (result.timedOut) {
    console.warn(`Character generation timed out for ${role}`);
    return null;
  }
  
  try {
    // Extract JSON from response
    let jsonStr = result.content.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const parsed = JSON.parse(jsonStr);
    
    const character: Character = {
      id: `char-${characterNumber}-${Date.now()}`,
      name: parsed.name || `Character ${characterNumber}`,
      role: role,
      age: parsed.age,
      gender: parsed.gender,
      occupation: parsed.occupation,
      physicalDescription: parsed.physicalDescription || '',
      personality: Array.isArray(parsed.personality) ? parsed.personality : [],
      backstory: parsed.backstory || '',
      motivation: parsed.motivation || '',
      arc: parsed.arc || '',
      relationships: Array.isArray(parsed.relationships) ? parsed.relationships : [],
      keyTraits: Array.isArray(parsed.keyTraits) ? parsed.keyTraits : [],
      flaws: Array.isArray(parsed.flaws) ? parsed.flaws : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      voiceStyle: parsed.voiceStyle,
      generatedAt: new Date()
    };
    
    return character;
  } catch (error) {
    console.error('Failed to parse character JSON:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { genre, synopsis, title, action, characterConfig } = await request.json();
    
    // Action: getRecommendations - Return genre-based recommendations
    if (action === 'getRecommendations') {
      const genreKey = genre?.toLowerCase().replace(/\s+/g, '-') || '';
      const recommendations = GENRE_CHARACTER_RECOMMENDATIONS[genreKey] || {
        ...DEFAULT_RECOMMENDATIONS,
        genre: genre || 'General Fiction'
      };
      
      return NextResponse.json({
        recommendations,
        success: true
      });
    }
    
    // Action: generateCharacters - Generate characters based on config
    if (action === 'generateCharacters') {
      if (!synopsis || !title || !genre) {
        return NextResponse.json({ 
          error: 'Missing required parameters: synopsis, title, and genre' 
        }, { status: 400 });
      }
      
      const config = characterConfig || {
        protagonists: 1,
        antagonists: 1,
        supporting: 3,
        minor: 2
      };
      
      console.log(`Generating characters for ${genre} book: ${title}`);
      console.log('Character config:', config);
      
      const characters: Character[] = [];
      const roleQueue: CharacterRole[] = [];
      
      // Build queue of roles to generate
      for (let i = 0; i < (config.protagonists || 0); i++) roleQueue.push('protagonist');
      for (let i = 0; i < (config.antagonists || 0); i++) roleQueue.push('antagonist');
      
      // Add mentors/love interests/sidekicks based on genre
      const genreKey = genre?.toLowerCase().replace(/\s+/g, '-') || '';
      if (['romance', 'young-adult'].includes(genreKey) && config.supporting > 0) {
        roleQueue.push('love_interest');
        config.supporting = Math.max(0, (config.supporting || 0) - 1);
      }
      if (['fantasy', 'young-adult', 'science-fiction'].includes(genreKey) && config.supporting > 0) {
        roleQueue.push('mentor');
        config.supporting = Math.max(0, (config.supporting || 0) - 1);
      }
      
      for (let i = 0; i < (config.supporting || 0); i++) roleQueue.push('supporting');
      for (let i = 0; i < (config.minor || 0); i++) roleQueue.push('minor');
      
      // Generate characters sequentially to maintain relationships
      for (let i = 0; i < roleQueue.length; i++) {
        const role = roleQueue[i];
        console.log(`Generating ${role} character (${i + 1}/${roleQueue.length})...`);
        
        const character = await generateSingleCharacter(
          genre,
          synopsis,
          title,
          role,
          characters,
          i + 1
        );
        
        if (character) {
          characters.push(character);
        } else {
          console.warn(`Failed to generate ${role} character, continuing...`);
        }
        
        // Small delay between generations to avoid rate limiting
        if (i < roleQueue.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
      
      console.log(`Generated ${characters.length} characters successfully`);
      
      return NextResponse.json({
        characters,
        totalGenerated: characters.length,
        success: true
      });
    }
    
    // Action: generateSingle - Generate a single additional character
    if (action === 'generateSingle') {
      const { role, existingCharacters } = await request.json();
      
      if (!synopsis || !title || !genre || !role) {
        return NextResponse.json({ 
          error: 'Missing required parameters' 
        }, { status: 400 });
      }
      
      const character = await generateSingleCharacter(
        genre,
        synopsis,
        title,
        role as CharacterRole,
        existingCharacters || [],
        (existingCharacters?.length || 0) + 1
      );
      
      if (!character) {
        return NextResponse.json({ 
          error: 'Failed to generate character' 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        character,
        success: true
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Character generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate characters',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
