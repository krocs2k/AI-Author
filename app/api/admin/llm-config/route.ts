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
  { id: 'gpt-6.1-sol', name: 'GPT-6.1 Sol', description: 'OpenAI GPT-6.1 Sol via Abacus.AI', category: 'openai' },
  { id: 'gpt-6-sol', name: 'GPT-6 Sol', description: 'OpenAI GPT-6 Sol via Abacus.AI', category: 'openai' },
  { id: 'gpt-6-luna', name: 'GPT-6 Luna', description: 'OpenAI GPT-6 Luna via Abacus.AI', category: 'openai' },
  { id: 'gpt-6-astra', name: 'GPT-6 Astra', description: 'OpenAI GPT-6 Astra via Abacus.AI', category: 'openai' },
  { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', description: 'OpenAI GPT-5.6 Sol via Abacus.AI', category: 'openai' },
  { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', description: 'OpenAI GPT-5.6 Luna via Abacus.AI', category: 'openai' },
  { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', description: 'OpenAI GPT-5.6 Terra via Abacus.AI', category: 'openai' },
  { id: 'gpt-5.5', name: 'GPT-5.5', description: 'OpenAI GPT-5.5 via Abacus.AI', category: 'openai' },
  { id: 'gpt-5.4', name: 'GPT-5.4', description: 'OpenAI GPT-5.4 via Abacus.AI', category: 'openai' },
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

// Known OpenAI models for direct API use
const KNOWN_OPENAI_MODELS = [
  { id: 'gpt-4.1', name: 'GPT-4.1', description: 'Latest GPT-4.1 — best for creative writing', category: 'gpt4' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', description: 'Compact GPT-4.1 variant', category: 'gpt4' },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', description: 'Lightweight GPT-4.1 variant', category: 'gpt4' },
  { id: 'gpt-4o', name: 'GPT-4o', description: 'GPT-4o multimodal model', category: 'gpt4' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Compact GPT-4o', category: 'gpt4' },
  { id: 'o3', name: 'o3', description: 'OpenAI o3 reasoning model', category: 'reasoning' },
  { id: 'o3-mini', name: 'o3 Mini', description: 'Compact o3 reasoning model', category: 'reasoning' },
  { id: 'o4-mini', name: 'o4 Mini', description: 'OpenAI o4 Mini reasoning model', category: 'reasoning' },
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

// Known Abacus.AI image-generation models (fallback if API fetch fails)
const KNOWN_IMAGE_MODELS = [
  { id: 'gpt-5.1', name: 'GPT-5.1 (Default)', description: 'Default image-capable model', category: 'default' },
  { id: 'nano_banana_pro', name: 'Nano Banana Pro', description: 'Google Nano Banana Pro', category: 'image' },
  { id: 'nano_banana2', name: 'Nano Banana 2', description: 'Google Nano Banana 2', category: 'image' },
  { id: 'gpt_image2', name: 'GPT Image 2', description: 'OpenAI GPT Image 2', category: 'image' },
  { id: 'flux2_pro', name: 'Flux 2 Pro', description: 'Black Forest Labs Flux 2 Pro', category: 'image' },
  { id: 'flux_pro_ultra', name: 'Flux Pro Ultra', description: 'Black Forest Labs Flux Pro Ultra', category: 'image' },
  { id: 'seedream', name: 'Seedream', description: 'ByteDance Seedream', category: 'image' },
  { id: 'ideogram', name: 'Ideogram', description: 'Ideogram', category: 'image' },
  { id: 'recraft', name: 'Recraft', description: 'Recraft', category: 'image' },
  { id: 'dalle', name: 'DALL-E', description: 'OpenAI DALL-E', category: 'image' },
  { id: 'midjourney', name: 'Midjourney', description: 'Midjourney', category: 'image' },
];

async function fetchAbacusImageModels(apiKey: string): Promise<any[]> {
  try {
    const response = await fetch('https://routellm.abacus.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    const models = data.data || data.models || [];
    const imageModels = models
      .filter((m: any) => {
        const id = String(m.id || m.model || '');
        const out: string[] = m.output_modalities || [];
        const inp: string[] = m.input_modalities || [];
        const isImage = m.model_type === 'image_generation' || out.includes('image');
        if (!isImage) return false;
        if (out.length > 0 && !out.includes('image')) return false; // video/audio
        if (inp.length > 0 && !inp.includes('text')) return false; // edit/upscale-only
        if (/edit/i.test(id) || /\[edit\]/i.test(m.display_name || '')) return false;
        return true;
      })
      .map((m: any) => ({
        id: m.id || m.model,
        name: m.display_name || m.id || m.model,
        description: m.description || `${m.id} via Abacus.AI`,
        category: m.model_type === 'image_generation' ? 'image' : 'multimodal',
      }));
    if (imageModels.length === 0) return KNOWN_IMAGE_MODELS;
    if (!imageModels.some((m: any) => m.id === 'gpt-5.1')) imageModels.unshift(KNOWN_IMAGE_MODELS[0]);
    return imageModels;
  } catch (error) {
    console.error('Error fetching Abacus image models:', error);
    return KNOWN_IMAGE_MODELS;
  }
}

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

async function fetchOpenAIModels(apiKey: string): Promise<any[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    const models = data.data || [];
    // Filter to chat completion models
    const chatModels = models
      .filter((m: any) => {
        const id = m.id || '';
        return (id.startsWith('gpt-') || id.startsWith('o3') || id.startsWith('o4')) &&
               !id.includes('realtime') && !id.includes('audio') &&
               !id.includes('search') && !id.includes('transcribe');
      })
      .map((m: any) => ({
        id: m.id,
        name: m.id,
        description: `${m.id} via OpenAI`,
        category: m.id.startsWith('o') ? 'reasoning' : 'gpt4',
      }))
      .sort((a: any, b: any) => a.id.localeCompare(b.id));
    return chatModels.length > 0 ? chatModels : KNOWN_OPENAI_MODELS;
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
    return KNOWN_OPENAI_MODELS;
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

// Auto-refresh cached provider model lists so admin options stay current
const MODEL_LIST_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const FALLBACK_LISTS = new Set<any[]>([KNOWN_ABACUS_MODELS, KNOWN_OPENAI_MODELS, KNOWN_GEMINI_MODELS, KNOWN_IMAGE_MODELS]);

function isStale(list: any, refreshedAt: Date | null | undefined): boolean {
  if (!Array.isArray(list) || list.length === 0 || !refreshedAt) return true;
  return Date.now() - new Date(refreshedAt).getTime() > MODEL_LIST_TTL_MS;
}

async function autoRefreshModelLists<T extends Record<string, any>>(config: T): Promise<T> {
  const data: any = {};
  const jobs: Promise<void>[] = [];
  const abacusKey = config.abacusApiKey || process.env.ABACUSAI_API_KEY || '';
  const queue = (
    key: string,
    list: any,
    at: any,
    fetcher: (k: string) => Promise<any[]>,
    field: string
  ) => {
    if (!key || !isStale(list, at)) return;
    jobs.push(
      fetcher(key).then((models) => {
        // Only persist a live result; never overwrite a cached list with the static fallback
        if (!FALLBACK_LISTS.has(models) || !Array.isArray(list) || list.length === 0) {
          data[field] = models;
          data[`${field}RefreshedAt`] = new Date();
        }
      }).catch((e) => console.error(`Auto-refresh ${field} failed:`, e))
    );
  };
  queue(abacusKey, config.abacusModels, config.abacusModelsRefreshedAt, fetchAbacusModels, 'abacusModels');
  queue(abacusKey, config.imageModels, config.imageModelsRefreshedAt, fetchAbacusImageModels, 'imageModels');
  queue(config.openaiApiKey || '', config.openaiModels, config.openaiModelsRefreshedAt, fetchOpenAIModels, 'openaiModels');
  queue(config.geminiApiKey || '', config.geminiModels, config.geminiModelsRefreshedAt, fetchGeminiModels, 'geminiModels');
  if (jobs.length === 0) return config;
  await Promise.all(jobs);
  if (Object.keys(data).length === 0) return config;
  try {
    return (await prisma.lLMConfig.update({ where: { id: config.id }, data })) as unknown as T;
  } catch (e) {
    console.error('Failed to persist refreshed model lists:', e);
    return config;
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

    config = await autoRefreshModelLists(config);

    // Mask API keys for client
    const masked = {
      ...config,
      abacusApiKey: config.abacusApiKey ? '••••••••' + config.abacusApiKey.slice(-4) : null,
      geminiApiKey: config.geminiApiKey ? '••••••••' + config.geminiApiKey.slice(-4) : null,
      openaiApiKey: config.openaiApiKey ? '••••••••' + config.openaiApiKey.slice(-4) : null,
      hasAbacusKey: !!config.abacusApiKey,
      hasGeminiKey: !!config.geminiApiKey,
      hasOpenaiKey: !!config.openaiApiKey,
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
      const { abacusApiKey, geminiApiKey, openaiApiKey } = body;
      const updateData: any = {};
      // Only update if a real key is provided (not the masked version)
      if (abacusApiKey && !abacusApiKey.startsWith('••••')) {
        updateData.abacusApiKey = abacusApiKey;
      }
      if (geminiApiKey && !geminiApiKey.startsWith('••••')) {
        updateData.geminiApiKey = geminiApiKey;
      }
      if (openaiApiKey && !openaiApiKey.startsWith('••••')) {
        updateData.openaiApiKey = openaiApiKey;
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
      const { activeProvider, ideaModel, writingModel, imageModel } = body;
      config = await prisma.lLMConfig.update({
        where: { id: config.id },
        data: {
          activeProvider: activeProvider || config.activeProvider,
          ideaModel: ideaModel !== undefined ? ideaModel : config.ideaModel,
          writingModel: writingModel !== undefined ? writingModel : config.writingModel,
          imageModel: imageModel !== undefined ? imageModel : (config as any).imageModel,
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

      if (provider === 'image') {
        const apiKey = config.abacusApiKey || process.env.ABACUSAI_API_KEY || '';
        if (!apiKey) {
          return NextResponse.json({ error: 'No Abacus.AI API key configured' }, { status: 400 });
        }
        const models = await fetchAbacusImageModels(apiKey);
        config = await prisma.lLMConfig.update({
          where: { id: config.id },
          data: { imageModels: models as any, imageModelsRefreshedAt: new Date() },
        });
        return NextResponse.json({ success: true, models, refreshedAt: config.imageModelsRefreshedAt });
      }

      if (provider === 'openai') {
        const apiKey = config.openaiApiKey || '';
        if (!apiKey) {
          return NextResponse.json({ error: 'No OpenAI API key configured' }, { status: 400 });
        }
        const models = await fetchOpenAIModels(apiKey);
        config = await prisma.lLMConfig.update({
          where: { id: config.id },
          data: {
            openaiModels: models as any,
            openaiModelsRefreshedAt: new Date(),
          },
        });
        return NextResponse.json({ success: true, models, refreshedAt: config.openaiModelsRefreshedAt });
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
        updateData.imageModels = null;
        updateData.imageModelsRefreshedAt = null;
      } else if (provider === 'openai') {
        updateData.openaiApiKey = null;
        updateData.openaiModels = null;
        updateData.openaiModelsRefreshedAt = null;
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

    // Action: Save the Creative Novel System Bible
    if (action === 'saveNovelBible') {
      const { novelSystemBible } = body;
      const bibleText = typeof novelSystemBible === 'string' ? novelSystemBible : '';
      config = await prisma.lLMConfig.update({
        where: { id: config.id },
        data: {
          novelSystemBible: bibleText.trim() ? bibleText : null,
          novelSystemBibleUpdatedAt: new Date(),
        },
      });
      invalidateLLMConfigCache();
      return NextResponse.json({
        success: true,
        message: 'Creative Novel System Bible saved successfully',
        novelSystemBibleUpdatedAt: config.novelSystemBibleUpdatedAt,
      });
    }

    // Action: Enable/disable new user sign-up
    if (action === 'saveSignupEnabled') {
      const { signupEnabled } = body;
      config = await prisma.lLMConfig.update({
        where: { id: config.id },
        data: { signupEnabled: !!signupEnabled },
      });
      return NextResponse.json({
        success: true,
        message: `User sign-up ${config.signupEnabled ? 'enabled' : 'disabled'}`,
        signupEnabled: config.signupEnabled,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating LLM config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
