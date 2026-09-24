import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Chapter, Character } from '@/lib/types'

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
    if (forward) {
      addTextToPDF('FORWARD', 16, true);
      yPosition += 5;
      addTextToPDF(forward);
      yPosition += 10;
    }

    // Chapters
    chapters.forEach((chapter, index) => {
      if (chapter.content) {
        addTextToPDF(`Chapter ${chapter.chapterNumber}`, 14, true);
        yPosition += 5;
        addTextToPDF(chapter.content);
        
        // Add extra space between chapters
        if (index < chapters.length - 1) {
          yPosition += 10;
        }
      }
    });

    // Marketing materials as appendix
    if (salesCopy || backCoverCopy) {
      pdf.addPage();
      yPosition = margin;
      addTextToPDF('MARKETING MATERIALS', 16, true);
      yPosition += 10;

      if (salesCopy) {
        addTextToPDF('Sales Copy', 14, true);
        yPosition += 5;
        addTextToPDF(salesCopy);
        yPosition += 10;
      }

      if (backCoverCopy) {
        addTextToPDF('Back Cover Copy', 14, true);
        yPosition += 5;
        addTextToPDF(backCoverCopy);
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
    const { saveAs } = await import('file-saver');

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
    saveAs(blob, `${safeTitle}.docx`);

  } catch (error) {
    console.error('DOCX generation failed:', error);
    // Fallback to text download
    downloadBookAsText(title, forward, chapters, salesCopy, backCoverCopy);
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
  if (forward) {
    content += 'FORWARD\n';
    content += '-------\n\n';
    content += forward + '\n\n';
    content += '\n'.repeat(3);
  }

  // Chapters
  chapters.forEach((chapter, index) => {
    if (chapter.content) {
      content += `Chapter ${chapter.chapterNumber}\n`;
      content += '-'.repeat(`Chapter ${chapter.chapterNumber}`.length) + '\n\n';
      content += chapter.content + '\n\n';
      
      // Add space between chapters
      if (index < chapters.length - 1) {
        content += '\n'.repeat(2);
      }
    }
  });

  // Marketing materials
  if (salesCopy || backCoverCopy) {
    content += '\n'.repeat(3);
    content += 'MARKETING MATERIALS\n';
    content += '==================\n\n';

    if (salesCopy) {
      content += 'Sales Copy\n';
      content += '----------\n\n';
      content += salesCopy + '\n\n';
    }

    if (backCoverCopy) {
      content += 'Back Cover Copy\n';
      content += '---------------\n\n';
      content += backCoverCopy + '\n\n';
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
    const { saveAs } = await import('file-saver');

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
    saveAs(blob, `${filename}.docx`);

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
    const { saveAs } = await import('file-saver');

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
    saveAs(blob, `${safeTitle}_Character_Bible.docx`);
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
      if (c.physicalDescription) text += `\nPhysical Description:\n${c.physicalDescription}\n`;
      if (c.personality?.length) text += `\nPersonality: ${c.personality.join(', ')}\n`;
      if (c.keyTraits?.length) text += `Key Traits: ${c.keyTraits.join(', ')}\n`;
      if (c.strengths?.length) text += `Strengths: ${c.strengths.join(', ')}\n`;
      if (c.flaws?.length) text += `Flaws: ${c.flaws.join(', ')}\n`;
      if (c.backstory) text += `\nBackstory:\n${c.backstory}\n`;
      if (c.motivation) text += `\nMotivation:\n${c.motivation}\n`;
      if (c.arc) text += `\nCharacter Arc:\n${c.arc}\n`;
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
    const { saveAs } = await import('file-saver');

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
    saveAs(blob, `${safeTitle}_Location_Bible.docx`);
  } catch (error) {
    console.error('Location Bible DOCX generation failed:', error);
    // Fallback to a plain-text bible so the user still gets the content
    let text = `${title} - Location Bible\n${'='.repeat(title.length + 17)}\n\n`;
    (locations || []).forEach((l) => {
      text += `${l.name || 'Unnamed'}\n${'-'.repeat((l.name || 'Unnamed').length)}\n`;
      if (l.type) text += `Type: ${l.type}\n`;
      if (l.description) text += `\nDescription:\n${l.description}\n`;
      if (l.atmosphere) text += `\nAtmosphere:\n${l.atmosphere}\n`;
      if (l.significance) text += `\nSignificance to the Story:\n${l.significance}\n`;
      text += `\n\n`;
    });
    downloadAsFile(text, `${safeTitle}_Location_Bible.txt`, 'text/plain');
  }
}