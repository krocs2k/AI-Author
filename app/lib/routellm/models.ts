
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
  // Claude 4 Sonnet (Fallback for creative tasks)
  {
    id: 'claude-sonnet-4',
    name: 'Claude 4 Sonnet',
    provider: 'abacusai',
    capabilities: {
      creative: 95,
      analytical: 92,
      technical: 90,
      conversational: 95,
      longForm: 95,
      structured: 90
    },
    costTier: 'high',
    qualityScore: 95,
    maxTokens: 8192,
    contextWindow: 200000
  },
  // GPT-5.1 (High-end analytical model)
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
  }
];

// Task-specific model preferences
// GPT-5 Mini for analysis tasks, Llama4 for creative content
export const TASK_MODEL_PREFERENCES: Record<string, {
  primary: readonly string[];
  capabilities: readonly string[];
  reasoning: string;
}> = {
  'genre-analysis': {
    primary: ['gpt-5-mini', 'gpt-5.1', 'claude-sonnet-4'],
    capabilities: ['analytical', 'structured'],
    reasoning: 'Analysis tasks use GPT-5 Mini for structured reasoning'
  },
  'synopsis-generation': {
    primary: ['llama4', 'claude-sonnet-4', 'gpt-5.1'],
    capabilities: ['creative', 'longForm'],
    reasoning: 'Creative writing tasks use Llama 4 for superior creative output'
  },
  'title-generation': {
    primary: ['llama4', 'claude-sonnet-4', 'gpt-5-mini'],
    capabilities: ['creative', 'conversational'],
    reasoning: 'Title generation uses Llama 4 for creative quality'
  },
  'content-creation': {
    primary: ['llama4', 'claude-sonnet-4', 'gpt-5.1'],
    capabilities: ['creative', 'longForm', 'conversational'],
    reasoning: 'Long-form creative content uses Llama 4 as primary'
  },
  'marketing-copy': {
    primary: ['llama4', 'claude-sonnet-4', 'gpt-5.1'],
    capabilities: ['creative', 'conversational', 'structured'],
    reasoning: 'Marketing copy uses Llama 4 for creative persuasive writing'
  },
  'general': {
    primary: ['gpt-5-mini', 'llama4', 'claude-sonnet-4'],
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
