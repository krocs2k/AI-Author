
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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
