import { getActiveLLMConfig } from '@/lib/routellm/config-loader';

export interface ImageGenerationResult {
  imageUrl: string; // base64 data URL
  model: string;
  prompt: string;
}

const DEFAULT_IMAGE_MODEL = 'gpt-5.1';

// Known image-capable models for Abacus.AI RouteLLM
export const IMAGE_MODELS = [
  { id: 'gpt-5.1', name: 'GPT-5.1 (Default)', category: 'default' },
  { id: 'nano_banana_pro', name: 'Nano Banana Pro', category: 'image' },
  { id: 'nano_banana2', name: 'Nano Banana 2', category: 'image' },
  { id: 'gpt_image2', name: 'GPT Image 2', category: 'image' },
  { id: 'flux2_pro', name: 'Flux 2 Pro', category: 'image' },
  { id: 'flux_pro_ultra', name: 'Flux Pro Ultra', category: 'image' },
  { id: 'seedream', name: 'Seedream', category: 'image' },
  { id: 'ideogram', name: 'Ideogram', category: 'image' },
  { id: 'recraft', name: 'Recraft', category: 'image' },
  { id: 'dalle', name: 'DALL-E', category: 'image' },
  { id: 'midjourney', name: 'Midjourney', category: 'image' },
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

  const send = async (payload: any): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);
    try {
      return await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (e: any) {
      if (e.name === 'AbortError') throw new Error('Image generation timed out');
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  };

  let response = await send(body);
  let usedModel = model;

  // A saved model id that Abacus.AI no longer recognises (e.g. an old list entry)
  // must not break cover generation: fall back to the default image model.
  if (response.status === 400 && model !== DEFAULT_IMAGE_MODEL) {
    const err = await response.clone().text();
    if (/invalid model/i.test(err)) {
      console.warn(`Image model '${model}' rejected; falling back to ${DEFAULT_IMAGE_MODEL}`);
      usedModel = DEFAULT_IMAGE_MODEL;
      body.model = DEFAULT_IMAGE_MODEL;
      response = await send(body);
    }
  }

  // Some dedicated image models reject num_images or the '2:3' aspect format.
  // Retry once with the model's own defaults so any listed model stays usable.
  if (response.status === 400) {
    const err = await response.text();
    if (/aspect|image config|image_config|num_images/i.test(err)) {
      const { image_config, ...plain } = body;
      response = await send(plain);
    } else {
      throw new Error(`Image generation failed (400): ${err}`);
    }
  }

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
      if (url) results.push({ imageUrl: url, model: usedModel, prompt });
    }
  }

  if (results.length === 0) throw new Error('No images returned from API');
  return results;
}
