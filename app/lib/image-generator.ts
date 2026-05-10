import { getActiveLLMConfig } from '@/lib/routellm/config-loader';

export interface ImageGenerationResult {
  imageUrl: string; // base64 data URL
  model: string;
  prompt: string;
}

const DEFAULT_IMAGE_MODEL = 'gpt-5.1';

// Known image-capable models for Abacus.AI RouteLLM
export const IMAGE_MODELS = [
  { id: 'flux-2-pro', name: 'Flux 2 Pro', category: 'dedicated' },
  { id: 'flux-kontext', name: 'Flux Kontext', category: 'dedicated' },
  { id: 'seedream', name: 'Seedream', category: 'dedicated' },
  { id: 'ideogram', name: 'Ideogram', category: 'dedicated' },
  { id: 'recraft', name: 'Recraft', category: 'dedicated' },
  { id: 'imagen', name: 'Imagen (Google)', category: 'dedicated' },
  { id: 'nano-banana-pro', name: 'Nano Banana Pro', category: 'dedicated' },
  { id: 'dall-e', name: 'DALL-E', category: 'dedicated' },
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', category: 'gemini' },
  { id: 'gemini-3.1-flash', name: 'Gemini 3.1 Flash', category: 'gemini' },
  { id: 'gpt-5.4', name: 'GPT-5.4', category: 'openai' },
  { id: 'gpt-5.1', name: 'GPT-5.1 (Default)', category: 'openai' },
];

export async function generateImage(
  prompt: string,
  options?: {
    aspectRatio?: string;
    numImages?: number;
    model?: string; // override from admin config
  }
): Promise<ImageGenerationResult[]> {
  const config = await getActiveLLMConfig();
  const apiKey = config.abacusApiKey || process.env.ABACUSAI_API_KEY;
  if (!apiKey) throw new Error('No API key configured for image generation');

  const model = options?.model || config.imageModel || DEFAULT_IMAGE_MODEL;

  const body: any = {
    model,
    messages: [{ role: 'user', content: prompt }],
    modalities: ['image'],
    image_config: {
      num_images: options?.numImages || 1,
      aspect_ratio: options?.aspectRatio || '2:3',
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  let response: Response;
  try {
    response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e: any) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') throw new Error('Image generation timed out');
    throw e;
  }
  clearTimeout(timeout);

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Image generation failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  const results: ImageGenerationResult[] = [];

  for (const choice of data.choices || []) {
    const images = choice.message?.images || [];
    for (const img of images) {
      const url = img?.image_url?.url || img?.url || (typeof img === 'string' ? img : null);
      if (url) results.push({ imageUrl: url, model, prompt });
    }
  }

  if (results.length === 0) throw new Error('No images returned from API');
  return results;
}
