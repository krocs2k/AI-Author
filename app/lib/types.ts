
export interface Genre {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Synopsis {
  id: string;
  content: string;
  successProbability: number;
}

export interface BookTitle {
  id: string;
  title: string;
  reasoning: string;
}

export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  humanizationScore: number;
  generatedAt?: Date;
  wordTarget?: number;
  meetsWordCountRequirement?: boolean;
  wordCountCompliance?: number;
  wordCountStatus?: 'perfect' | 'acceptable' | 'too_short' | 'too_long';
  wordCountMessage?: string;
  wordCountRange?: string;
  generationAttempts?: Array<{
    attempt: number;
    wordCount: number;
    success: boolean;
    compliance?: number;
    status?: string;
    deviation?: number;
  }>;
  finalAttempt?: number;
  validationDetails?: {
    meetsRequirement: boolean;
    compliance: number;
    status: 'perfect' | 'acceptable' | 'too_short' | 'too_long';
    deviation: number;
    message: string;
  };
  warning?: string;
  stages?: number; // Number of generation stages used
}

export interface BookMetrics {
  totalWordCount: number;
  estimatedReadTime: number;
  humanizationScore: number;
  successProbability: number;
}

// Character types based on industry standards
export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor' | 'mentor' | 'love_interest' | 'sidekick' | 'foil';

export interface Character {
  id: string;
  name: string;
  role: CharacterRole;
  age?: string;
  gender?: string;
  occupation?: string;
  physicalDescription: string;
  personality: string[];
  backstory: string;
  motivation: string;
  arc: string; // Character development arc
  relationships: Array<{
    characterId?: string;
    characterName: string;
    relationship: string;
  }>;
  keyTraits: string[];
  flaws: string[];
  strengths: string[];
  voiceStyle?: string; // How they speak/their dialogue style
  generatedAt?: Date;
}

export interface CharacterRecommendations {
  genre: string;
  totalRecommended: number;
  breakdown: {
    protagonists: number;
    antagonists: number;
    supporting: number;
    minor: number;
  };
  reasoning: string;
  topBooksReference: Array<{
    title: string;
    characterCount: number;
    mainCharacters: number;
  }>;
  genreSpecificTips: string[];
}

export interface GenreAnalysis {
  topBooks: Array<{
    title: string;
    author: string;
    keyElements: string[];
    structure: string;
    themes: string[];
  }>;
  commonPatterns: string[];
  avgChapters: number;
  avgWordsPerChapter: number;
  successFactors: string[];
}

export interface AuthorAnalysis {
  topAuthors: Array<{
    name: string;
    writingStyle: string;
    voiceCharacteristics: string[];
    dialogueTechniques: string[];
    narrativeMethods: string[];
  }>;
  humanizationTechniques: string[];
  commonVoiceElements: string[];
  engagementStrategies: string[];
}

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface BookSession {
  id: string;
  selectedGenre?: string;
  genreAnalysis?: GenreAnalysis;
  authorAnalysis?: AuthorAnalysis;
  customTopic?: string;
  selectedSynopsis?: string;
  selectedSynopsisId?: string;
  synopses?: Synopsis[];
  selectedTitle?: string;
  selectedTitleId?: string;
  customTitle?: string;
  generatedTitles?: BookTitle[];
  plannedChapters?: number;
  wordsPerChapter?: number;
  characterRecommendations?: CharacterRecommendations;
  characters?: Character[];
  forward?: string;
  forwardWordCount?: number;
  chapters?: Chapter[];
  coverPrompts?: {
    front: string[];
    back: string[];
  };
  salesCopy?: string;
  backCoverCopy?: string;
  totalWordCount?: number;
  estimatedReadTime?: number;
  humanizationScore?: number;
  successProbability?: number;
  currentStep: number;
  completedSteps?: number[];
  createdAt: Date;
  updatedAt: Date;
}
