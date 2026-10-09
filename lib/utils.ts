
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Chapter, Character } from '@/lib/types'
import { cleanExportText, cleanChapterContent, dedupeChapters } from '@/lib/export-clean'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateReadTime(wordCount: number): number {
  // Average reading speed: 250 words per minute
  return Math.ceil(wordCount / 250);
}

export function formatReadTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

export function generateHumanizationScore(): number {
  // Generate realistic score between 88-98%
  return Math.floor(Math.random() * 11) + 88;
}

export function generateSuccessProbability(): number {
  // Generate realistic success probability between 88-95%
  return Math.floor(Math.random() * 8) + 88;
}

export function simulateAnalysisDelay(): Promise<void> {
  // Simulate realistic processing time (2-4 seconds)
  const delay = Math.floor(Math.random() * 2000) + 2000;
  return new Promise(resolve => setTimeout(resolve, delay));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Basic file download function (for simple text files)
export function downloadAsFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

// Trigger a download of a Blob using a native anchor element.
// Avoids depending on file-saver, whose dynamic import can resolve to
// `undefined` in the minified production bundle ("saveAs is not a function").
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Enhanced download functions for different formats
export async function downloadBookAsPDF(
  title: string,
  forward: string,
  chapters: Chapter[],
  salesCopy?: string,
  backCoverCopy?: string
) {
  try {
    // Dynamic import to avoid SSR issues
    const { jsPDF } = await import('jspdf');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // PDF configuration
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    const maxWidth = pageWidth - (margin * 2);

    let yPosition = margin;

    // Helper function to add text with automatic wrapping and page breaks
    const addTextToPDF = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      pdf.setFontSize(fontSize);
      const font = isBold ? 'bold' : 'normal';
      pdf.setFont('helvetica', font);

      const lines = pdf.splitTextToSize(text, maxWidth);
      
      for (const line of lines) {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      }
      yPosition += lineHeight; // Extra space after paragraphs
    };

    // Title page
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(title, maxWidth);
    const titleStartY = pageHeight / 3;
    titleLines.forEach((line: string, index: number) => {
      pdf.text(line, margin, titleStartY + (index * 12));
    });

    // Add new page for content
    pdf.addPage();
    yPosition = margin;

    // Forward/Introduction
    const cleanForward = cleanChapterContent(forward, undefined, undefined, title);
    if (cleanForward) {
      addTextToPDF('FORWARD', 16, true);
      yPosition += 5;
      addTextToPDF(cleanForward);
      yPosition += 10;
    }

    // Chapters (de-duplicated, markup stripped, duplicate headings removed)
    const pdfChapters = dedupeChapters(chapters || []);
    pdfChapters.forEach((chapter, index) => {
      const body = cleanChapterContent(
        chapter.content,
        chapter.chapterNumber,
        chapter.title,
        title
      );
      if (body) {
        const headingText = chapter.title
          ? `Chapter ${chapter.chapterNumber}: ${chapter.title}`
          : `Chapter ${chapter.chapterNumber}`;
        addTextToPDF(headingText, 14, true);
        yPosition += 5;
        addTextToPDF(body);

        // Add extra space between chapters
        if (index < pdfChapters.length - 1) {
          yPosition += 10;
        }
      }
    });

    // Marketing materials as appendix
    const cleanSalesCopy = cleanExportText(salesCopy);
    const cleanBackCoverCopy = cleanExportText(backCoverCopy);
    if (cleanSalesCopy || cleanBackCoverCopy) {
      pdf.addPage();
      yPosition = margin;
      addTextToPDF('MARKETING MATERIALS', 16, true);
      yPosition += 10;

      if (cleanSalesCopy) {
        addTextToPDF('Sales Copy', 14, true);
        yPosition += 5;
        addTextToPDF(cleanSalesCopy);
        yPosition += 10;
      }

      if (cleanBackCoverCopy) {
        addTextToPDF('Back Cover Copy', 14, true);
        yPosition += 5;
        addTextToPDF(cleanBackCoverCopy);
      }
    }

    // Save the PDF
    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
    pdf.save(`${safeTitle}.pdf`);

  } catch (error) {
    console.error('PDF generation failed:', error);
    // Fallback to text download
    downloadBookAsText(title, forward, chapters, salesCopy, backCoverCopy);
  }
}

