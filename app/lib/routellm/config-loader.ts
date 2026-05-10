import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LLMActiveConfig {
  activeProvider: 'abacus' | 'gemini';
  ideaModel: string | null;
  writingModel: string | null;
  abacusApiKey: string | null;
  geminiApiKey: string | null;
}

let cachedConfig: LLMActiveConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds

/**
 * Load the active LLM configuration from the database.
 * Caches for 30 seconds to avoid excessive DB queries.
 */
export async function getActiveLLMConfig(): Promise<LLMActiveConfig> {
  const now = Date.now();
  if (cachedConfig && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedConfig;
  }

  try {
    const config = await prisma.lLMConfig.findFirst();
    if (config) {
      cachedConfig = {
        activeProvider: (config.activeProvider as 'abacus' | 'gemini') || 'abacus',
        ideaModel: config.ideaModel,
        writingModel: config.writingModel,
        abacusApiKey: config.abacusApiKey,
        geminiApiKey: config.geminiApiKey,
      };
      cacheTimestamp = now;
      return cachedConfig;
    }
  } catch (error) {
    console.warn('Failed to load LLM config from DB, using defaults:', error);
  }

  // Default fallback
  return {
    activeProvider: 'abacus',
    ideaModel: null,
    writingModel: null,
    abacusApiKey: process.env.ABACUSAI_API_KEY || null,
    geminiApiKey: null,
  };
}

/**
 * Invalidate the cached config (call after admin saves changes)
 */
export function invalidateLLMConfigCache() {
  cachedConfig = null;
  cacheTimestamp = 0;
}

/**
 * Determine which task categories are "idea" vs "writing"
 */
export function isIdeaTask(taskType: string): boolean {
  return ['genre-analysis', 'synopsis-generation', 'title-generation'].includes(taskType);
}

export function isWritingTask(taskType: string): boolean {
  return ['content-creation', 'marketing-copy'].includes(taskType);
}
