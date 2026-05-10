// LLM pricing per 1M tokens (input / output) in USD
// Approximate public pricing — used for cost estimation only
export interface ModelPricing {
  input: number;  // $ per 1M input tokens
  output: number; // $ per 1M output tokens
}

const PRICING: Record<string, ModelPricing> = {
  // OpenAI / Abacus RouteLLM
  'gpt-5': { input: 1.25, output: 10 },
  'gpt-5-mini': { input: 0.25, output: 2 },
  'gpt-5-nano': { input: 0.05, output: 0.4 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4.1': { input: 2, output: 8 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'o3': { input: 2, output: 8 },
  'o3-mini': { input: 1.1, output: 4.4 },
  'o4-mini': { input: 1.1, output: 4.4 },
  // Anthropic
  'claude-opus-4': { input: 15, output: 75 },
  'claude-sonnet-4': { input: 3, output: 15 },
  'claude-3-5-sonnet': { input: 3, output: 15 },
  'claude-3-5-haiku': { input: 0.8, output: 4 },
  // Google
  'gemini-2.5-pro': { input: 1.25, output: 10 },
  'gemini-2.5-flash': { input: 0.3, output: 2.5 },
  'gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
  'gemini-1.5-pro': { input: 1.25, output: 5 },
  'gemini-1.5-flash': { input: 0.075, output: 0.3 },
  // RouteLLM auto = weighted average estimate
  'route-llm': { input: 2, output: 8 },
  'default': { input: 2, output: 8 },
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