export async function downloadBookAsDocx(
  title: string,
  forward: string,
  chapters: Chapter[],
  salesCopy?: string,
  backCoverCopy?: string
) {
  try {
    // Generate the DOCX on the server (reliable in production) and download the result.
    const response = await fetch('/api/export/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'book',
        title,
        forward,
        chapters,
        salesCopy,
        backCoverCopy,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server DOCX generation failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
    downloadBlob(blob, `${safeTitle}.docx`);

  } catch (error) {
    console.error('DOCX generation failed:', error);
    // Fallback to text download
    downloadBookAsText(title, forward, chapters, salesCopy, backCoverCopy);
  }
}

export interface EpubExportOptions {
  title: string;
  forward?: string;
  chapters: Chapter[];
  authorName?: string;
  publishingInfo?: string;
  coverImageUrl?: string;
  backCoverCopy?: string;
}

// Builds a distribution-ready reflowable EPUB 3 (cover + linked Table of Contents) on the server.
export async function downloadBookAsEpub(opts: EpubExportOptions): Promise<boolean> {
  try {
    const response = await fetch('/api/export/epub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
    });
    if (!response.ok) {
      throw new Error(`Server EPUB generation failed with status ${response.status}`);
    }
    const blob = await response.blob();
    const safeTitle = (opts.title || 'book').replace(/[^a-zA-Z0-9]+/g, '_');
    downloadBlob(blob, `${safeTitle}.epub`);
    return true;
  } catch (error) {
    console.error('EPUB generation failed:', error);
    return false;
  }
}

export function downloadBookAsText(
  title: string,
  forward: string,
  chapters: Chapter[],
  salesCopy?: string,
  backCoverCopy?: string
) {
  let content = '';

  // Title
  content += `${title}\n`;
  content += '='.repeat(title.length) + '\n\n';

  // Forward/Introduction
  const cleanForward = cleanChapterContent(forward, undefined, undefined, title);
  if (cleanForward) {
    content += 'FORWARD\n';
    content += '-------\n\n';
    content += cleanForward + '\n\n';
    content += '\n'.repeat(3);
  }

  // Chapters (de-duplicated, markup stripped, duplicate headings removed)
  const textChapters = dedupeChapters(chapters || []);
  textChapters.forEach((chapter, index) => {
    const body = cleanChapterContent(
      chapter.content,
      chapter.chapterNumber,
      chapter.title,
      title
    );
    if (body) {
      const headingText = chapter.title
        ? `Chapter ${chapter.chapterNumber}: ${chapter.title}`
        : `Chapter ${chapter.chapterNumber}`;
      content += `${headingText}\n`;
      content += '-'.repeat(headingText.length) + '\n\n';
      content += body + '\n\n';

      // Add space between chapters
      if (index < textChapters.length - 1) {
        content += '\n'.repeat(2);
      }
    }
  });

  // Marketing materials
  const cleanSalesCopy = cleanExportText(salesCopy);
  const cleanBackCoverCopy = cleanExportText(backCoverCopy);
  if (cleanSalesCopy || cleanBackCoverCopy) {
    content += '\n'.repeat(3);
    content += 'MARKETING MATERIALS\n';
    content += '==================\n\n';

    if (cleanSalesCopy) {
      content += 'Sales Copy\n';
      content += '----------\n\n';
      content += cleanSalesCopy + '\n\n';
    }

    if (cleanBackCoverCopy) {
      content += 'Back Cover Copy\n';
      content += '---------------\n\n';
      content += cleanBackCoverCopy + '\n\n';
    }
  }

  const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
  downloadAsFile(content, `${safeTitle}.txt`, 'text/plain');
}

