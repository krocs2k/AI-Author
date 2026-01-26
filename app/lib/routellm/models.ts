
import { LLMModel, ModelCapabilities } from './types';

// Define available models through AbacusAI endpoint
// Note: We're starting with models available through AbacusAI, but this can be extended
export const AVAILABLE_MODELS: LLMModel[] = [
  // Llama 4 Maverick (Primary model for book content generation)
  {
    id: 'llama-4-maverick-17b-128e-instruct',
    name: 'Llama 4 Maverick',
    provider: 'abacusai',
    capabilities: {
      creative: 96,
      analytical: 92,
      technical: 90,
      conversational: 95,
      longForm: 97,
      structured: 90
    },
    costTier: 'medium',
    qualityScore: 96,
    maxTokens: 16384,
    contextWindow: 128000
  },
  // Claude Models (High quality, excellent for creative tasks)
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'abacusai',
    capabilities: {
      creative: 95,
      analytical: 90,
      technical: 85,
      conversational: 95,
      longForm: 95,
      structured: 88
    },
    costTier: 'high',
    qualityScore: 95,
    maxTokens: 8192,
    contextWindow: 200000
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'abacusai',
    capabilities: {
      creative: 85,
      analytical: 85,
      technical: 80,
      conversational: 90,
      longForm: 80,
      structured: 85
    },
    costTier: 'low',
    qualityScore: 85,
    maxTokens: 4096,
    contextWindow: 200000
  },
  // GPT Models (Good balance, excellent for analytical tasks)
  {
    id: 'gpt-4-turbo-preview',
    name: 'GPT-4 Turbo',
    provider: 'abacusai',
    capabilities: {
      creative: 88,
      analytical: 95,
      technical: 92,
      conversational: 90,
      longForm: 90,
      structured: 95
    },
    costTier: 'high',
    qualityScore: 92,
    maxTokens: 4096,
    contextWindow: 128000
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'abacusai',
    capabilities: {
      creative: 82,
      analytical: 88,
      technical: 85,
      conversational: 85,
      longForm: 75,
      structured: 90
    },
    costTier: 'low',
    qualityScore: 85,
    maxTokens: 16384,
    contextWindow: 128000
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    provider: 'abacusai',
    capabilities: {
      creative: 83,
      analytical: 89,
      technical: 86,
      conversational: 86,
      longForm: 76,
      structured: 91
    },
    costTier: 'low',
    qualityScore: 86,
    maxTokens: 16384,
    contextWindow: 128000
  },
  // Gemini Models (Good for structured tasks)
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'abacusai',
    capabilities: {
      creative: 85,
      analytical: 92,
      technical: 90,
      conversational: 88,
      longForm: 85,
      structured: 93
    },
    costTier: 'medium',
    qualityScore: 89,
    maxTokens: 8192,
    contextWindow: 1000000
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'abacusai',
    capabilities: {
      creative: 80,
      analytical: 87,
      technical: 85,
      conversational: 83,
      longForm: 78,
      structured: 88
    },
    costTier: 'low',
    qualityScore: 83,
    maxTokens: 8192,
    contextWindow: 1000000
  }
];

// Task-specific model preferences
export const TASK_MODEL_PREFERENCES: Record<string, {
  primary: readonly string[];
  capabilities: readonly string[];
  reasoning: string;
}> = {
  'genre-analysis': {
    primary: ['gpt-4-turbo-preview', 'gemini-1.5-pro', 'llama-4-maverick-17b-128e-instruct'],
    capabilities: ['analytical', 'structured'],
    reasoning: 'Analytical tasks benefit from GPT-4 and Gemini\'s structured reasoning capabilities'
  },
  'synopsis-generation': {
    primary: ['llama-4-maverick-17b-128e-instruct', 'claude-3-5-sonnet-20241022', 'gpt-4-turbo-preview'],
    capabilities: ['creative', 'longForm'],
    reasoning: 'Creative writing tasks leverage Llama 4 Maverick\'s superior creative capabilities'
  },
  'title-generation': {
    primary: ['llama-4-maverick-17b-128e-instruct', 'claude-3-5-sonnet-20241022', 'gpt-4o-mini'],
    capabilities: ['creative', 'conversational'],
    reasoning: 'Creative but shorter tasks use Llama 4 Maverick for quality'
  },
  'content-creation': {
    primary: ['llama-4-maverick-17b-128e-instruct', 'gpt-4-turbo-preview', 'gemini-1.5-pro'],
    capabilities: ['creative', 'longForm', 'conversational'],
    reasoning: 'Long-form creative content uses Llama 4 Maverick as primary with GPT-4 and Gemini fallback'
  },
  'marketing-copy': {
    primary: ['llama-4-maverick-17b-128e-instruct', 'gpt-4-turbo-preview', 'gemini-1.5-pro'],
    capabilities: ['creative', 'conversational', 'structured'],
    reasoning: 'Marketing copy uses Llama 4 Maverick with GPT-4 and Gemini as fallbacks'
  },
  'general': {
    primary: ['llama-4-maverick-17b-128e-instruct', 'gpt-4-turbo-preview', 'gemini-1.5-pro'],
    capabilities: ['conversational', 'analytical'],
    reasoning: 'General tasks use Llama 4 Maverick with GPT-4 and Gemini as fallbacks'
  }
} as const;

// Get model by ID
export function getModelById(modelId: string): LLMModel | undefined {
  return AVAILABLE_MODELS.find(model => model.id === modelId);
}

// Get models by provider
export function getModelsByProvider(provider: string): LLMModel[] {
  return AVAILABLE_MODELS.filter(model => model.provider === provider);
}

// Get models by capability score
export function getModelsByCapability(capability: keyof ModelCapabilities, minScore: number = 80): LLMModel[] {
  return AVAILABLE_MODELS.filter(model => model.capabilities[capability] >= minScore);
}

// Get cost-efficient models
export function getCostEfficientModels(): LLMModel[] {
  return AVAILABLE_MODELS.filter(model => model.costTier === 'low');
}

// Get high-quality models
export function getHighQualityModels(minScore: number = 90): LLMModel[] {
  return AVAILABLE_MODELS.filter(model => model.qualityScore >= minScore);
}
