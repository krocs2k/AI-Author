
import { LLMResponse, TaskType, TaskRequirements, RoutingDecision } from './types';
import { routeLLMRouter } from './router';
import { getActiveLLMConfig, isIdeaTask, isWritingTask } from './config-loader';
import {
  buildCacheKey,
  checkPromptCache,
  writePromptCache,
  logUsage,
  normalizeUsage,
  isCacheable,
} from './instrumentation';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' };
  taskType?: TaskType;
  taskRequirements?: Partial<TaskRequirements>;
  // Instrumentation context
  userId?: string | null;
  sessionId?: string | null;
  // Force-disable cache (for content unique per book)
  bypassCache?: boolean;
}

export class RouteLLMClient {
  private maxRetries: number = 2; // Reduced to 2 to stay under Cloudflare's ~100s limit
  private retryDelay: number = 500; // Reduced delay

  /**
   * Main method for chat completions with intelligent routing
   */
  public async chatCompletion(request: ChatCompletionRequest): Promise<LLMResponse> {
    const startedAt = Date.now();
    // Load active config from database
    const activeConfig = await getActiveLLMConfig();
    
    // Determine which model to use based on task type
    const taskType = request.taskType || 'general';
    let overrideModel: string | null = null;
    
    if (isIdeaTask(taskType) && activeConfig.ideaModel) {
      overrideModel = activeConfig.ideaModel;
    } else if (isWritingTask(taskType) && activeConfig.writingModel) {
      overrideModel = activeConfig.writingModel;
    } else if (activeConfig.ideaModel) {
      // Fall back to idea model for general tasks
      overrideModel = activeConfig.ideaModel;
    }

    const effectiveModel = overrideModel || (
      activeConfig.activeProvider === 'gemini' ? 'gemini-2.5-flash' :
      activeConfig.activeProvider === 'openai' ? 'gpt-4.1' :
      'route-llm'
    );
    const provider = activeConfig.activeProvider === 'gemini' ? 'Gemini' :
                     activeConfig.activeProvider === 'openai' ? 'OpenAI' : 'Abacus';

    // ===== Prompt cache lookup =====
    const canCache = !request.bypassCache && isCacheable(taskType);
    const cacheKey = canCache ? buildCacheKey(taskType, effectiveModel, request.messages) : null;
    if (cacheKey) {
      const cached = await checkPromptCache(cacheKey);
      if (cached) {
        const dur = Date.now() - startedAt;
        // log cache hit usage
        logUsage({
          userId: request.userId,
          sessionId: request.sessionId,
          taskType,
          provider,
          model: cached.model,
          promptTokens: cached.promptTokens,
          completionTokens: cached.completionTokens,
          totalTokens: cached.promptTokens + cached.completionTokens,
          cacheHit: true,
          durationMs: dur,
        }).catch(() => {});
        return {
          content: cached.response,
          model: cached.model,
          provider,
          usage: {
            promptTokens: cached.promptTokens,
            completionTokens: cached.completionTokens,
            totalTokens: cached.promptTokens + cached.completionTokens,
          },
          metadata: {
            attemptNumber: 1,
            fallbackUsed: false,
            cacheHit: true,
          } as any,
        };
      }
    }

    // If using Gemini provider, use Gemini API directly
    if (activeConfig.activeProvider === 'gemini' && activeConfig.geminiApiKey) {
      const resp = await this.callGeminiAPI(request, activeConfig.geminiApiKey, overrideModel || 'gemini-2.5-flash');
      await this._afterCall(resp, request, taskType, cacheKey, startedAt);
      return resp;
    }

    // If using OpenAI provider, use OpenAI API directly
    if (activeConfig.activeProvider === 'openai' && activeConfig.openaiApiKey) {
      const resp = await this.callOpenAIAPI(request, activeConfig.openaiApiKey, overrideModel || 'gpt-4.1');
      await this._afterCall(resp, request, taskType, cacheKey, startedAt);
      return resp;
    }

    // Use Abacus.AI / RouteLLM routing
    const routing = routeLLMRouter.route(taskType, request.taskRequirements);
    
    // Override the API key if the admin configured one
    if (activeConfig.abacusApiKey) {
      routing.selectedProvider = {
        ...routing.selectedProvider,
        apiKey: activeConfig.abacusApiKey,
      };
    }
    
    // Override the model if admin selected a specific one
    if (overrideModel) {
      routing.selectedModel = {
        ...routing.selectedModel,
        id: overrideModel,
        name: overrideModel,
      };
    }
    
    let lastError: Error | null = null;
    const failedModels: string[] = [];
    let currentRouting = routing;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.makeAPICall(currentRouting, request, attempt + 1);
        await this._afterCall(response, request, taskType, cacheKey, startedAt);
        return response;
      } catch (error) {
        lastError = error as Error;
        failedModels.push(currentRouting.selectedModel.id);
        
        console.warn(`Attempt ${attempt + 1} failed with ${currentRouting.selectedModel.name}:`, error);
        
        // Try fallback routing
        const fallbackRouting = routeLLMRouter.getFallbackRouting(routing, failedModels);
        if (fallbackRouting && attempt < this.maxRetries - 1) {
          currentRouting = fallbackRouting;
          // Override API key on fallback too
          if (activeConfig.abacusApiKey) {
            currentRouting.selectedProvider = {
              ...currentRouting.selectedProvider,
              apiKey: activeConfig.abacusApiKey,
            };
          }
          console.log(`Trying fallback: ${currentRouting.selectedModel.name}`);
          
          // Add delay before retry
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
        } else {
          break;
        }
      }
    }
    
    throw new Error(`All routing attempts failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Call the Google Gemini API directly
   */
  private async callGeminiAPI(
    request: ChatCompletionRequest,
    apiKey: string,
    modelId: string
  ): Promise<LLMResponse> {
    // Convert OpenAI-style messages to Gemini format
    const systemInstruction = request.messages
      .filter(m => m.role === 'system')
      .map(m => m.content)
      .join('\n');
    
    const contents = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: request.temperature || 0.7,
        maxOutputTokens: request.maxTokens || 4000,
      },
    };

    if (systemInstruction) {
      requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    if (request.responseFormat?.type === 'json_object') {
      requestBody.generationConfig.responseMimeType = 'application/json';
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    
    const controller = new AbortController();
    const timeoutMs = 55000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error(`Gemini request timed out after ${timeoutMs / 1000} seconds`);
      }
      throw fetchError;
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API request failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!content.trim()) {
      throw new Error('Empty response from Gemini API');
    }

    return {
      content,
      model: modelId,
      provider: 'Gemini',
      usage: data.usageMetadata ? {
        promptTokens: data.usageMetadata.promptTokenCount || 0,
        completionTokens: data.usageMetadata.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata.totalTokenCount || 0,
      } : undefined,
      metadata: {
        attemptNumber: 1,
        fallbackUsed: false,
        routingDecision: {
          selectedModel: { id: modelId, name: modelId, provider: 'gemini', capabilities: { creative: 90, analytical: 90, technical: 90, conversational: 90, longForm: 90, structured: 90 }, costTier: 'medium', qualityScore: 90, maxTokens: 8192, contextWindow: 1000000 },
          selectedProvider: { name: 'Gemini', baseURL: url, apiKey: '***', models: [], priority: 1, isAvailable: true },
          reasoning: `Using Gemini model ${modelId} via direct API`,
          fallbackModels: [],
          confidence: 0.9,
        }
      }
    };
  }

  /**
   * Call the OpenAI API directly (uses same format as Abacus/RouteLLM)
   */
  private async callOpenAIAPI(
    request: ChatCompletionRequest,
    apiKey: string,
    modelId: string
  ): Promise<LLMResponse> {
    const requestBody: any = {
      model: modelId,
      messages: request.messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 4000,
    };

    if (request.responseFormat) {
      requestBody.response_format = request.responseFormat;
    }

    const controller = new AbortController();
    const timeoutMs = 55000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error(`OpenAI request timed out after ${timeoutMs / 1000} seconds`);
      }
      throw fetchError;
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API request failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content.trim()) {
      throw new Error('Empty response from OpenAI API');
    }

    return {
      content,
      model: data.model || modelId,
      provider: 'OpenAI',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens ?? 0,
        completionTokens: data.usage.completion_tokens ?? 0,
        totalTokens: data.usage.total_tokens ?? 0,
      } : undefined,
      metadata: {
        attemptNumber: 1,
        fallbackUsed: false,
        routingDecision: {
          selectedModel: { id: modelId, name: modelId, provider: 'openai', capabilities: { creative: 95, analytical: 95, technical: 95, conversational: 95, longForm: 95, structured: 95 }, costTier: 'medium', qualityScore: 95, maxTokens: 32768, contextWindow: 1047576 },
          selectedProvider: { name: 'OpenAI', baseURL: 'https://api.openai.com/v1/chat/completions', apiKey: '***', models: [], priority: 1, isAvailable: true },
          reasoning: `Using OpenAI model ${modelId} via direct API`,
          fallbackModels: [],
          confidence: 0.95,
        }
      }
    };
  }

  /**
   * Make the actual API call to the selected provider
   */
  private async makeAPICall(
    routing: RoutingDecision, 
    request: ChatCompletionRequest, 
    attempt: number
  ): Promise<LLMResponse> {
    const { selectedModel, selectedProvider } = routing;
    
    // Prepare request body
    const requestBody: any = {
      messages: request.messages,
      temperature: request.temperature || 0.7,
      max_tokens: Math.min(request.maxTokens || 4000, selectedModel.maxTokens)
    };
    
    // Only add model if it's not route-llm (route-llm uses automatic routing when model is omitted)
    if (selectedModel.id !== 'route-llm') {
      requestBody.model = selectedModel.id;
    }
    
    // Add response format if specified
    if (request.responseFormat) {
      requestBody.response_format = request.responseFormat;
    }
    
    // Make the API call with timeout (max 55 seconds per attempt)
    // With 2 attempts max, this gives 55+55=110s total, but most succeed on first try
    const controller = new AbortController();
    const timeoutMs = 55000; // 55 seconds per attempt
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    let response: Response;
    try {
      response = await fetch(selectedProvider.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${selectedProvider.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs / 60000} minutes`);
      }
      throw fetchError;
    }
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    if (!content.trim()) {
      throw new Error('Empty response from API');
    }
    
    // Return structured response
    return {
      content,
      model: data.model || selectedModel.id,
      provider: selectedProvider.name,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens ?? data.usage.promptTokens ?? 0,
        completionTokens: data.usage.completion_tokens ?? data.usage.completionTokens ?? 0,
        totalTokens: data.usage.total_tokens ?? data.usage.totalTokens ?? 0,
      } : undefined,
      metadata: {
        attemptNumber: attempt,
        fallbackUsed: attempt > 1,
        routingDecision: routing
      }
    };
  }

  /**
   * Convenience method for simple text generation
   */
  public async generateText(
    prompt: string, 
    taskType: TaskType = 'general',
    options: Partial<ChatCompletionRequest> = {}
  ): Promise<string> {
    const response = await this.chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      taskType,
      ...options
    });
    
    return response.content;
  }

  /**
   * Convenience method for system + user prompt
   */
  public async generateWithSystem(
    systemPrompt: string,
    userPrompt: string,
    taskType: TaskType = 'general',
    options: Partial<ChatCompletionRequest> = {}
  ): Promise<LLMResponse> {
    return this.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      taskType,
      ...options
    });
  }

  /**
   * Post-call: log usage + write cache (fire-and-forget, errors swallowed)
   */
  private async _afterCall(
    response: LLMResponse,
    request: ChatCompletionRequest,
    taskType: TaskType,
    cacheKey: string | null,
    startedAt: number
  ): Promise<void> {
    try {
      const usage = normalizeUsage(response.usage);
      const dur = Date.now() - startedAt;
      logUsage({
        userId: request.userId,
        sessionId: request.sessionId,
        taskType,
        provider: response.provider || 'unknown',
        model: response.model || 'unknown',
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        cacheHit: false,
        durationMs: dur,
      }).catch(() => {});
      if (cacheKey && response.content) {
        writePromptCache(
          cacheKey,
          taskType,
          response.model || 'unknown',
          request.messages,
          response.content,
          usage.promptTokens,
          usage.completionTokens
        ).catch(() => {});
      }
    } catch (e) {
      console.warn('[Instrumentation] _afterCall failed:', e);
    }
  }

  /**
   * Set retry configuration
   */
  public setRetryConfig(maxRetries: number, retryDelay: number = 1000): void {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }
}

// Export singleton instance
export const routeLLMClient = new RouteLLMClient();
