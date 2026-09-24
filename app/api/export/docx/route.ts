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

interface CharacterInput {
  name?: string;
  role?: string;
  age?: string;
  gender?: string;
  occupation?: string;
  physicalDescription?: string;
  personality?: string[];
  backstory?: string;
  motivation?: string;
  arc?: string;
  keyTraits?: string[];
  flaws?: string[];
  strengths?: string[];
  voiceStyle?: string;
  relationships?: Array<{ characterName?: string; relationship?: string }>;
}

function labeledParagraph(label: string, value?: string): Paragraph[] {
  if (!value || !value.trim()) return [];
  return [
    new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: 24 }),
        new TextRun({ text: value, size: 24 }),
      ],
      spacing: { after: 120 },
    }),
  ];
}

function sectionParagraph(label: string, value?: string): Paragraph[] {
  if (!value || !value.trim()) return [];
  return [
    new Paragraph({
      children: [new TextRun({ text: label, bold: true, size: 24 })],
      spacing: { before: 120, after: 60 },
    }),
    ...buildParagraphs(value),
  ];
}

function listParagraph(label: string, items?: string[]): Paragraph[] {
  if (!items || items.length === 0) return [];
  return [
    new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: 24 }),
        new TextRun({ text: items.filter(Boolean).join(', '), size: 24 }),
      ],
      spacing: { after: 120 },
    }),
  ];
}

function buildCharacterBibleDoc(title: string, characters: CharacterInput[]): Document {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: `${title} \u2014 Character Bible`, bold: true, size: 44 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  (characters || []).forEach((char, index) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: char.name || `Character ${index + 1}`, bold: true, size: 32 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 160 },
        pageBreakBefore: index > 0,
      })
    );

    if (char.role) children.push(...labeledParagraph('Role', char.role.replace(/_/g, ' ')));
    children.push(...labeledParagraph('Age', char.age));
    children.push(...labeledParagraph('Gender', char.gender));
    children.push(...labeledParagraph('Occupation', char.occupation));
    children.push(...labeledParagraph('Voice / Dialogue Style', char.voiceStyle));

    children.push(...sectionParagraph('Physical Description', char.physicalDescription));
    children.push(...listParagraph('Personality', char.personality));
    children.push(...listParagraph('Key Traits', char.keyTraits));
    children.push(...listParagraph('Strengths', char.strengths));
    children.push(...listParagraph('Flaws', char.flaws));
    children.push(...sectionParagraph('Backstory', char.backstory));
    children.push(...sectionParagraph('Motivation', char.motivation));
    children.push(...sectionParagraph('Character Arc', char.arc));

    if (char.relationships && char.relationships.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Relationships', bold: true, size: 24 })],
          spacing: { before: 120, after: 60 },
        })
      );
      char.relationships.forEach((rel) => {
        if (rel.characterName || rel.relationship) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `\u2022 ${rel.characterName || 'Unknown'}: `, bold: true, size: 24 }),
                new TextRun({ text: rel.relationship || '', size: 24 }),
              ],
              spacing: { after: 80 },
            })
          );
        }
      });
    }
  });

  return new Document({ sections: [{ properties: {}, children }] });
}

interface LocationInput {
  name?: string;
  type?: string;
  description?: string;
  significance?: string;
  atmosphere?: string;
}

function buildLocationBibleDoc(title: string, locations: LocationInput[]): Document {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: `${title} \u2014 Location Bible`, bold: true, size: 44 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  (locations || []).forEach((loc, index) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: loc.name || `Location ${index + 1}`, bold: true, size: 32 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 160 },
        pageBreakBefore: index > 0,
      })
    );

    children.push(...labeledParagraph('Type', loc.type));
    children.push(...sectionParagraph('Description', loc.description));
    children.push(...sectionParagraph('Atmosphere', loc.atmosphere));
    children.push(...sectionParagraph('Significance to the Story', loc.significance));
  });

  return new Document({ sections: [{ properties: {}, children }] });
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
    } else if (kind === 'character-bible') {
      const title: string = body?.title || 'Untitled';
      const characters: CharacterInput[] = Array.isArray(body?.characters)
        ? body.characters
        : [];
      doc = buildCharacterBibleDoc(title, characters);
      downloadName = `${safeName(title)}_Character_Bible.docx`;
    } else if (kind === 'location-bible') {
      const title: string = body?.title || 'Untitled';
      const locations: LocationInput[] = Array.isArray(body?.locations)
        ? body.locations
        : [];
      doc = buildLocationBibleDoc(title, locations);
      downloadName = `${safeName(title)}_Location_Bible.docx`;
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
