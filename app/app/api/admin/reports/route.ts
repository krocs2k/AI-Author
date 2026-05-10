import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateCost, getModelPricing } from '@/lib/llm-pricing';

export const dynamic = 'force-dynamic';

function periodStart(period: string): Date {
  const now = new Date();
  const d = new Date(now);
  switch (period) {
    case 'week':    d.setDate(d.getDate() - 7); break;
    case 'month':   d.setMonth(d.getMonth() - 1); break;
    case 'quarter': d.setMonth(d.getMonth() - 3); break;
    case 'year':    d.setFullYear(d.getFullYear() - 1); break;
    default:        d.setMonth(d.getMonth() - 1);
  }
  return d;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'month';
  let since = periodStart(period);

  // Check if stats were reset — if so, use the later of periodStart and statsResetAt
  try {
    const config = await prisma.lLMConfig.findFirst({ select: { statsResetAt: true } });
    if (config && (config as any).statsResetAt) {
      const resetAt = new Date((config as any).statsResetAt);
      if (resetAt > since) since = resetAt;
    }
  } catch (e) {
    // Ignore — statsResetAt field may not exist yet
  }

  // 1. All usage logs in period
  const logs = await prisma.lLMUsageLog.findMany({
    where: { createdAt: { gte: since } },
    select: {
      id: true, sessionId: true, taskType: true, provider: true, model: true,
      promptTokens: true, completionTokens: true, totalTokens: true,
      estimatedCostUsd: true, cacheHit: true, durationMs: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Books created in period (with user)
  const sessions = await prisma.bookSession.findMany({
    where: { createdAt: { gte: since } },
    select: {
      id: true, name: true, selectedTitle: true, customTitle: true,
      selectedGenre: true, totalWordCount: true, currentStep: true,
      createdAt: true, userId: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 3. Aggregate per-book cost
  const costBySession = new Map<string, { cost: number; tokens: number; calls: number; cacheHits: number }>();
  for (const log of logs) {
    const key = log.sessionId || '__none__';
    const cur = costBySession.get(key) || { cost: 0, tokens: 0, calls: 0, cacheHits: 0 };
    cur.cost += log.estimatedCostUsd;
    cur.tokens += log.totalTokens;
    cur.calls += 1;
    if (log.cacheHit) cur.cacheHits += 1;
    costBySession.set(key, cur);
  }

  const perBook = sessions.map(s => {
    const stats = costBySession.get(s.id) || { cost: 0, tokens: 0, calls: 0, cacheHits: 0 };
    return {
      id: s.id,
      name: s.name || s.selectedTitle || s.customTitle || 'Untitled',
      genre: s.selectedGenre || '—',
      wordCount: s.totalWordCount || 0,
      step: s.currentStep,
      createdAt: s.createdAt,
      user: s.user?.email || 'Anonymous',
      cost: stats.cost,
      tokens: stats.tokens,
      calls: stats.calls,
      cacheHits: stats.cacheHits,
    };
  });

  // 4. Per-model usage
  const perModelMap = new Map<string, { provider: string; calls: number; promptTokens: number; completionTokens: number; cost: number; cacheHits: number }>();
  for (const log of logs) {
    const k = log.model;
    const cur = perModelMap.get(k) || { provider: log.provider, calls: 0, promptTokens: 0, completionTokens: 0, cost: 0, cacheHits: 0 };
    cur.calls += 1;
    cur.promptTokens += log.promptTokens;
    cur.completionTokens += log.completionTokens;
    cur.cost += log.estimatedCostUsd;
    if (log.cacheHit) cur.cacheHits += 1;
    perModelMap.set(k, cur);
  }
  const perModel = Array.from(perModelMap.entries()).map(([model, v]) => ({ model, ...v })).sort((a, b) => b.cost - a.cost);

  // 5. Per-task-type breakdown
  const perTaskMap = new Map<string, { calls: number; cost: number; tokens: number; cacheHits: number }>();
  for (const log of logs) {
    const k = log.taskType;
    const cur = perTaskMap.get(k) || { calls: 0, cost: 0, tokens: 0, cacheHits: 0 };
    cur.calls += 1;
    cur.cost += log.estimatedCostUsd;
    cur.tokens += log.totalTokens;
    if (log.cacheHit) cur.cacheHits += 1;
    perTaskMap.set(k, cur);
  }
  const perTask = Array.from(perTaskMap.entries()).map(([task, v]) => ({ task, ...v })).sort((a, b) => b.cost - a.cost);

  // Totals
  const totalCost = logs.reduce((s, l) => s + l.estimatedCostUsd, 0);
  const totalCalls = logs.length;
  const totalCacheHits = logs.filter(l => l.cacheHit).length;
  const cacheHitRate = totalCalls > 0 ? totalCacheHits / totalCalls : 0;
  const bookCount = sessions.length;
  const completedBooks = sessions.filter(s => (s.currentStep || 0) >= 5).length;
  const avgCostPerBook = bookCount > 0 ? totalCost / bookCount : 0;

  // 6. Recommendations
  const recommendations: string[] = [];
  if (perModel.length > 0) {
    const top = perModel[0];
    const topPricing = getModelPricing(top.model);
    // Find a cheaper alternative within same family
    const familyMap: Record<string, string> = {
      'gpt-5': 'gpt-5-mini',
      'gpt-4o': 'gpt-4o-mini',
      'gpt-4.1': 'gpt-4.1-mini',
      'claude-opus-4': 'claude-sonnet-4',
      'claude-3-5-sonnet': 'claude-3-5-haiku',
      'gemini-2.5-pro': 'gemini-2.5-flash',
      'gemini-2.5-flash': 'gemini-2.5-flash-lite',
    };
    const cheaperKey = Object.keys(familyMap).find(k => top.model.toLowerCase().startsWith(k));
    if (cheaperKey) {
      const alt = familyMap[cheaperKey];
      const altCost = calculateCost(alt, top.promptTokens, top.completionTokens);
      const savings = top.cost - altCost;
      const pct = top.cost > 0 ? Math.round((savings / top.cost) * 100) : 0;
      if (savings > 0.01) {
        recommendations.push(`Switching from "${top.model}" to "${alt}" for similar workloads could have saved ~$${savings.toFixed(2)} (${pct}%) in this period.`);
      }
    }
  }
  if (cacheHitRate < 0.1 && totalCalls > 20) {
    recommendations.push(`Prompt cache hit rate is low (${(cacheHitRate*100).toFixed(1)}%). Standardizing system prompts and avoiding unnecessary variability will boost reuse and cut costs.`);
  } else if (cacheHitRate >= 0.3) {
    recommendations.push(`Prompt cache is performing well (${(cacheHitRate*100).toFixed(1)}% hit rate). Estimated savings already factored into reported costs.`);
  }
  // High-cost task pinpoint
  if (perTask.length > 0 && perTask[0].cost > totalCost * 0.5) {
    recommendations.push(`Task "${perTask[0].task}" accounts for ${((perTask[0].cost/totalCost)*100).toFixed(0)}% of spend. Consider using a smaller/faster model for this specific task.`);
  }
  // Idle / unfinished books
  const unfinished = sessions.filter(s => (s.currentStep || 0) < 5).length;
  if (unfinished > 0 && bookCount > 0 && unfinished / bookCount > 0.5) {
    recommendations.push(`${unfinished} of ${bookCount} books are unfinished. Cost is being incurred without completed output — consider adding draft auto-save or step-resume reminders.`);
  }
  if (recommendations.length === 0) {
    recommendations.push(`No actionable optimizations detected. Current model & cache configuration is performing efficiently.`);
  }

  return NextResponse.json({
    period,
    since,
    summary: {
      bookCount,
      completedBooks,
      totalCost,
      avgCostPerBook,
      totalCalls,
      totalCacheHits,
      cacheHitRate,
    },
    perBook,
    perModel,
    perTask,
    recommendations,
  });
}
