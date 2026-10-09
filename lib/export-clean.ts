// Shared, dependency-free text sanitization for exported novel output
// (DOCX via the server route, PDF + plain-text via the client utils).
//
// Goals:
//  1. Strip HTML tags / entities and Markdown markup so the exported Word,
//     PDF and TXT files contain clean prose -- never literal "##", "**",
//     "<p>", "&quot;" etc.
//  2. Unwrap content that an LLM returned as a raw JSON string
//     (e.g. '{"content":"..."}' or '{"copy":"..."}').
//  3. Remove duplicate chapter headings so a chapter is never printed twice
//     (our own "Chapter N" heading + a "Chapter N" / title line baked into
//     the generated content).
//
// All functions are pure and safe to run on both the server and the client.

// Decode the HTML entities that commonly appear in generated content.
function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”')
    .replace(/&ldquo;/g, '“')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#0*39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, h) => safeFromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => safeFromCodePoint(parseInt(d, 10)))
    // Ampersand last so earlier named/numeric entities decode correctly.
    .replace(/&amp;/g, '&');
}

function safeFromCodePoint(code: number): string {
  try {
    if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return '';
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

// If the text is actually a JSON object/array string, pull the human text out.
function unwrapJson(raw: string): string {
  const t = raw.trim();
  if (!t.startsWith('{') && !t.startsWith('[')) return raw;
  let parsed: unknown;
  try {
    parsed = JSON.parse(t);
  } catch {
    return raw;
  }
  const pick = (val: unknown): string | null => {
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) {
      const parts = val.map((v) => pick(v)).filter((v): v is string => !!v);
      return parts.length ? parts.join('\n\n') : null;
    }
    if (val && typeof val === 'object') {
      const obj = val as Record<string, unknown>;
      const keys = [
        'content', 'copy', 'text', 'body', 'chapter', 'forward',
        'salesCopy', 'backCoverCopy', 'synopsis', 'result', 'output', 'value',
      ];
      for (const k of keys) {
        if (typeof obj[k] === 'string') return obj[k] as string;
      }
      const stringVals = Object.values(obj).filter((v) => typeof v === 'string') as string[];
      if (stringVals.length === 1) return stringVals[0];
    }
    return null;
  };
  const picked = pick(parsed);
  return picked != null ? picked : raw;
}

// Remove HTML + Markdown markup from a block of text, returning clean prose.
export function cleanExportText(raw?: string | null): string {
  if (!raw) return '';
  let s = String(raw);

  s = unwrapJson(s);
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Fenced code blocks -> keep inner text, drop the fences.
  s = s.replace(/```[a-zA-Z0-9]*\n?/g, '').replace(/```/g, '');

  // Block-level HTML -> line breaks; <br> -> line break.
  s = s.replace(/<\s*br\s*\/?\s*>/gi, '\n');
  s = s.replace(/<\s*\/\s*(p|div|h[1-6]|li|ul|ol|blockquote|section|article|header|footer|tr|table)\s*>/gi, '\n');
  s = s.replace(/<\s*(p|div|h[1-6]|li|ul|ol|blockquote|section|article|header|footer|tr|table)[^>]*>/gi, '\n');
  // Strip any remaining HTML/XML tags.
  s = s.replace(/<[^>]+>/g, '');

  s = decodeEntities(s);

  // Line-level Markdown markers.
  s = s
    .split('\n')
    .map((line) => {
      let l = line;
      l = l.replace(/^\s{0,3}#{1,6}\s+/, '');      // ATX headings
      l = l.replace(/^\s{0,3}>\s?/, '');            // blockquotes
      l = l.replace(/^\s{0,3}[-*+]\s+/, '');        // unordered list bullets
      if (/^\s{0,3}([-*_])\s*(\1\s*){2,}$/.test(l)) l = ''; // horizontal rules
      return l;
    })
    .join('\n');

  // Inline Markdown emphasis / code / links / images.
  s = s.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '');         // images
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');        // links -> text
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');                 // **bold**
  s = s.replace(/__([^_]+)__/g, '$1');                         // __bold__
  s = s.replace(/\*([^*\n]+)\*/g, '$1');                    // *italic*
  s = s.replace(/(^|[^a-zA-Z0-9_])_([^_\n]+)_(?=[^a-zA-Z0-9_]|$)/g, '$1$2'); // _italic_
  s = s.replace(/`([^`]+)`/g, '$1');                           // `code`

  // Normalise whitespace.
  s = s.replace(/[ \t]+\n/g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');

  return s.trim();
}

// Matches a line that is a chapter heading, e.g.:
//   "Chapter 1", "Chapter 1: The Storm", "## Chapter One", "CHAPTER XII - Dawn"
const CHAPTER_HEADING_RE =
  /^\s*(?:#{1,6}\s*)?chapter\s+(?:\d{1,3}|[ivxlcdm]{1,7}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|twenty[-\s]?\w+|thirty|forty|fifty)\b[\s:.\-\u2013\u2014]*.*$/i;

function normalizeHeading(line: string): string {
  return line
    .replace(/^\s*#{1,6}\s*/, '')
    .replace(/[^a-z0-9 ]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Clean a chapter's body text AND remove any chapter-heading / title lines that
// would duplicate the "Chapter N" heading the exporter adds itself.
export function cleanChapterContent(
  raw: string | null | undefined,
  chapterNumber?: number,
  chapterTitle?: string,
  bookTitle?: string
): string {
  const cleaned = cleanExportText(raw);
  if (!cleaned) return '';

  const titleNorms = new Set<string>();
  if (chapterTitle) titleNorms.add(normalizeHeading(chapterTitle));
  if (bookTitle) titleNorms.add(normalizeHeading(bookTitle));

  const lines = cleaned.split('\n');
  const out: string[] = [];
  let seenBody = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!seenBody && !trimmed) {
      // Skip leading blank lines.
      continue;
    }

    const isChapterHeading = CHAPTER_HEADING_RE.test(trimmed) && trimmed.length <= 80;
    const norm = normalizeHeading(trimmed);
    const isDuplicateTitle =
      !seenBody && norm.length > 0 && titleNorms.has(norm);

    if (isChapterHeading || isDuplicateTitle) {
      // Drop the heading line entirely (and any blank line immediately after
      // it is handled naturally because we only start the body on real text).
      continue;
    }

    if (trimmed) seenBody = true;
    out.push(line);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export interface ExportChapter {
  chapterNumber: number;
  title?: string;
  content?: string | null;
}

// De-duplicate chapters by chapterNumber (keep the one with the most content),
// then sort ascending. Guards against duplicate "Chapter N" entries.
export function dedupeChapters<T extends ExportChapter>(chapters: T[]): T[] {
  const byNumber = new Map<number, T>();
  for (const ch of chapters || []) {
    if (!ch) continue;
    const existing = byNumber.get(ch.chapterNumber);
    if (!existing) {
      byNumber.set(ch.chapterNumber, ch);
    } else {
      const a = (existing.content || '').length;
      const b = (ch.content || '').length;
      if (b >= a) byNumber.set(ch.chapterNumber, ch);
    }
  }
  return Array.from(byNumber.values()).sort(
    (a, b) => a.chapterNumber - b.chapterNumber
  );
}
