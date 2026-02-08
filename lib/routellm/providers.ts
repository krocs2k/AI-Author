
import { LLMProvider } from './types';
import { AVAILABLE_MODELS } from './models';

// Define available providers
export const PROVIDERS: LLMProvider[] = [
  {
    name: 'AbacusAI',
    baseURL: 'https://routellm.abacus.ai/v1/chat/completions',
    apiKey: process.env.ABACUSAI_API_KEY || '',
    models: AVAILABLE_MODELS.filter(m => m.provider === 'abacusai'),
    priority: 1,
    isAvailable: !!process.env.ABACUSAI_API_KEY
  },
  // Future providers can be added here when API keys become available
  {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1/chat/completions',
    apiKey: process.env.OPENAI_API_KEY || '',
    models: [], // Would be populated when API key is available
    priority: 2,
    isAvailable: false // Set to false since we don't have the API key
  },
  {
    name: 'Anthropic',
    baseURL: 'https://api.anthropic.com/v1/messages',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    models: [], // Would be populated when API key is available
    priority: 3,
    isAvailable: false
  },
  {
    name: 'Google',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/models',
    apiKey: process.env.GOOGLE_API_KEY || '',
    models: [], // Would be populated when API key is available
    priority: 4,
    isAvailable: false
  }
];

// Get available providers only
export function getAvailableProviders(): LLMProvider[] {
  return PROVIDERS.filter(provider => provider.isAvailable);
}

// Get provider by name
export function getProviderByName(name: string): LLMProvider | undefined {
  return PROVIDERS.find(provider => provider.name.toLowerCase() === name.toLowerCase());
}

// Get primary provider (highest priority available)
export function getPrimaryProvider(): LLMProvider | undefined {
  const available = getAvailableProviders();
  return available.sort((a, b) => a.priority - b.priority)[0];
}

// Check if provider is available
export function isProviderAvailable(providerName: string): boolean {
  const provider = getProviderByName(providerName);
  return provider?.isAvailable || false;
}

// Initialize providers - check availability and populate models
export async function initializeProviders(): Promise<void> {
  for (const provider of PROVIDERS) {
    try {
      if (provider.apiKey) {
        // Test the provider connection
        const testResponse = await fetch(provider.baseURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`,
          },
          body: JSON.stringify({
            model: provider.models[0]?.id || 'test',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1
          }),
        });
        
        // Update availability based on response
        provider.isAvailable = testResponse.status !== 401 && testResponse.status !== 403;
      }
    } catch (error) {
      console.warn(`Provider ${provider.name} initialization failed:`, error);
      provider.isAvailable = false;
    }
  }
}
