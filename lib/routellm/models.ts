
import { LLMModel, ModelCapabilities } from './types';

// Define available models through AbacusAI endpoint
// Using route-llm for automatic model routing (primary) and gpt-5.1 as explicit fallback
export const AVAILABLE_MODELS: LLMModel[] = [
  // Route-LLM (Primary - automatic intelligent routing)
  {
    id: 'route-llm',
    name: 'Route LLM (Auto)',
    provider: 'abacusai',
    capabilities: {
      creative: 95,
      analytical: 95,
      technical: 92,
      conversational: 95,
      longForm: 95,
      structured: 94
    },
    costTier: 'medium',
    qualityScore: 95,
    maxTokens: 16384,
    contextWindow: 128000
  },
  // GPT-5.1 (Explicit fallback model)
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
// Using route-llm for automatic intelligent routing, gpt-5.1 as explicit fallback
export const TASK_MODEL_PREFERENCES: Record<string, {
  primary: readonly string[];
  capabilities: readonly string[];
  reasoning: string;
}> = {
  'genre-analysis': {
    primary: ['route-llm', 'gpt-5.1'],
    capabilities: ['analytical', 'structured'],
    reasoning: 'Analysis tasks use route-llm for optimal model selection'
  },
  'synopsis-generation': {
    primary: ['route-llm', 'gpt-5.1'],
    capabilities: ['creative', 'longForm'],
    reasoning: 'Creative writing uses route-llm for intelligent model routing'
  },
  'title-generation': {
    primary: ['route-llm', 'gpt-5.1'],
    capabilities: ['creative', 'conversational'],
    reasoning: 'Title generation uses route-llm for creative quality'
  },
  'content-creation': {
    primary: ['route-llm', 'gpt-5.1'],
    capabilities: ['creative', 'longForm', 'conversational'],
    reasoning: 'Long-form content uses route-llm for optimal routing'
  },
  'marketing-copy': {
    primary: ['route-llm', 'gpt-5.1'],
    capabilities: ['creative', 'conversational', 'structured'],
    reasoning: 'Marketing copy uses route-llm for creative persuasive writing'
  },
  'general': {
    primary: ['route-llm', 'gpt-5.1'],
    capabilities: ['conversational', 'analytical'],
    reasoning: 'General tasks use route-llm for balanced performance'
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
