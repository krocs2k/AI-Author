import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LLMActiveConfig {
  activeProvider: 'abacus' | 'openai' | 'gemini';
  ideaModel: string | null;
  writingModel: string | null;
  imageModel: string | null;
  abacusApiKey: string | null;
  geminiApiKey: string | null;
  openaiApiKey: string | null;
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
        activeProvider: (config.activeProvider as 'abacus' | 'openai' | 'gemini') || 'abacus',
        ideaModel: config.ideaModel,
        writingModel: config.writingModel,
        imageModel: (config as any).imageModel || null,
        abacusApiKey: config.abacusApiKey,
        geminiApiKey: config.geminiApiKey,
        openaiApiKey: config.openaiApiKey,
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
    imageModel: null,
    abacusApiKey: process.env.ABACUSAI_API_KEY || null,
    geminiApiKey: null,
    openaiApiKey: null,
  };
}

/**
 * Invalidate the cached config (call after admin saves changes)
 */
export function invalidateLLMConfigCache() {
  cachedConfig = null;
  cacheTimestamp = 0;
  cachedBible = null;
  bibleCacheTimestamp = 0;
}

// --- Creative Novel System Bible ---------------------------------------

let cachedBible: string | null = null;
let bibleCacheTimestamp = 0;

/**
 * Load the admin-provided Creative Novel System Bible from the database.
 * Cached for 30 seconds. Returns an empty string if none is configured.
 */
export async function getNovelSystemBible(): Promise<string> {
  const now = Date.now();
  if (cachedBible !== null && (now - bibleCacheTimestamp) < CACHE_TTL) {
    return cachedBible;
  }

  try {
    const config = await prisma.lLMConfig.findFirst();
    const bible = ((config as any)?.novelSystemBible || '').trim();
    cachedBible = bible;
    bibleCacheTimestamp = now;
    return bible;
  } catch (error) {
    console.warn('Failed to load Novel System Bible from DB:', error);
    return cachedBible || '';
  }
}

/**
 * Prepend the Creative Novel System Bible to a system prompt as the highest
 * priority set of directives, so it acts as the core controller for all
 * novel writing. Returns the original prompt unchanged when no bible is set.
 */
export async function withNovelSystemBible(systemPrompt: string): Promise<string> {
  const bible = await getNovelSystemBible();
  if (!bible) return systemPrompt;

  return `=== CREATIVE NOVEL SYSTEM BIBLE (CORE DIRECTIVES — HIGHEST PRIORITY) ===
The following rules are provided by the system administrator and are the authoritative core controller for ALL novel writing in this system. They OVERRIDE any conflicting instruction that follows. Follow them exactly and consistently in every piece of content you produce.

${bible}
=== END CREATIVE NOVEL SYSTEM BIBLE ===

${systemPrompt}`;
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
