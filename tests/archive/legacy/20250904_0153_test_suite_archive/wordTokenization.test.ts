import { describe, it, expect } from 'vitest';
import { 
  tokenizeWords, 
  countWords, 
  countCharacters, 
  getWordStats,
  getWordStatsForBlocks,
  isValidWord,
  countWordsAdvanced
} from './wordTokenization';

describe('Word Tokenization Utilities', () => {
  describe('tokenizeWords', () => {
    it('should tokenize simple text into words', () => {
      const result = tokenizeWords('Hello world test');
      expect(result).toEqual(['Hello', 'world', 'test']);
    });

    it('should handle punctuation as separate tokens', () => {
      const result = tokenizeWords('Hello, world!');
      expect(result).toContain('Hello');
      expect(result).toContain(',');
      expect(result).toContain('world');
      expect(result).toContain('!');
    });

    it('should handle empty or whitespace text', () => {
      expect(tokenizeWords('')).toEqual([]);
      expect(tokenizeWords('   ')).toEqual([]);
    });
  });

  describe('countWords', () => {
    it('should count words correctly', () => {
      expect(countWords('Hello world test')).toBe(3);
      expect(countWords('Hello, world! How are you?')).toBe(5); // Fixed: "Hello," "world!" "How" "are" "you?"
    });

    it('should handle empty text', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
    });
  });

  describe('countCharacters', () => {
    it('should count characters including spaces', () => {
      expect(countCharacters('Hello world')).toBe(11);
    });

    it('should count characters excluding spaces when requested', () => {
      expect(countCharacters('Hello world', true)).toBe(10);
    });

    it('should handle empty text', () => {
      expect(countCharacters('')).toBe(0);
    });
  });

  describe('getWordStats', () => {
    it('should return comprehensive stats for text', () => {
      const result = getWordStats('Hello world! This is a test.');
      expect(result.wordCount).toBe(6);
      expect(result.characterCount).toBe(28);
      expect(result.characterCountNoSpaces).toBe(23);
    });

    it('should handle empty text', () => {
      const result = getWordStats('');
      expect(result.wordCount).toBe(0);
      expect(result.characterCount).toBe(0);
      expect(result.characterCountNoSpaces).toBe(0);
    });
  });

  describe('getWordStatsForBlocks', () => {
    it('should calculate stats for multiple text blocks', () => {
      const blocks = ['Hello world', 'This is', 'a test'];
      const result = getWordStatsForBlocks(blocks);
      expect(result.wordCount).toBe(6); // "Hello world This is a test"
    });

    it('should handle empty blocks array', () => {
      const result = getWordStatsForBlocks([]);
      expect(result.wordCount).toBe(0);
      expect(result.characterCount).toBe(0);
      expect(result.characterCountNoSpaces).toBe(0);
    });
  });

  describe('isValidWord', () => {
    it('should identify valid words', () => {
      expect(isValidWord('hello')).toBe(true);
      expect(isValidWord('test123')).toBe(true);
      expect(isValidWord("don't")).toBe(true);
    });

    it('should reject pure punctuation or empty strings', () => {
      expect(isValidWord('!!!')).toBe(false);
      expect(isValidWord('')).toBe(false);
      expect(isValidWord('   ')).toBe(false);
      expect(isValidWord('.')).toBe(false);
    });
  });

  describe('countWordsAdvanced', () => {
    it('should count only valid words, excluding pure punctuation', () => {
      const count = countWordsAdvanced('Hello, world! How are you?');
      expect(count).toBe(5); // Excludes comma, exclamation, and question mark
    });

    it('should handle text with mixed content', () => {
      const count = countWordsAdvanced('Test... 123 !!! valid');
      expect(count).toBe(3); // Test, 123, valid
    });
  });

  describe('Microsoft Word compatibility', () => {
    it('should handle complex legal document text', () => {
      const legalText = 'Section 1.1: The Company, Inc. shall provide services as defined in Exhibit A.';
      const stats = getWordStats(legalText);
      
      // Should count punctuation as separate tokens (MS Word behavior)
      expect(stats.wordCount).toBeGreaterThan(10);
      expect(stats.characterCount).toBe(legalText.length);
    });

    it('should handle hyphenated and contractions', () => {
      const text = "Don't use state-of-the-art technology.";
      const wordCount = countWords(text);
      
      // Should count contractions and hyphenated words appropriately
      expect(wordCount).toBe(4); // "Don't", "use", "state-of-the-art", "technology."
    });
  });
});