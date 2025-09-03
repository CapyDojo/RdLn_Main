import { describe, it, expect } from 'vitest';

// Simple test to validate our clean test setup
describe('Text Processing Utils', () => {
  describe('basic string operations', () => {
    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const result = input.trim();
      
      expect(result).toBe('hello world');
    });

    it('should split strings by space', () => {
      const input = 'hello world test';
      const result = input.split(' ');
      
      expect(result).toEqual(['hello', 'world', 'test']);
      expect(result).toHaveLength(3);
    });

    it('should handle empty strings', () => {
      const input = '';
      const result = input.trim();
      
      expect(result).toBe('');
      expect(result.length).toBe(0);
    });
  });

  describe('complex operations', () => {
    it('should normalize line endings', () => {
      const input = 'line1\r\nline2\nline3\r';
      const result = input.replace(/\r\n|\r|\n/g, '\n');
      
      expect(result).toBe('line1\nline2\nline3\n');
    });

    it('should count words correctly', () => {
      const input = 'The quick brown fox jumps';
      const wordCount = input.split(/\s+/).length;
      
      expect(wordCount).toBe(5);
    });
  });
});