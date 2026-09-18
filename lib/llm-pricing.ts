// LLM pricing per 1M tokens (input / output) in USD
// Sourced from Abacus.AI RouteLLM API + public pricing pages
// Last updated: May 2026
export interface ModelPricing {
  input: number;  // $ per 1M input tokens
  output: number; // $ per 1M output tokens
}

const PRICING: Record<string, ModelPricing> = {
  // ==================== ABACUS.AI ROUTELLM ====================
  'route-llm': { input: 3.0, output: 15.0 },

  // ==================== OPENAI ====================
  // GPT-5.x Series
  'gpt-5.5': { input: 5.0, output: 30.0 },
  'chat-latest': { input: 5.0, output: 30.0 },
  'gpt-5.4': { input: 2.5, output: 15.0 },
  'gpt-5.4-mini': { input: 0.75, output: 4.5 },
  'gpt-5.4-nano': { input: 0.2, output: 1.25 },
  'gpt-5.3-chat-latest': { input: 1.75, output: 14.0 },
  'gpt-5.3-codex': { input: 1.75, output: 14.0 },
  'gpt-5.3-codex-xhigh': { input: 1.75, output: 14.0 },
  'gpt-5.2': { input: 1.75, output: 14.0 },
  'gpt-5.2-chat-latest': { input: 1.75, output: 14.0 },
  'gpt-5.2-codex': { input: 1.75, output: 14.0 },
  'gpt-5.1': { input: 1.25, output: 10.0 },
  'gpt-5.1-chat-latest': { input: 1.25, output: 10.0 },
  'gpt-5.1-codex': { input: 1.25, output: 10.0 },
  'gpt-5': { input: 1.25, output: 10.0 },
  'gpt-5-mini': { input: 0.25, output: 2.0 },
  'gpt-5-nano': { input: 0.05, output: 0.4 },
  'gpt-5-codex': { input: 1.25, output: 10.0 },
  // GPT-4.x Series
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1-nano': { input: 0.1, output: 0.4 },
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-2024-11-20': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  // Reasoning Models
  'o3': { input: 2.0, output: 8.0 },
  'o3-pro': { input: 20.0, output: 40.0 },
  'o3-mini': { input: 1.1, output: 4.4 },
  'o4-mini': { input: 1.1, output: 4.4 },
  // Open Source
  'openai/gpt-oss-120b': { input: 0.08, output: 0.44 },

  // ==================== ANTHROPIC CLAUDE ====================
  // Opus Series
  'claude-opus-4-7': { input: 5.0, output: 25.0 },
  'claude-opus-4-7-xhigh': { input: 5.0, output: 25.0 },
  'claude-opus-4-6': { input: 5.0, output: 25.0 },
  'claude-opus-4-5-20251101': { input: 5.0, output: 25.0 },
  'claude-opus-4-5': { input: 5.0, output: 25.0 },
  'claude-opus-4-1-20250805': { input: 15.0, output: 75.0 },
  'claude-opus-4-1': { input: 15.0, output: 75.0 },
  'claude-opus-4': { input: 15.0, output: 75.0 },
  // Sonnet Series
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-sonnet-4-5-20250929': { input: 3.0, output: 15.0 },
  'claude-sonnet-4-5': { input: 3.0, output: 15.0 },
  'claude-sonnet-4': { input: 3.0, output: 15.0 },
  'claude-3-5-sonnet': { input: 3.0, output: 15.0 },
  // Haiku Series
  'claude-haiku-4-5-20251001': { input: 1.0, output: 5.0 },
  'claude-haiku-4-5': { input: 1.0, output: 5.0 },
  'claude-3-5-haiku': { input: 0.8, output: 4.0 },

  // ==================== GOOGLE GEMINI ====================
  'gemini-3.1-pro-preview': { input: 2.0, output: 12.0 },
  'gemini-3.1-pro': { input: 2.0, output: 12.0 },
  'gemini-3.1-flash-lite-preview': { input: 0.25, output: 1.5 },
  'gemini-3.1-flash-lite': { input: 0.25, output: 1.5 },
  'gemini-3.1-flash-image-preview': { input: 0.5, output: 3.0 },
  'gemini-3-flash-preview': { input: 0.5, output: 3.0 },
  'gemini-3-flash': { input: 0.5, output: 3.0 },
  'gemini-3-pro-image-preview': { input: 2.0, output: 12.0 },
  'gemini-2.5-pro': { input: 1.25, output: 10.0 },
  'gemini-2.5-flash': { input: 0.3, output: 2.5 },
  'gemini-2.5-flash-image': { input: 0.3, output: 30.0 },
  'gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },
  'gemini-2.0-flash': { input: 0.1, output: 0.4 },
  'gemini-1.5-pro': { input: 1.25, output: 5.0 },
  'gemini-1.5-flash': { input: 0.075, output: 0.3 },
  'google/gemma-4-31b-it': { input: 0.14, output: 0.4 },

  // ==================== META LLAMA ====================
  'meta-llama/llama-4-maverick-17b-128e-instruct-fp8': { input: 0.14, output: 0.59 },
  'llama-4-maverick': { input: 0.14, output: 0.59 },
  'meta-llama/meta-llama-3.1-405b-instruct-turbo': { input: 3.5, output: 3.5 },
  'meta-llama/meta-llama-3.1-8b-instruct': { input: 0.02, output: 0.05 },
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.3-70b': { input: 0.59, output: 0.79 },

  // ==================== ALIBABA QWEN ====================
  'qwen-2.5-coder-32b': { input: 0.79, output: 0.79 },
  'qwen/qwen2.5-72b-instruct': { input: 0.11, output: 0.38 },
  'qwen/qwq-32b': { input: 0.4, output: 0.4 },
  'qwen/qwen3-235b-a22b-instruct-2507': { input: 0.13, output: 0.6 },
  'qwen3-235b-a22b': { input: 0.13, output: 0.6 },
  'qwen/qwen3-32b': { input: 0.09, output: 0.29 },
  'qwen/qwen3-coder-480b-a35b-instruct': { input: 0.29, output: 1.2 },
  'qwen3.6-plus': { input: 0.5, output: 3.0 },
  'qwen3-max': { input: 0.5, output: 3.0 },

  // ==================== xAI GROK ====================
  'grok-2-1212': { input: 2.0, output: 10.0 },
  'grok-3': { input: 3.0, output: 15.0 },
  'grok-3-mini': { input: 0.3, output: 0.5 },
  'grok-4-0709': { input: 3.0, output: 15.0 },
  'grok-4': { input: 3.0, output: 15.0 },
  'grok-4-fast-non-reasoning': { input: 0.2, output: 0.5 },
  'grok-4-1-fast-non-reasoning': { input: 0.2, output: 0.5 },
  'grok-4.20-beta-0309-non-reasoning': { input: 2.0, output: 6.0 },
  'grok-4.2': { input: 2.0, output: 6.0 },
  'grok-4.3': { input: 1.25, output: 2.5 },
  'grok-code-fast-1': { input: 0.2, output: 1.5 },

  // ==================== MOONSHOT KIMI ====================
  'kimi-k2-turbo-preview': { input: 0.15, output: 8.0 },
  'kimi-k2.5': { input: 0.6, output: 3.0 },
  'kimi-k2.6': { input: 0.95, output: 4.0 },

  // ==================== DEEPSEEK ====================
  'deepseek/deepseek-v3.1': { input: 0.55, output: 1.66 },
  'deepseek-v3.1': { input: 0.55, output: 1.66 },
  'deepseek-ai/deepseek-v3.1-terminus': { input: 0.27, output: 1.0 },
  'deepseek-ai/deepseek-r1': { input: 3.0, output: 7.0 },
  'deepseek-r1': { input: 3.0, output: 7.0 },
  'deepseek-ai/deepseek-v3.2': { input: 0.27, output: 0.4 },
  'deepseek-v3.2': { input: 0.27, output: 0.4 },
  'deepseek-v4-flash': { input: 0.14, output: 0.28 },
  'deepseek-v4-pro': { input: 1.74, output: 3.48 },

  // ==================== ZHIPU GLM ====================
  'zai-org/glm-4.5': { input: 0.6, output: 2.2 },
  'zai-org/glm-4.6': { input: 0.6, output: 2.2 },
  'zai-org/glm-4.7': { input: 0.6, output: 2.2 },
  'zai-org/glm-5': { input: 1.0, output: 3.2 },
  'zai-org/glm-5.1': { input: 1.4, output: 4.4 },

  // ==================== OTHER ====================
  'm2.7': { input: 0.3, output: 1.2 },
  'mimo-v2-pro': { input: 1.0, output: 3.0 },
  'abacus-smaug2': { input: 0.5, output: 1.5 },
  'abacus-dracarys': { input: 0.5, output: 1.5 },

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
  if (lower.includes('claude-opus')) return PRICING['claude-opus-4-7'];
  if (lower.includes('claude-sonnet')) return PRICING['claude-sonnet-4-6'];
  if (lower.includes('claude-haiku') || lower.includes('claude')) return PRICING['claude-haiku-4-5'];
  if (lower.includes('gemini-3')) return PRICING['gemini-3.1-pro'];
  if (lower.includes('gemini')) return PRICING['gemini-2.5-flash'];
  if (lower.includes('gemma')) return PRICING['google/gemma-4-31b-it'];
  if (lower.includes('llama')) return PRICING['llama-3.3-70b'];
  if (lower.includes('qwen')) return PRICING['qwen3-max'];
  if (lower.includes('grok')) return PRICING['grok-4'];
  if (lower.includes('kimi')) return PRICING['kimi-k2.5'];
  if (lower.includes('deepseek')) return PRICING['deepseek-v3.1'];
  if (lower.includes('glm')) return PRICING['zai-org/glm-4.6'];
  if (lower.includes('gpt') || lower.includes('o3') || lower.includes('o4')) return PRICING['gpt-4o-mini'];
  return PRICING['default'];
}

export function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const p = getModelPricing(model);
  const cost = (promptTokens * p.input + completionTokens * p.output) / 1_000_000;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

export function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}
