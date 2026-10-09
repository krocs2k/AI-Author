// Server-only: generates a short, evocative chapter name from the chapter text.
import { routeLLMClient } from '@/lib/routellm';
import { cleanExportText, isPlaceholderChapterTitle } from '@/lib/export-clean';

export interface ChapterTitleContext {
  bookTitle?: string;
  genre?: string;
  chapterNumber: number;
  content: string;
}

function excerpt(text: string): string {
  const clean = cleanExportText(text);
  if (clean.length <= 3600) return clean;
  // Opening + ending give the model the chapter's arc without the full text.
  return `${clean.slice(0, 2400)}\n[...]\n${clean.slice(-1200)}`;
}

export function sanitizeChapterTitle(raw: string, chapterNumber: number): string | null {
  let t = cleanExportText(raw || '').split('\n').map((l) => l.trim()).find(Boolean) || '';
  t = t
    .replace(/^(?:title|chapter title|name)\s*[:\-–—]\s*/i, '')
    .replace(/^chapter\s+(?:\d+|[ivxlcdm]+|[a-z-]+)\s*[:.\-–—]\s*/i, '')
    .replace(/^["'“”‘’*_#\s]+|["'“”‘’*_#\s.]+$/g, '')
    .trim();
  if (!t || t.length > 70 || isPlaceholderChapterTitle(t, chapterNumber)) return null;
  return t;
}

export async function generateChapterTitle(ctx: ChapterTitleContext): Promise<string | null> {
  if (!ctx.content || !ctx.content.trim()) return null;
  try {
    const res = await routeLLMClient.generateWithSystem(
      'You are a bestselling novelist and editor who names chapters. Reply with ONLY the chapter name: 2 to 6 words, title case, no quotes, no "Chapter" prefix, no number, no punctuation at the end.',
      `Book: "${ctx.bookTitle || 'Untitled'}"${ctx.genre ? ` (${ctx.genre})` : ''}
Chapter ${ctx.chapterNumber} text:
"""
${excerpt(ctx.content)}
"""

Write a memorable, specific name for this chapter that captures its central event, image or turning point without spoiling a twist.`,
      'title-generation',
      { temperature: 0.7, maxTokens: 1500 }
    );
    return sanitizeChapterTitle(res.content || '', ctx.chapterNumber);
  } catch (err) {
    console.error(`Chapter ${ctx.chapterNumber} title generation failed:`, err);
    return null;
  }
}
