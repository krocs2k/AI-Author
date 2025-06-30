
export interface LLMProvider {
  name: string;
  baseURL: string;
  apiKey: string;
  models: LLMModel[];
  priority: number;
  isAvailable: boolean;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  capabilities: ModelCapabilities;
  costTier: 'low' | 'medium' | 'high';
  qualityScore: number;
  maxTokens: number;
  contextWindow: number;
}

export interface ModelCapabilities {
  creative: number;        // 0-100 score for creative tasks
  analytical: number;      // 0-100 score for analytical tasks
  technical: number;       // 0-100 score for technical tasks
  conversational: number;  // 0-100 score for dialogue/chat
  longForm: number;        // 0-100 score for long content generation
  structured: number;      // 0-100 score for structured output (JSON, etc.)
}

export interface TaskRequirements {
  type: TaskType;
  priority: 'speed' | 'quality' | 'cost';
  creativityLevel: 'low' | 'medium' | 'high';
  structuredOutput: boolean;
  maxTokensNeeded: number;
  fallbackAllowed: boolean;
}

export type TaskType = 
  | 'genre-analysis' 
  | 'synopsis-generation' 
  | 'title-generation' 
  | 'content-creation' 
  | 'marketing-copy'
  | 'general';

export interface RoutingDecision {
  selectedModel: LLMModel;
  selectedProvider: LLMProvider;
  reasoning: string;
  fallbackModels: LLMModel[];
  confidence: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: {
    attemptNumber: number;
    fallbackUsed: boolean;
    routingDecision: RoutingDecision;
  };
}

export interface RouteLLMConfig {
  providers: LLMProvider[];
  defaultTaskPriority: 'speed' | 'quality' | 'cost';
  enableFallbacks: boolean;
  maxRetries: number;
  taskSpecificRouting: Record<TaskType, Partial<TaskRequirements>>;
}
