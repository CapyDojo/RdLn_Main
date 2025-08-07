/**
 * Word tokenization utility for document comparison statistics
 * Follows Microsoft Word's approach with enhanced multi-language support
 */

export interface WordStats {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
}

/**
 * Tokenizes text into words using whitespace and punctuation boundaries
 * Similar to Microsoft Word's approach but handles edge cases better
 */
export function tokenizeWords(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Split on whitespace and common punctuation, but preserve the tokens
  // This regex matches word boundaries while keeping punctuation as separate tokens
  const tokens = text
    .split(/(\s+|[.,;:!?()[\]{}"'`~@#$%^&*+=|\\/<>-]+)/)
    .filter(token => token.length > 0 && token.trim().length > 0);

  return tokens;
}

/**
 * Counts words in text using the same methodology as tokenizeWords
 * More efficient than tokenizing when only count is needed
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  // Count non-whitespace tokens
  const matches = text.match(/\S+/g);
  return matches ? matches.length : 0;
}

/**
 * Counts characters in text, with option to exclude spaces
 */
export function countCharacters(text: string, excludeSpaces: boolean = false): number {
  if (!text) {
    return 0;
  }

  if (excludeSpaces) {
    return text.replace(/\s/g, '').length;
  }
  
  return text.length;
}

/**
 * Gets comprehensive word statistics for a text block
 * Matches the functionality expected by professional document comparison tools
 */
export function getWordStats(text: string): WordStats {
  if (!text) {
    return {
      wordCount: 0,
      characterCount: 0,
      characterCountNoSpaces: 0
    };
  }

  return {
    wordCount: countWords(text),
    characterCount: countCharacters(text, false),
    characterCountNoSpaces: countCharacters(text, true)
  };
}

/**
 * Calculates word statistics for an array of text blocks
 * Useful for calculating totals across multiple diff blocks
 */
export function getWordStatsForBlocks(textBlocks: string[]): WordStats {
  if (!textBlocks || textBlocks.length === 0) {
    return {
      wordCount: 0,
      characterCount: 0,
      characterCountNoSpaces: 0
    };
  }

  const combinedText = textBlocks.join(' ');
  return getWordStats(combinedText);
}

/**
 * Validates if a token should be counted as a "word"
 * Used for more precise word counting when needed
 */
export function isValidWord(token: string): boolean {
  if (!token || token.trim().length === 0) {
    return false;
  }

  // Count tokens that contain at least one alphanumeric character
  // This excludes pure punctuation but includes mixed tokens like "don't"
  return /[a-zA-Z0-9]/.test(token);
}

/**
 * Advanced word counting that excludes pure punctuation tokens
 * More accurate than simple whitespace splitting
 */
export function countWordsAdvanced(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  const tokens = tokenizeWords(text);
  return tokens.filter(isValidWord).length;
}