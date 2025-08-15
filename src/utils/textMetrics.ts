/**
 * Text Metrics Utilities
 * 
 * Provides standardized text measurement functions for character counts,
 * word counts, and other text metrics used throughout the application.
 */

export interface TextMetrics {
  /** Character count (including whitespace) */
  characters: number;
  /** Word count (whitespace-separated tokens) */
  words: number;
}

/**
 * Calculates comprehensive text metrics for a given string
 * 
 * @param text - The text to analyze
 * @returns Object containing character and word counts
 */
export function getTextMetrics(text: string): TextMetrics {
  const characters = text.length;
  
  // Word counting logic: split by whitespace and filter out empty strings
  const words = text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
  
  // Handle empty text case
  const wordCount = text.trim().length === 0 ? 0 : words;
  
  return {
    characters,
    words: wordCount
  };
}

/**
 * Formats text metrics for display in UI components
 * 
 * @param metrics - Text metrics object
 * @returns Formatted string for display
 */
export function formatTextMetrics(metrics: TextMetrics): string {
  return `${metrics.characters.toLocaleString()} chars, ${metrics.words.toLocaleString()} words`;
}