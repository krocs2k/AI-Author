
import { TaskRequirements, TaskType, RoutingDecision, LLMModel, LLMProvider } from './types';
import { AVAILABLE_MODELS, TASK_MODEL_PREFERENCES } from './models';
import { getAvailableProviders, getPrimaryProvider } from './providers';

export class RouteLLMRouter {
  private providers: LLMProvider[];
  
  constructor() {
    this.providers = getAvailableProviders();
  }

  /**
   * Route a task to the most appropriate model based on requirements
   */
  public route(taskType: TaskType, requirements: Partial<TaskRequirements> = {}): RoutingDecision {
    const fullRequirements: TaskRequirements = {
      type: taskType,
      priority: requirements.priority || 'quality',
      creativityLevel: requirements.creativityLevel || 'medium',
      structuredOutput: requirements.structuredOutput || false,
      maxTokensNeeded: requirements.maxTokensNeeded || 4000,
      fallbackAllowed: requirements.fallbackAllowed !== false
    };

    // Get task-specific preferences
    const taskPreferences = TASK_MODEL_PREFERENCES[taskType] || TASK_MODEL_PREFERENCES['general'];
    
    // Get available models
    const availableModels = this.getAvailableModels();
    
    if (availableModels.length === 0) {
      throw new Error('No available models found. Please check provider configuration.');
    }

    // Score and rank models for this task
    const rankedModels = this.scoreModelsForTask(availableModels, fullRequirements, taskPreferences);
    
    if (rankedModels.length === 0) {
      throw new Error('No suitable models found for the task requirements.');
    }

    const selectedModel = rankedModels[0].model;
    const selectedProvider = this.getProviderForModel(selectedModel);
    
    if (!selectedProvider) {
      throw new Error('No provider found for selected model.');
    }

    const fallbackModels = rankedModels.slice(1, 4).map(rm => rm.model);
    
    return {
      selectedModel,
      selectedProvider,
      reasoning: this.generateRoutingReasoning(selectedModel, fullRequirements, taskPreferences, rankedModels[0].score),
      fallbackModels,
      confidence: Math.min(rankedModels[0].score / 100, 0.95)
    };
  }

  /**
   * Score models based on task requirements and preferences
   */
  private scoreModelsForTask(
    models: LLMModel[], 
    requirements: TaskRequirements, 
    taskPreferences: typeof TASK_MODEL_PREFERENCES[TaskType]
  ): Array<{ model: LLMModel; score: number }> {
    const scoredModels = models.map(model => {
      let score = 0;
      
      // Base quality score (30% weight)
      score += model.qualityScore * 0.3;
      
      // Task-specific capability scoring (40% weight)
      const relevantCapabilities = taskPreferences.capabilities;
      const capabilityScore = relevantCapabilities.reduce((sum, cap) => {
        return sum + model.capabilities[cap as keyof typeof model.capabilities];
      }, 0) / relevantCapabilities.length;
      score += capabilityScore * 0.4;
      
      // Priority-based scoring (20% weight)
      switch (requirements.priority) {
        case 'quality':
          score += model.qualityScore * 0.2;
          break;
        case 'cost':
          const costMultiplier = model.costTier === 'low' ? 1.0 : model.costTier === 'medium' ? 0.7 : 0.4;
          score += 100 * costMultiplier * 0.2;
          break;
        case 'speed':
          const speedMultiplier = model.costTier === 'low' ? 1.0 : model.costTier === 'medium' ? 0.8 : 0.6;
          score += 100 * speedMultiplier * 0.2;
          break;
      }
      
      // Creativity level scoring (10% weight)
      let creativityScore = model.capabilities.creative;
      if (requirements.creativityLevel === 'low') {
        creativityScore = Math.min(creativityScore, 80); // Cap creativity for analytical tasks
      } else if (requirements.creativityLevel === 'high') {
        creativityScore = creativityScore * 1.2; // Boost creative models
      }
      score += creativityScore * 0.1;
      
      // Structured output bonus
      if (requirements.structuredOutput) {
        score += model.capabilities.structured * 0.1;
      }
      
      // Token capacity check
      if (requirements.maxTokensNeeded > model.maxTokens) {
        score *= 0.5; // Penalize models that can't handle required tokens
      }
      
      // Preferred model bonus
      if (taskPreferences.primary.includes(model.id)) {
        const preferenceBonus = taskPreferences.primary.indexOf(model.id) === 0 ? 10 : 5;
        score += preferenceBonus;
      }
      
      return { model, score };
    });
    
    return scoredModels
      .filter(sm => sm.score > 50) // Minimum viable score
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get available models from all providers
   */
  private getAvailableModels(): LLMModel[] {
    return this.providers.flatMap(provider => provider.models);
  }

  /**
   * Get provider for a specific model
   */
  private getProviderForModel(model: LLMModel): LLMProvider | undefined {
    return this.providers.find(provider => 
      provider.models.some(m => m.id === model.id)
    );
  }

  /**
   * Generate human-readable reasoning for routing decision
   */
  private generateRoutingReasoning(
    model: LLMModel, 
    requirements: TaskRequirements, 
    taskPreferences: typeof TASK_MODEL_PREFERENCES[TaskType],
    score: number
  ): string {
    const reasons: string[] = [];
    
    reasons.push(`Selected ${model.name} for ${requirements.type} task`);
    reasons.push(`Quality score: ${model.qualityScore}/100`);
    reasons.push(`Task alignment score: ${Math.round(score)}/100`);
    
    if (requirements.priority === 'quality') {
      reasons.push(`Prioritizing quality over cost/speed`);
    } else if (requirements.priority === 'cost') {
      reasons.push(`Cost-efficient choice (${model.costTier} cost tier)`);
    } else {
      reasons.push(`Balanced speed/quality choice`);
    }
    
    if (requirements.creativityLevel === 'high') {
      reasons.push(`High creativity requirement (${model.capabilities.creative}/100 creative score)`);
    }
    
    if (requirements.structuredOutput) {
      reasons.push(`Structured output capability (${model.capabilities.structured}/100 structured score)`);
    }
    
    reasons.push(taskPreferences.reasoning);
    
    return reasons.join('. ') + '.';
  }

  /**
   * Get fallback routing for when primary model fails
   */
  public getFallbackRouting(
    originalDecision: RoutingDecision, 
    failedAttempts: string[] = []
  ): RoutingDecision | null {
    const availableFallbacks = originalDecision.fallbackModels.filter(
      model => !failedAttempts.includes(model.id)
    );
    
    if (availableFallbacks.length === 0) {
      return null;
    }
    
    const fallbackModel = availableFallbacks[0];
    const fallbackProvider = this.getProviderForModel(fallbackModel);
    
    if (!fallbackProvider) {
      return null;
    }
    
    return {
      selectedModel: fallbackModel,
      selectedProvider: fallbackProvider,
      reasoning: `Fallback to ${fallbackModel.name} after primary model failure`,
      fallbackModels: availableFallbacks.slice(1),
      confidence: Math.max(originalDecision.confidence - 0.2, 0.3)
    };
  }
}

// Export singleton instance
export const routeLLMRouter = new RouteLLMRouter();
