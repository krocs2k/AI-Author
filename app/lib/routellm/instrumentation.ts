import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { calculateCost } from '@/lib/llm-pricing';
import type { ChatMessage, ChatCompletionRequest } from './client';
import type { LLMResponse, TaskType } from './types';

// Tasks safe to cache (deterministic, reusable across users)
// Skip caching content-creation, chapter generation, anything book-specific & creative
const CACHEABLE_TASKS: TaskType[] = [
  'genre-analysis',
  'general',
] as TaskType[];

export function isCacheable(taskType?: TaskType): boolean {
  if (!taskType) return false;
  return CACHEABLE_TASKS.includes(taskType);
}

export function buildCacheKey(
  taskType: string,
  model: string,
  messages: ChatMessage[]
): string {
  const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const user = messages.filter(m => m.role === 'user').map(m => m.content).join('\n');
  const payload = `${taskType}|${model}|${system}|${user}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export async function checkPromptCache(cacheKey: string) {
  try {
    const entry = await prisma.promptCache.findUnique({ where: { cacheKey } });
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < new Date()) return null;
    // increment hit count async (don't block response)
    prisma.promptCache.update({
      where: { id: entry.id },
      data: { hitCount: { increment: 1 }, lastHitAt: new Date() },
    }).catch(() => {});
    return entry;
  } catch (e) {
    console.warn('[PromptCache] check failed:', e);
    return null;
  }
}

export async function writePromptCache(
  cacheKey: string,
  taskType: string,
  model: string,
  messages: ChatMessage[],
  response: string,
  promptTokens: number,
  completionTokens: number
) {
  try {
    const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    const user = messages.filter(m => m.role === 'user').map(m => m.content).join('\n');
    // 7-day expiration for cache entries
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.promptCache.upsert({
      where: { cacheKey },
      update: { response, promptTokens, completionTokens, expiresAt },
      create: {
        cacheKey,
        taskType,
        model,
        systemPrompt: system,
        userPrompt: user,
        response,
        promptTokens,
        completionTokens,
        expiresAt,
      },
    });
  } catch (e) {
    console.warn('[PromptCache] write failed:', e);
  }
}

export async function logUsage(opts: {
  userId?: string | null;
  sessionId?: string | null;
  taskType: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cacheHit: boolean;
  durationMs: number;
}) {
  try {
    const cost = opts.cacheHit ? 0 : calculateCost(opts.model, opts.promptTokens, opts.completionTokens);
    await prisma.lLMUsageLog.create({
      data: {
        userId: opts.userId || null,
        sessionId: opts.sessionId || null,
        taskType: opts.taskType,
        provider: opts.provider,
        model: opts.model,
        promptTokens: opts.promptTokens,
        completionTokens: opts.completionTokens,
        totalTokens: opts.totalTokens,
        estimatedCostUsd: cost,
        cacheHit: opts.cacheHit,
        durationMs: opts.durationMs,
      },
    });
  } catch (e) {
    console.warn('[LLMUsageLog] write failed:', e);
  }
}

export function normalizeUsage(rawUsage: any): { promptTokens: number; completionTokens: number; totalTokens: number } {
  if (!rawUsage) return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  const promptTokens = rawUsage.promptTokens ?? rawUsage.prompt_tokens ?? rawUsage.promptTokenCount ?? 0;
  const completionTokens = rawUsage.completionTokens ?? rawUsage.completion_tokens ?? rawUsage.candidatesTokenCount ?? 0;
  const totalTokens = rawUsage.totalTokens ?? rawUsage.total_tokens ?? rawUsage.totalTokenCount ?? (promptTokens + completionTokens);
  return { promptTokens, completionTokens, totalTokens };
}
