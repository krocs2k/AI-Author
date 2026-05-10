import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { invalidateLLMConfigCache } from '@/lib/routellm/config-loader';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// Known Abacus.AI text models (fallback if API fetch fails)
const KNOWN_ABACUS_MODELS = [
  { id: 'route-llm', name: 'Route LLM (Auto)', description: 'Intelligently routes to the best available model based on request complexity', category: 'routing' },
  { id: 'gpt-5.4', name: 'GPT-5.4', description: 'Latest OpenAI model via Abacus.AI', category: 'openai' },
  { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini', description: 'Compact version of GPT-5.4', category: 'openai' },
  { id: 'gpt-5.4-nano', name: 'GPT-5.4 Nano', description: 'Lightweight GPT-5.4 variant', category: 'openai' },
  { id: 'gpt-5.2', name: 'GPT-5.2', description: 'OpenAI GPT-5.2', category: 'openai' },
  { id: 'gpt-5.1', name: 'GPT-5.1', description: 'OpenAI GPT-5.1', category: 'openai' },
  { id: 'gpt-5', name: 'GPT-5', description: 'OpenAI GPT-5', category: 'openai' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', description: 'Compact GPT-5', category: 'openai' },
  { id: 'gpt-4.1', name: 'GPT-4.1', description: 'OpenAI GPT-4.1', category: 'openai' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', description: 'Compact GPT-4.1', category: 'openai' },
  { id: 'gpt-4o', name: 'GPT-4o', description: 'OpenAI GPT-4o multimodal', category: 'openai' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Compact GPT-4o', category: 'openai' },
  { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', description: 'Anthropic Claude Opus 4.7', category: 'anthropic' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', description: 'Anthropic Claude Sonnet 4.6', category: 'anthropic' },
  { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', description: 'Anthropic Claude Opus 4.5', category: 'anthropic' },
  { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', description: 'Anthropic Claude Sonnet 4.5', category: 'anthropic' },
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', description: 'Fast Anthropic Claude Haiku', category: 'anthropic' },
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', description: 'Google Gemini 3.1 Pro via Abacus', category: 'google' },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', description: 'Google Gemini 3 Flash via Abacus', category: 'google' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Google Gemini 2.5 Pro via Abacus', category: 'google' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Google Gemini 2.5 Flash via Abacus', category: 'google' },
  { id: 'deepseek-v3.2', name: 'DeepSeek V3.2', description: 'DeepSeek V3.2', category: 'deepseek' },
  { id: 'deepseek-v3.1', name: 'DeepSeek V3.1', description: 'DeepSeek V3.1', category: 'deepseek' },
  { id: 'deepseek-R1', name: 'DeepSeek R1', description: 'DeepSeek R1 reasoning model', category: 'deepseek' },
  { id: 'llama-4-Maverick', name: 'Llama 4 Maverick', description: 'Meta Llama 4 Maverick', category: 'meta' },
  { id: 'llama-3.3-70B', name: 'Llama 3.3 70B', description: 'Meta Llama 3.3 70B', category: 'meta' },
  { id: 'grok-4.2', name: 'Grok 4.2', description: 'xAI Grok 4.2', category: 'xai' },
  { id: 'grok-4', name: 'Grok 4', description: 'xAI Grok 4', category: 'xai' },
  { id: 'qwen3-235b-a22b', name: 'Qwen3 235B', description: 'Qwen3 235B large model', category: 'qwen' },
  { id: 'qwen3-max', name: 'Qwen3 Max', description: 'Qwen3 Max', category: 'qwen' },
  { id: 'abacus-smaug2', name: 'Abacus Smaug2', description: 'Abacus.AI proprietary model', category: 'abacus' },
  { id: 'abacus-dracarys', name: 'Abacus Dracarys', description: 'Abacus.AI proprietary model', category: 'abacus' },
];

// Known Gemini models for direct API use
const KNOWN_GEMINI_MODELS = [
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', description: 'Advanced intelligence with 1M token context', category: 'pro' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', description: 'Frontier-class at fraction of cost', category: 'flash' },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', description: 'Frontier-class performance at reduced cost', category: 'flash' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Advanced model for complex tasks with deep reasoning', category: 'pro' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Best price-performance for low-latency tasks', category: 'flash' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Fastest and most budget-friendly in 2.5 family', category: 'flash' },
];

async function fetchAbacusModels(apiKey: string): Promise<any[]> {
  try {
    const response = await fetch('https://routellm.abacus.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    const models = data.data || data.models || [];
    // Filter to text generation models only
    const textModels = models
      .filter((m: any) => {
        const id = m.id || m.model || '';
        // Exclude image/audio/embedding models
        return !id.includes('flux') && !id.includes('dall-e') && !id.includes('ideogram') &&
               !id.includes('recraft') && !id.includes('imagen') && !id.includes('seedream') &&
               !id.includes('nano-banana') && !id.includes('midjourney') && !id.includes('embedding') &&
               !id.includes('tts') && !id.includes('audio') && !id.includes('GPT Image') &&
               !id.includes('Grok Imagine') && !id.includes('Flux');
      })
      .map((m: any) => ({
        id: m.id || m.model,
        name: m.id || m.model,
        description: m.description || `${m.id} via Abacus.AI`,
        category: 'api',
      }));
    return textModels.length > 0 ? textModels : KNOWN_ABACUS_MODELS;
  } catch (error) {
    console.error('Error fetching Abacus models:', error);
    return KNOWN_ABACUS_MODELS;
  }
}

async function fetchGeminiModels(apiKey: string): Promise<any[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    const models = data.models || [];
    // Filter to generateContent-capable models
    const textModels = models
      .filter((m: any) => {
        const methods = m.supportedGenerationMethods || [];
        return methods.includes('generateContent');
      })
      .map((m: any) => {
        const id = (m.name || '').replace('models/', '');
        return {
          id,
          name: m.displayName || id,
          description: m.description || `${m.displayName}`,
          category: id.includes('pro') ? 'pro' : id.includes('flash') ? 'flash' : 'other',
          inputTokenLimit: m.inputTokenLimit,
          outputTokenLimit: m.outputTokenLimit,
        };
      });
    return textModels.length > 0 ? textModels : KNOWN_GEMINI_MODELS;
  } catch (error) {
    console.error('Error fetching Gemini models:', error);
    return KNOWN_GEMINI_MODELS;
  }
}

// GET - Retrieve LLM config
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let config = await prisma.lLMConfig.findFirst();
    if (!config) {
      config = await prisma.lLMConfig.create({
        data: {
          activeProvider: 'abacus',
          abacusApiKey: process.env.ABACUSAI_API_KEY || null,
        },
      });
    }

    // Mask API keys for client
    const masked = {
      ...config,
      abacusApiKey: config.abacusApiKey ? '••••••••' + config.abacusApiKey.slice(-4) : null,
      geminiApiKey: config.geminiApiKey ? '••••••••' + config.geminiApiKey.slice(-4) : null,
      hasAbacusKey: !!config.abacusApiKey,
      hasGeminiKey: !!config.geminiApiKey,
    };

    return NextResponse.json({ config: masked });
  } catch (error) {
    console.error('Error fetching LLM config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

// POST - Update LLM config
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    let config = await prisma.lLMConfig.findFirst();
    if (!config) {
      config = await prisma.lLMConfig.create({
        data: {
          activeProvider: 'abacus',
          abacusApiKey: process.env.ABACUSAI_API_KEY || null,
        },
      });
    }

    // Action: Save API keys
    if (action === 'saveKeys') {
      const { abacusApiKey, geminiApiKey } = body;
      const updateData: any = {};
      // Only update if a real key is provided (not the masked version)
      if (abacusApiKey && !abacusApiKey.startsWith('••••')) {
        updateData.abacusApiKey = abacusApiKey;
      }
      if (geminiApiKey && !geminiApiKey.startsWith('••••')) {
        updateData.geminiApiKey = geminiApiKey;
      }

      if (Object.keys(updateData).length > 0) {
        config = await prisma.lLMConfig.update({
          where: { id: config.id },
          data: updateData,
        });
        invalidateLLMConfigCache();
      }

      return NextResponse.json({ success: true, message: 'API keys saved successfully' });
    }

    // Action: Set active provider & models
    if (action === 'saveSelection') {
      const { activeProvider, ideaModel, writingModel } = body;
      config = await prisma.lLMConfig.update({
        where: { id: config.id },
        data: {
          activeProvider: activeProvider || config.activeProvider,
          ideaModel: ideaModel !== undefined ? ideaModel : config.ideaModel,
          writingModel: writingModel !== undefined ? writingModel : config.writingModel,
        },
      });
      invalidateLLMConfigCache();

      return NextResponse.json({ success: true, message: 'Selection saved successfully' });
    }

    // Action: Refresh models list
    if (action === 'refreshModels') {
      const { provider } = body; // 'abacus' or 'gemini'
      
      if (provider === 'abacus') {
        const apiKey = config.abacusApiKey || process.env.ABACUSAI_API_KEY || '';
        if (!apiKey) {
          return NextResponse.json({ error: 'No Abacus.AI API key configured' }, { status: 400 });
        }
        const models = await fetchAbacusModels(apiKey);
        config = await prisma.lLMConfig.update({
          where: { id: config.id },
          data: {
            abacusModels: models as any,
            abacusModelsRefreshedAt: new Date(),
          },
        });
        return NextResponse.json({ success: true, models, refreshedAt: config.abacusModelsRefreshedAt });
      }

      if (provider === 'gemini') {
        const apiKey = config.geminiApiKey || '';
        if (!apiKey) {
          return NextResponse.json({ error: 'No Gemini API key configured' }, { status: 400 });
        }
        const models = await fetchGeminiModels(apiKey);
        config = await prisma.lLMConfig.update({
          where: { id: config.id },
          data: {
            geminiModels: models as any,
            geminiModelsRefreshedAt: new Date(),
          },
        });
        return NextResponse.json({ success: true, models, refreshedAt: config.geminiModelsRefreshedAt });
      }

      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Action: Clear a specific API key
    if (action === 'clearKey') {
      const { provider } = body;
      const updateData: any = {};
      if (provider === 'abacus') {
        updateData.abacusApiKey = null;
        updateData.abacusModels = null;
        updateData.abacusModelsRefreshedAt = null;
      } else if (provider === 'gemini') {
        updateData.geminiApiKey = null;
        updateData.geminiModels = null;
        updateData.geminiModelsRefreshedAt = null;
      }
      if (Object.keys(updateData).length > 0) {
        await prisma.lLMConfig.update({
          where: { id: config.id },
          data: updateData,
        });
        invalidateLLMConfigCache();
      }
      return NextResponse.json({ success: true, message: `${provider} key cleared` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating LLM config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
