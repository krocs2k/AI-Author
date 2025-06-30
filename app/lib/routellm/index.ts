
// Main RouteLLM exports
export { RouteLLMClient, routeLLMClient } from './client';
export { RouteLLMRouter, routeLLMRouter } from './router';
export { getAvailableProviders, getPrimaryProvider, initializeProviders } from './providers';
export { AVAILABLE_MODELS, TASK_MODEL_PREFERENCES, getModelById } from './models';

// Types
export type {
  LLMProvider,
  LLMModel,
  ModelCapabilities,
  TaskRequirements,
  TaskType,
  RoutingDecision,
  LLMResponse,
  RouteLLMConfig
} from './types';

export type { ChatMessage, ChatCompletionRequest } from './client';

// Import types for use in functions
import type { TaskType, TaskRequirements } from './types';
import { routeLLMRouter } from './router';
import { getAvailableProviders, initializeProviders } from './providers';

// Default configuration
export const DEFAULT_ROUTELLM_CONFIG = {
  providers: [],
  defaultTaskPriority: 'quality' as const,
  enableFallbacks: true,
  maxRetries: 3,
  taskSpecificRouting: {
    'genre-analysis': { priority: 'quality' as const, creativityLevel: 'low' as const, structuredOutput: true },
    'synopsis-generation': { priority: 'quality' as const, creativityLevel: 'high' as const },
    'title-generation': { priority: 'speed' as const, creativityLevel: 'high' as const },
    'content-creation': { priority: 'quality' as const, creativityLevel: 'high' as const, maxTokensNeeded: 8000 },
    'marketing-copy': { priority: 'quality' as const, creativityLevel: 'medium' as const, structuredOutput: true },
    'general': { priority: 'quality' as const, creativityLevel: 'medium' as const }
  }
};

// Utility function to get optimal model for task
export function getOptimalModelForTask(taskType: TaskType, requirements?: Partial<TaskRequirements>) {
  return routeLLMRouter.route(taskType, requirements);
}

// Initialize RouteLLM system
export async function initializeRouteLLM() {
  try {
    await initializeProviders();
    console.log('RouteLLM system initialized successfully');
    
    // Log available models
    const availableProviders = getAvailableProviders();
    console.log(`Available providers: ${availableProviders.map((p: any) => p.name).join(', ')}`);
    
    const totalModels = availableProviders.reduce((sum: number, p: any) => sum + p.models.length, 0);
    console.log(`Total available models: ${totalModels}`);
    
    return true;
  } catch (error) {
    console.error('Failed to initialize RouteLLM:', error);
    return false;
  }
}
