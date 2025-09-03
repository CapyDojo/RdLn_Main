import { describe, it, expect } from 'vitest';
import { getTextMetrics, formatTextMetrics } from '../textMetrics';

describe('textMetrics', () => {
  describe('getTextMetrics', () => {
    it('should count characters and words correctly', () => {
      const text = 'Hello world';
      const metrics = getTextMetrics(text);
      
      expect(metrics.characters).toBe(11);
      expect(metrics.words).toBe(2);
    });

    it('should handle empty text', () => {
      const text = '';
      const metrics = getTextMetrics(text);
      
      expect(metrics.characters).toBe(0);
      expect(metrics.words).toBe(0);
    });

    it('should handle whitespace-only text', () => {
      const text = '   \n\t  ';
      const metrics = getTextMetrics(text);
      
      expect(metrics.characters).toBe(7);
      expect(metrics.words).toBe(0);
    });

    it('should handle text with multiple spaces', () => {
      const text = 'Hello    world   test';
      const metrics = getTextMetrics(text);
      
      expect(metrics.characters).toBe(21);
      expect(metrics.words).toBe(3);
    });

    it('should handle text with newlines', () => {
      const text = 'Line one\nLine two\nLine three';
      const metrics = getTextMetrics(text);
      
      expect(metrics.characters).toBe(28); // Corrected: includes newline characters
      expect(metrics.words).toBe(6);
    });

    it('should handle large document text', () => {
      const text = 'This is a legal document with many clauses and provisions. '.repeat(1000);
      const metrics = getTextMetrics(text);
      
      expect(metrics.characters).toBe(59000); // Corrected: 59 chars per repeat, not 60
      expect(metrics.words).toBe(10000); // Corrected: 10 words per repeat
    });
  });

  describe('formatTextMetrics', () => {
    it('should format metrics correctly', () => {
      const metrics = { characters: 1234, words: 567 };
      const formatted = formatTextMetrics(metrics);
      
      expect(formatted).toBe('1,234 chars, 567 words');
    });

    it('should format large numbers with commas', () => {
      const metrics = { characters: 123456, words: 12345 };
      const formatted = formatTextMetrics(metrics);
      
      expect(formatted).toBe('123,456 chars, 12,345 words');
    });
  });
});