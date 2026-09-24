export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';

interface ChapterInput {
  chapterNumber: number;
  content?: string | null;
}

function buildParagraphs(text: string, size = 24): Paragraph[] {
  return text
    .split('\n')
    .filter((p) => p.trim())
    .map(
      (paragraph) =>
        new Paragraph({
          children: [new TextRun({ text: paragraph, size })],
          spacing: { after: 200 },
        })
    );
}

function buildBookDoc(
  title: string,
  forward: string,
  chapters: ChapterInput[],
  salesCopy?: string,
  backCoverCopy?: string
): Document {
  const children: Paragraph[] = [];

  // Title page
  children.push(
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 48 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  children.push(
    new Paragraph({
      children: [new TextRun({ text: '', break: 1 })],
      pageBreakBefore: true,
    })
  );

  // Forward/Introduction
  if (forward) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'FORWARD', bold: true, size: 32 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );
    children.push(...buildParagraphs(forward));
  }

  // Chapters
  (chapters || []).forEach((chapter) => {
    if (chapter.content) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Chapter ${chapter.chapterNumber}`,
              bold: true,
              size: 28,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      );
      children.push(...buildParagraphs(chapter.content));
    }
  });

  // Marketing materials as appendix
  if (salesCopy || backCoverCopy) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '', break: 1 })],
        pageBreakBefore: true,
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'MARKETING MATERIALS', bold: true, size: 32 }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );

    if (salesCopy) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Sales Copy', bold: true, size: 28 })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      );
      children.push(...buildParagraphs(salesCopy));
    }

    if (backCoverCopy) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Back Cover Copy', bold: true, size: 28 }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      );
      children.push(...buildParagraphs(backCoverCopy));
    }
  }

  return new Document({
    sections: [{ properties: {}, children }],
  });
}

function buildContentDoc(content: string, title: string): Document {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 36 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  children.push(...buildParagraphs(content));

  return new Document({
    sections: [{ properties: {}, children }],
  });
}

function safeName(name: string): string {
  return (name || 'document').replace(/[^a-zA-Z0-9]/g, '_');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const kind = body?.kind;

    let doc: Document;
    let downloadName: string;

    if (kind === 'content') {
      const content: string = body?.content || '';
      const title: string = body?.title || 'Document';
      const filename: string = body?.filename || 'document';
      doc = buildContentDoc(content, title);
      downloadName = `${safeName(filename)}.docx`;
    } else {
      const title: string = body?.title || 'Untitled';
      const forward: string = body?.forward || '';
      const chapters: ChapterInput[] = Array.isArray(body?.chapters)
        ? body.chapters
        : [];
      const salesCopy: string | undefined = body?.salesCopy;
      const backCoverCopy: string | undefined = body?.backCoverCopy;
      doc = buildBookDoc(title, forward, chapters, salesCopy, backCoverCopy);
      downloadName = `${safeName(title)}.docx`;
    }

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (error) {
    console.error('Server DOCX generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate DOCX' },
      { status: 500 }
    );
  }
}
