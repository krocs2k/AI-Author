// LLM pricing per 1M tokens (input / output) in USD
// Approximate public pricing — used for cost estimation only
// Last updated: May 2026
export interface ModelPricing {
  input: number;  // $ per 1M input tokens
  output: number; // $ per 1M output tokens
}

const PRICING: Record<string, ModelPricing> = {
  // ==================== OPENAI / ABACUS ROUTELLM ====================
  // Latest GPT-5.x Series (2026)
  'gpt-5.5': { input: 5.0, output: 30.0 },
  'gpt-5.5-pro': { input: 30.0, output: 180.0 },
  'gpt-5.4': { input: 2.5, output: 15.0 },
  'gpt-5.4-mini': { input: 0.75, output: 4.5 },
  'gpt-5.4-nano': { input: 0.2, output: 1.25 },
  // Legacy GPT-5.x (kept for compatibility)
  'gpt-5': { input: 1.25, output: 10 },
  'gpt-5-mini': { input: 0.25, output: 2 },
  'gpt-5-nano': { input: 0.05, output: 0.4 },
  // GPT-4.x Series
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  // Reasoning Models
  'o3': { input: 2.0, output: 8.0 },
  'o3-mini': { input: 1.1, output: 4.4 },
  'o4-mini': { input: 1.1, output: 4.4 },

  // ==================== ANTHROPIC CLAUDE ====================
  // Claude Opus Series (Latest 4.7)
  'claude-opus-4.7': { input: 5.0, output: 25.0 },
  'claude-opus-4.6': { input: 5.0, output: 25.0 },
  'claude-opus-4.5': { input: 5.0, output: 25.0 },
  'claude-opus-4.1': { input: 15.0, output: 75.0 },
  'claude-opus-4': { input: 15.0, output: 75.0 },
  // Claude Sonnet Series (Latest 4.6)
  'claude-sonnet-4.6': { input: 3.0, output: 15.0 },
  'claude-sonnet-4.5': { input: 3.0, output: 15.0 },
  'claude-sonnet-4': { input: 3.0, output: 15.0 },
  'claude-3-5-sonnet': { input: 3.0, output: 15.0 },
  'claude-sonnet-3.7': { input: 3.0, output: 15.0 },
  // Claude Haiku Series (Latest 4.5)
  'claude-haiku-4.5': { input: 1.0, output: 5.0 },
  'claude-3-5-haiku': { input: 0.8, output: 4.0 },

  // ==================== GOOGLE GEMINI ====================
  // Gemini 3.1 Series (Latest)
  'gemini-3.1-pro': { input: 2.0, output: 12.0 },
  'gemini-3.1-flash-lite': { input: 0.25, output: 1.5 },
  'gemini-3.1-flash': { input: 0.1, output: 0.4 },
  // Gemini 2.5 Series
  'gemini-2.5-pro': { input: 1.25, output: 10.0 },
  'gemini-2.5-flash': { input: 0.3, output: 2.5 },
  'gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },
  // Gemini 2.0 Series
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
  // Gemini 1.5 Series
  'gemini-1.5-pro': { input: 1.25, output: 5.0 },
  'gemini-1.5-flash': { input: 0.075, output: 0.3 },
  // Gemini 1.0 Series (Legacy)
  'gemini-1.0-pro': { input: 0.5, output: 1.5 },

  // ==================== AUTO-ROUTING ====================
  'route-llm': { input: 2.0, output: 8.0 },
  
  // Default fallback
  'default': { input: 2.0, output: 8.0 },
};

export function getModelPricing(model: string): ModelPricing {
  if (!model) return PRICING['default'];
  const lower = model.toLowerCase();
  // Direct match
  if (PRICING[lower]) return PRICING[lower];
  // Prefix match (e.g. gpt-5-2025-xx → gpt-5)
  for (const key of Object.keys(PRICING)) {
    if (key !== 'default' && lower.startsWith(key)) return PRICING[key];
  }
  // Family fallback
  if (lower.includes('claude')) return PRICING['claude-3-5-sonnet'];
  if (lower.includes('gemini')) return PRICING['gemini-2.5-flash'];
  if (lower.includes('gpt') || lower.includes('o3') || lower.includes('o4')) return PRICING['gpt-4o-mini'];
  return PRICING['default'];
}

export function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const p = getModelPricing(model);
  const cost = (promptTokens * p.input + completionTokens * p.output) / 1_000_000;
  return Math.round(cost * 1_000_000) / 1_000_000; // round to 6 decimals
}

export function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}