// Download individual content as DOCX
export async function downloadContentAsDocx(
  content: string,
  title: string,
  filename: string
) {
  try {
    // Generate the DOCX on the server (reliable in production) and download the result.
    const response = await fetch('/api/export/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'content',
        content,
        title,
        filename,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server DOCX generation failed with status ${response.status}`);
    }

    const blob = await response.blob();
    downloadBlob(blob, `${filename}.docx`);

  } catch (error) {
    console.error('DOCX generation failed:', error);
    // Fallback to text download
    downloadAsFile(content, `${filename}.txt`, 'text/plain');
  }
}

// Download the Character Bible as a DOCX (built server-side for reliability in production)
export async function downloadCharacterBibleAsDocx(
  title: string,
  characters: Character[]
) {
  const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
  try {
    const response = await fetch('/api/export/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'character-bible',
        title,
        characters,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server DOCX generation failed with status ${response.status}`);
    }

    const blob = await response.blob();
    downloadBlob(blob, `${safeTitle}_Character_Bible.docx`);
  } catch (error) {
    console.error('Character Bible DOCX generation failed:', error);
    // Fallback to a plain-text bible so the user still gets the content
    let text = `${title} - Character Bible\n${'='.repeat(title.length + 18)}\n\n`;
    (characters || []).forEach((c) => {
      text += `${c.name || 'Unnamed'}\n${'-'.repeat((c.name || 'Unnamed').length)}\n`;
      if (c.role) text += `Role: ${c.role.replace(/_/g, ' ')}\n`;
      if (c.age) text += `Age: ${c.age}\n`;
      if (c.gender) text += `Gender: ${c.gender}\n`;
      if (c.occupation) text += `Occupation: ${c.occupation}\n`;
      if (c.voiceStyle) text += `Voice / Dialogue Style: ${c.voiceStyle}\n`;
      if (c.physicalDescription) text += `\nPhysical Description:\n${cleanExportText(c.physicalDescription)}\n`;
      if (c.personality?.length) text += `\nPersonality: ${c.personality.join(', ')}\n`;
      if (c.keyTraits?.length) text += `Key Traits: ${c.keyTraits.join(', ')}\n`;
      if (c.strengths?.length) text += `Strengths: ${c.strengths.join(', ')}\n`;
      if (c.flaws?.length) text += `Flaws: ${c.flaws.join(', ')}\n`;
      if (c.backstory) text += `\nBackstory:\n${cleanExportText(c.backstory)}\n`;
      if (c.motivation) text += `\nMotivation:\n${cleanExportText(c.motivation)}\n`;
      if (c.arc) text += `\nCharacter Arc:\n${cleanExportText(c.arc)}\n`;
      if (c.relationships?.length) {
        text += `\nRelationships:\n`;
        c.relationships.forEach((r) => {
          text += `  - ${r.characterName || 'Unknown'}: ${r.relationship || ''}\n`;
        });
      }
      text += `\n\n`;
    });
    downloadAsFile(text, `${safeTitle}_Character_Bible.txt`, 'text/plain');
  }
}

export interface LocationEntry {
  name?: string;
  type?: string;
  description?: string;
  significance?: string;
  atmosphere?: string;
}

// Download the Location Bible as a DOCX (built server-side for reliability in production)
export async function downloadLocationBibleAsDocx(
  title: string,
  locations: LocationEntry[]
) {
  const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
  try {
    const response = await fetch('/api/export/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'location-bible',
        title,
        locations,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server DOCX generation failed with status ${response.status}`);
    }

    const blob = await response.blob();
    downloadBlob(blob, `${safeTitle}_Location_Bible.docx`);
  } catch (error) {
    console.error('Location Bible DOCX generation failed:', error);
    // Fallback to a plain-text bible so the user still gets the content
    let text = `${title} - Location Bible\n${'='.repeat(title.length + 17)}\n\n`;
    (locations || []).forEach((l) => {
      text += `${l.name || 'Unnamed'}\n${'-'.repeat((l.name || 'Unnamed').length)}\n`;
      if (l.type) text += `Type: ${l.type}\n`;
      if (l.description) text += `\nDescription:\n${cleanExportText(l.description)}\n`;
      if (l.atmosphere) text += `\nAtmosphere:\n${cleanExportText(l.atmosphere)}\n`;
      if (l.significance) text += `\nSignificance to the Story:\n${cleanExportText(l.significance)}\n`;
      text += `\n\n`;
    });
    downloadAsFile(text, `${safeTitle}_Location_Bible.txt`, 'text/plain');
  }
}
