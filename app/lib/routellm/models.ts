
import { LLMModel, ModelCapabilities } from './types';

// Define available models through AbacusAI endpoint
// Using correct model identifiers for the RouteLLM API
export const AVAILABLE_MODELS: LLMModel[] = [
  // Llama 4 (Primary model for creative content generation)
  {
    id: 'llama4',
    name: 'Llama 4',
    provider: 'abacusai',
    capabilities: {
      creative: 96,
      analytical: 88,
      technical: 85,
      conversational: 95,
      longForm: 97,
      structured: 88
    },
    costTier: 'medium',
    qualityScore: 96,
    maxTokens: 16384,
    contextWindow: 128000
  },
  // GPT-5 Mini (Primary model for analysis tasks)
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'abacusai',
    capabilities: {
      creative: 85,
      analytical: 96,
      technical: 94,
      conversational: 90,
      longForm: 85,
      structured: 96
    },
    costTier: 'low',
    qualityScore: 92,
    maxTokens: 16384,
    contextWindow: 128000
  },
  // GPT-5.1 (Fallback model)
  {
    id: 'gpt-5.1',
    name: 'GPT-5.1',
    provider: 'abacusai',
    capabilities: {
      creative: 90,
      analytical: 98,
      technical: 96,
      conversational: 92,
      longForm: 92,
      structured: 98
    },
    costTier: 'high',
    qualityScore: 96,
    maxTokens: 8192,
    contextWindow: 128000
  },
  // Gemini 3 Pro (Fallback model)
  {
    id: 'gemini-3-pro',
    name: 'Gemini 3 Pro',
    provider: 'abacusai',
    capabilities: {
      creative: 92,
      analytical: 94,
      technical: 92,
      conversational: 90,
      longForm: 90,
      structured: 94
    },
    costTier: 'medium',
    qualityScore: 93,
    maxTokens: 8192,
    contextWindow: 1000000
  }
];

// Task-specific model preferences
// GPT-5 Mini for analysis tasks, Llama4 for creative content
// Fallbacks: gpt-5.1 and gemini-3-pro
export const TASK_MODEL_PREFERENCES: Record<string, {
  primary: readonly string[];
  capabilities: readonly string[];
  reasoning: string;
}> = {
  'genre-analysis': {
    primary: ['gpt-5-mini', 'gpt-5.1', 'gemini-3-pro'],
    capabilities: ['analytical', 'structured'],
    reasoning: 'Analysis tasks use GPT-5 Mini for structured reasoning'
  },
  'synopsis-generation': {
    primary: ['llama4', 'gpt-5.1', 'gemini-3-pro'],
    capabilities: ['creative', 'longForm'],
    reasoning: 'Creative writing tasks use Llama 4 for superior creative output'
  },
  'title-generation': {
    primary: ['llama4', 'gpt-5.1', 'gemini-3-pro'],
    capabilities: ['creative', 'conversational'],
    reasoning: 'Title generation uses Llama 4 for creative quality'
  },
  'content-creation': {
    primary: ['llama4', 'gpt-5.1', 'gemini-3-pro'],
    capabilities: ['creative', 'longForm', 'conversational'],
    reasoning: 'Long-form creative content uses Llama 4 as primary'
  },
  'marketing-copy': {
    primary: ['llama4', 'gpt-5.1', 'gemini-3-pro'],
    capabilities: ['creative', 'conversational', 'structured'],
    reasoning: 'Marketing copy uses Llama 4 for creative persuasive writing'
  },
  'general': {
    primary: ['gpt-5-mini', 'gpt-5.1', 'gemini-3-pro'],
    capabilities: ['conversational', 'analytical'],
    reasoning: 'General tasks default to GPT-5 Mini for balanced performance'
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
