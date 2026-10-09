// Server-only EPUB 3 builder (reflowable, with EPUB 2 NCX fallback for older readers).
import JSZip from 'jszip';
import crypto from 'crypto';
import { cleanExportText, cleanChapterContent, dedupeChapters, chapterHeading, chapterName } from '@/lib/export-clean';

export interface EpubChapterInput {
  chapterNumber: number;
  title?: string | null;
  content?: string | null;
}

export interface EpubInput {
  title: string;
  authorName?: string;
  publishingInfo?: string;
  language?: string;
  forward?: string;
  chapters: EpubChapterInput[];
  backCoverCopy?: string;
  coverImageUrl?: string;
}

interface CoverImage {
  data: Buffer;
  mediaType: string;
  ext: string;
}

interface Section {
  id: string;
  file: string;
  title: string;
  xhtml: string;
  inToc: boolean;
  type?: string;
}

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Typographic polish: curly quotes, em dashes, ellipses.
function typeset(s: string): string {
  return s
    .replace(/\.\.\./g, '…')
    .replace(/\s?--\s?/g, '—')
    .replace(/(^|[\s(\[{—-])"/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s(\[{—-])'/g, '$1‘')
    .replace(/'/g, '’');
}

const SCENE_BREAK_RE = /^\s*(?:[*#~•·]\s*){3,}$|^\s*(?:[—_-]\s*){3,}$/;
const SCENE_TOKEN = 'SCENEBREAKMARKER';

// Protect scene-break lines from the shared sanitizer (which strips Markdown rules like ***).
const protectSceneBreaks = (raw: string) =>
  (raw || '')
    .split('\n')
    .map((l) => (SCENE_BREAK_RE.test(l) ? SCENE_TOKEN : l))
    .join('\n');

function proseToXhtml(text: string): string {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  let afterBreak = true;
  const out: string[] = [];
  for (const line of lines) {
    if (line === SCENE_TOKEN || SCENE_BREAK_RE.test(line)) {
      out.push('<p class="scene-break" role="separator">* * *</p>');
      afterBreak = true;
      continue;
    }
    out.push(`<p${afterBreak ? ' class="first"' : ''}>${esc(typeset(line))}</p>`);
    afterBreak = false;
  }
  return out.join('\n');
}

function page(title: string, body: string, lang: string, epubType?: string, bodyClass?: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${lang}" xml:lang="${lang}">
<head>
<meta charset="UTF-8" />
<title>${esc(title)}</title>
<link rel="stylesheet" type="text/css" href="../styles/book.css" />
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<section${epubType ? ` epub:type="${epubType}"` : ''}>
${body}
</section>
</body>
</html>
`;
}

function detectImage(buf: Buffer): { mediaType: string; ext: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { mediaType: 'image/png', ext: 'png' };
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mediaType: 'image/jpeg', ext: 'jpg' };
  if (buf.toString('ascii', 0, 4) === 'GIF8') return { mediaType: 'image/gif', ext: 'gif' };
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { mediaType: 'image/webp', ext: 'webp' };
  return null;
}

async function loadCover(url?: string): Promise<CoverImage | null> {
  if (!url) return null;
  try {
    let data: Buffer;
    if (url.startsWith('data:')) {
      const comma = url.indexOf(',');
      if (comma < 0) return null;
      const meta = url.slice(5, comma);
      const payload = url.slice(comma + 1);
      data = meta.includes(';base64')
        ? Buffer.from(payload, 'base64')
        : Buffer.from(decodeURIComponent(payload), 'binary');
    } else if (/^https?:\/\//i.test(url)) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`cover fetch ${res.status}`);
        data = Buffer.from(await res.arrayBuffer());
      } finally {
        clearTimeout(timer);
      }
    } else {
      return null;
    }
    const kind = detectImage(data);
    if (!kind) return null;
    return { data, ...kind };
  } catch (err) {
    console.error('EPUB cover load failed:', err);
    return null;
  }
}

const CSS = `@charset "UTF-8";
html, body { margin: 0; padding: 0; }
body { font-family: serif; line-height: 1.5; text-align: justify; widows: 2; orphans: 2;
  -webkit-hyphens: auto; -epub-hyphens: auto; hyphens: auto; }
p { margin: 0; text-indent: 1.5em; }
p.first, p.noindent { text-indent: 0; }
section.chapter p.first::first-line { font-variant: small-caps; letter-spacing: 0.03em; }
h1, h2, h3 { font-weight: normal; text-align: center; -webkit-hyphens: none; hyphens: none;
  page-break-after: avoid; break-after: avoid; }
.chapter-head { page-break-before: always; break-before: page; margin: 3em 0 2.5em; text-align: center; }
.chapter-label { display: block; font-size: 0.85em; letter-spacing: 0.25em; text-transform: uppercase; margin-bottom: 0.6em; }
.chapter-title { display: block; font-size: 1.6em; font-style: italic; line-height: 1.25; }
.ornament { text-align: center; text-indent: 0; margin: 1em 0 0; letter-spacing: 0.4em; }
p.scene-break { text-align: center; text-indent: 0; margin: 1.2em 0; letter-spacing: 0.5em; }
/* Cover */
body.cover { margin: 0; padding: 0; text-align: center; }
div.cover-wrap { margin: 0; padding: 0; height: 100%; text-align: center; }
div.cover-wrap img { max-width: 100%; max-height: 100%; height: auto; }
/* Title page */
.titlepage { text-align: center; margin-top: 25%; }
.titlepage .book-title { font-size: 2.2em; line-height: 1.2; margin: 0 0 0.6em; }
.titlepage .rule { margin: 1.2em auto; width: 25%; border: 0; border-top: 1px solid currentColor; }
.titlepage .author { font-size: 1.2em; font-variant: small-caps; letter-spacing: 0.08em; margin-top: 1.5em; text-indent: 0; text-align: center; }
/* Copyright */
.copyright { margin-top: 40%; font-size: 0.8em; text-align: left; }
.copyright p { text-indent: 0; margin-bottom: 0.8em; }
/* Contents */
nav#toc h1 { margin: 2em 0 1.5em; font-size: 1.5em; letter-spacing: 0.15em; text-transform: uppercase; }
nav#toc ol { list-style-type: none; margin: 0; padding: 0; }
nav#toc li { margin: 0 0 0.6em; text-align: left; }
nav#toc a { text-decoration: none; }
nav#landmarks { display: none; }
/* Front/back matter */
h1.matter-title { page-break-before: always; break-before: page; margin: 3em 0 2em; font-size: 1.5em; letter-spacing: 0.1em; }
`;

export async function buildEpub(input: EpubInput): Promise<Buffer> {
  const lang = (input.language || 'en').trim() || 'en';
  const title = cleanExportText(input.title || 'Untitled').replace(/\n+/g, ' ').trim() || 'Untitled';
  const author = (input.authorName || '').trim();
  const publishing = cleanExportText(input.publishingInfo || '').trim();
  const uuid = crypto.randomUUID();
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const year = modified.slice(0, 4);
  const cover = await loadCover(input.coverImageUrl);

  const sections: Section[] = [];

  if (cover) {
    sections.push({
      id: 'cover',
      file: 'cover.xhtml',
      title: 'Cover',
      inToc: false,
      type: 'cover',
      xhtml: page(
        'Cover',
        `<div class="cover-wrap"><img src="../images/cover.${cover.ext}" alt="${esc(`Cover of ${title}${author ? ` by ${author}` : ''}`)}" /></div>`,
        lang,
        'cover',
        'cover'
      ),
    });
  }

  sections.push({
    id: 'titlepage',
    file: 'titlepage.xhtml',
    title: 'Title Page',
    inToc: false,
    type: 'titlepage',
    xhtml: page(
      title,
      `<div class="titlepage">\n<h1 class="book-title">${esc(typeset(title))}</h1>\n<hr class="rule" />\n${author ? `<p class="author">${esc(author)}</p>` : ''}\n</div>`,
      lang,
      'titlepage'
    ),
  });

  const copyrightLines = [
    `<p><i>${esc(typeset(title))}</i></p>`,
    `<p>Copyright © ${year}${author ? ` ${esc(author)}` : ''}. All rights reserved.</p>`,
    ...publishing
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => `<p>${esc(typeset(l))}</p>`),
    '<p>No part of this publication may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the publisher, except for brief quotations embodied in critical reviews.</p>',
    '<p>This is a work of fiction. Names, characters, places, and incidents are either the product of the author’s imagination or are used fictitiously.</p>',
  ];
  sections.push({
    id: 'copyright',
    file: 'copyright.xhtml',
    title: 'Copyright',
    inToc: false,
    type: 'copyright-page',
    xhtml: page('Copyright', `<div class="copyright">\n${copyrightLines.join('\n')}\n</div>`, lang, 'copyright-page'),
  });

  // TOC placeholder index — the nav document is inserted here in the spine.
  const tocSpineIndex = sections.length;

  const forward = cleanChapterContent(protectSceneBreaks(input.forward || ''), undefined, undefined, title);
  if (forward.trim()) {
    sections.push({
      id: 'foreword',
      file: 'foreword.xhtml',
      title: 'Foreword',
      inToc: true,
      type: 'foreword',
      xhtml: page('Foreword', `<h1 class="matter-title">Foreword</h1>\n${proseToXhtml(forward)}`, lang, 'foreword'),
    });
  }

  const chapters = dedupeChapters(
    (input.chapters || [])
      .filter((c) => c && typeof c.chapterNumber === 'number')
      .map((c) => ({ chapterNumber: c.chapterNumber, title: c.title || undefined, content: c.content || '' }))
  ).filter((c) => (c.content || '').trim());

  for (const ch of chapters) {
    const n = ch.chapterNumber;
    const chTitle = chapterName(n, ch.title);
    const body = cleanChapterContent(protectSceneBreaks(ch.content || ''), n, chTitle, title);
    const tocTitle = chapterHeading(n, ch.title);
    const head = `<h1 class="chapter-head"><span class="chapter-label">Chapter ${n}</span>${
      chTitle ? `<span class="chapter-title">${esc(typeset(chTitle))}</span>` : ''
    }</h1>`;
    const id = `chapter-${String(n).padStart(3, '0')}`;
    sections.push({
      id,
      file: `${id}.xhtml`,
      title: tocTitle,
      inToc: true,
      type: 'chapter',
      xhtml: page(tocTitle, `${head}\n${proseToXhtml(body)}`, lang, 'bodymatter chapter').replace(
        '<section epub:type="bodymatter chapter">',
        '<section class="chapter" epub:type="bodymatter chapter">'
      ),
    });
  }

  const about = cleanExportText(input.backCoverCopy || '').trim();
  if (about) {
    sections.push({
      id: 'about-book',
      file: 'about-book.xhtml',
      title: 'About the Book',
      inToc: true,
      type: 'backmatter',
      xhtml: page('About the Book', `<h1 class="matter-title">About the Book</h1>\n${proseToXhtml(about)}`, lang, 'backmatter'),
    });
  }

  const tocEntries = sections.filter((s) => s.inToc);
  const firstBody = sections.find((s) => s.type === 'chapter') || tocEntries[0] || sections[0];

  // EPUB 3 navigation document (also the visible Table of Contents page).
  const nav = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${lang}" xml:lang="${lang}">
<head>
<meta charset="UTF-8" />
<title>Contents</title>
<link rel="stylesheet" type="text/css" href="styles/book.css" />
</head>
<body>
<nav epub:type="toc" id="toc" role="doc-toc">
<h1>Contents</h1>
<ol>
${tocEntries.map((s) => `<li><a href="text/${s.file}">${esc(typeset(s.title))}</a></li>`).join('\n')}
</ol>
</nav>
<nav epub:type="landmarks" id="landmarks" hidden="hidden">
<h2>Guide</h2>
<ol>
${cover ? '<li><a epub:type="cover" href="text/cover.xhtml">Cover</a></li>\n' : ''}<li><a epub:type="toc" href="nav.xhtml">Contents</a></li>
<li><a epub:type="bodymatter" href="text/${firstBody.file}">Begin Reading</a></li>
</ol>
</nav>
</body>
</html>
`;

  // EPUB 2 NCX for legacy reading systems.
  const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="${lang}">
<head>
<meta name="dtb:uid" content="urn:uuid:${uuid}" />
<meta name="dtb:depth" content="1" />
<meta name="dtb:totalPageCount" content="0" />
<meta name="dtb:maxPageNumber" content="0" />
</head>
<docTitle><text>${esc(title)}</text></docTitle>
${author ? `<docAuthor><text>${esc(author)}</text></docAuthor>\n` : ''}<navMap>
${tocEntries
  .map(
    (s, i) =>
      `<navPoint id="np-${i + 1}" playOrder="${i + 1}"><navLabel><text>${esc(s.title)}</text></navLabel><content src="text/${s.file}" /></navPoint>`
  )
  .join('\n')}
</navMap>
</ncx>
`;

  const manifestItems = [
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />',
    '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />',
    '<item id="css" href="styles/book.css" media-type="text/css" />',
    ...(cover
      ? [`<item id="cover-image" href="images/cover.${cover.ext}" media-type="${cover.mediaType}" properties="cover-image" />`]
      : []),
    ...sections.map((s) => `<item id="${s.id}" href="text/${s.file}" media-type="application/xhtml+xml" />`),
  ];

  const spineIds = sections.map((s) => s.id);
  spineIds.splice(tocSpineIndex, 0, 'nav');
  const spine = spineIds
    .map((id) => `<itemref idref="${id}" />`)
    .join('\n');

  const publisherLine = publishing.split(/\n+/)[0]?.trim();
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${lang}" prefix="rendition: http://www.idpf.org/vocab/rendition/#">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">urn:uuid:${uuid}</dc:identifier>
<dc:title id="title">${esc(title)}</dc:title>
<meta refines="#title" property="title-type">main</meta>
${author ? `<dc:creator id="creator">${esc(author)}</dc:creator>\n<meta refines="#creator" property="role" scheme="marc:relators">aut</meta>\n` : ''}<dc:language>${esc(lang)}</dc:language>
${publisherLine && publisherLine.length <= 120 ? `<dc:publisher>${esc(publisherLine)}</dc:publisher>\n` : ''}<dc:date>${modified.slice(0, 10)}</dc:date>
<dc:rights>Copyright © ${year}${author ? ` ${esc(author)}` : ''}. All rights reserved.</dc:rights>
<meta property="dcterms:modified">${modified}</meta>
<meta property="rendition:layout">reflowable</meta>
${cover ? '<meta name="cover" content="cover-image" />\n' : ''}</metadata>
<manifest>
${manifestItems.join('\n')}
</manifest>
<spine toc="ncx">
${spine}
</spine>
<guide>
${cover ? '<reference type="cover" title="Cover" href="text/cover.xhtml" />\n' : ''}<reference type="toc" title="Contents" href="nav.xhtml" />
<reference type="text" title="Begin Reading" href="text/${firstBody.file}" />
</guide>
</package>
`;

  const container = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles>
<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" />
</rootfiles>
</container>
`;

  const zip = new JSZip();
  // mimetype MUST be the first entry and stored uncompressed.
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file('META-INF/container.xml', container);
  zip.file('OEBPS/content.opf', opf);
  zip.file('OEBPS/nav.xhtml', nav);
  zip.file('OEBPS/toc.ncx', ncx);
  zip.file('OEBPS/styles/book.css', CSS);
  if (cover) zip.file(`OEBPS/images/cover.${cover.ext}`, cover.data, { compression: 'STORE' });
  for (const s of sections) zip.file(`OEBPS/text/${s.file}`, s.xhtml);

  return zip.generateAsync({
    type: 'nodebuffer',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}
