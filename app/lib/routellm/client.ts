
import { LLMResponse, TaskType, TaskRequirements, RoutingDecision } from './types';
import { routeLLMRouter } from './router';

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
}

export class RouteLLMClient {
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  /**
   * Main method for chat completions with intelligent routing
   */
  public async chatCompletion(request: ChatCompletionRequest): Promise<LLMResponse> {
    const taskType = request.taskType || 'general';
    const routing = routeLLMRouter.route(taskType, request.taskRequirements);
    
    let lastError: Error | null = null;
    const failedModels: string[] = [];
    let currentRouting = routing;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.makeAPICall(currentRouting, request, attempt + 1);
        return response;
      } catch (error) {
        lastError = error as Error;
        failedModels.push(currentRouting.selectedModel.id);
        
        console.warn(`Attempt ${attempt + 1} failed with ${currentRouting.selectedModel.name}:`, error);
        
        // Try fallback routing
        const fallbackRouting = routeLLMRouter.getFallbackRouting(routing, failedModels);
        if (fallbackRouting && attempt < this.maxRetries - 1) {
          currentRouting = fallbackRouting;
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
    
    // Make the API call with timeout (max 80 seconds to stay under Cloudflare's ~100s limit)
    const controller = new AbortController();
    const timeoutMs = 80000; // 80 seconds max to avoid Cloudflare 524 errors
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
      usage: data.usage || undefined,
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
   * Set retry configuration
   */
  public setRetryConfig(maxRetries: number, retryDelay: number = 1000): void {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }
}

// Export singleton instance
export const routeLLMClient = new RouteLLMClient();
