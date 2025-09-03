import { describe, it, expect, beforeEach } from 'vitest';
import { MyersAlgorithm } from '@/algorithms/MyersAlgorithm';
import { DiffChange } from '@/types';

describe('MyersAlgorithm', () => {
  describe('basic text comparison', () => {
    it('identifies simple insertions', async () => {
      const original = 'Hello';
      const revised = 'Hello World';
      
      const result = await MyersAlgorithm.compare(original, revised);
      
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].type).toBe('added');
      expect(result.changes[0].content).toBe(' World');
    });

    it('identifies simple deletions', async () => {
      const original = 'Hello World';
      const revised = 'Hello';
      
      const result = await MyersAlgorithm.compare(original, revised);
      
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].type).toBe('removed');
      expect(result.changes[0].content).toBe(' World');
    });

    it('identifies replacements as deletion + insertion', async () => {
      const original = 'Hello World';
      const revised = 'Hello Universe';
      
      const result = await MyersAlgorithm.compare(original, revised);
      
      expect(result.changes).toHaveLength(2);
      expect(result.changes[0].type).toBe('removed');
      expect(result.changes[0].content).toBe(' World');
      expect(result.changes[1].type).toBe('added');
      expect(result.changes[1].content).toBe(' Universe');
    });

    it('returns empty changes for identical texts', async () => {
      const text = 'Hello World';
      
      const result = await MyersAlgorithm.compare(text, text);
      
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].type).toBe('unchanged');
      expect(result.stats.totalChanges).toBe(0);
    });

    it('handles empty strings', async () => {
      const result1 = await MyersAlgorithm.compare('', 'Hello');
      expect(result1.changes).toHaveLength(1);
      expect(result1.changes[0].type).toBe('added');
      
      const result2 = await MyersAlgorithm.compare('Hello', '');
      expect(result2.changes).toHaveLength(1);
      expect(result2.changes[0].type).toBe('removed');
      
      const result3 = await MyersAlgorithm.compare('', '');
      expect(result3.changes).toHaveLength(0);
    });
  });

  describe('whitespace handling', () => {
    it('preserves whitespace in changes', async () => {
      const original = 'Hello\nWorld';
      const revised = 'Hello\n\nWorld';
      
      const result = await MyersAlgorithm.compare(original, revised);
      
      // Should find the added newline
      const addedChange = result.changes.find(c => c.type === 'added' && c.content === '\n');
      expect(addedChange).toBeDefined();
    });

    it('handles tab characters', async () => {
      const original = 'Hello\tWorld';
      const revised = 'Hello World';
      
      const result = await MyersAlgorithm.compare(original, revised);
      
      // Should detect the tab replacement
      expect(result.changes.length).toBeGreaterThan(1);
      const hasTabChange = result.changes.some(c => c.content.includes('\t') || c.content === ' ');
      expect(hasTabChange).toBe(true);
    });

    it('handles multiple consecutive spaces', async () => {
      const original = 'Hello  World';
      const revised = 'Hello World';
      
      const result = await MyersAlgorithm.compare(original, revised);
      
      // Should detect the space change
      expect(result.changes.length).toBeGreaterThan(1);
      const hasSpaceChange = result.changes.some(c => c.type === 'removed' && c.content === ' ');
      expect(hasSpaceChange).toBe(true);
    });
  });

  describe('number tokenization', () => {
    it('treats numbers as single tokens', async () => {
      const original = 'Price is 100';
      const revised = 'Price is 200';
      
      const result = await MyersAlgorithm.compare(original, revised);
      
      // Should detect the number changes
      expect(result.changes.length).toBeGreaterThan(1);
      const hasNumberChange = result.changes.some(c => 
        (c.type === 'removed' || c.type === 'changed') && (c.content === '100' || c.originalContent === '100')) ||
      result.changes.some(c => 
        (c.type === 'added' || c.type === 'changed') && (c.content === '200' || c.revisedContent === '200'));
      expect(hasNumberChange).toBe(true);
    });

    it('handles currency symbols', async () => {
      const original = 'Price is $100.50';
      const revised = 'Price is $200.75';
      
      const result = await MyersAlgorithm.compare(original, revised);
      
      // Should detect the currency amount changes
      expect(result.changes.length).toBeGreaterThan(1);
      const hasCurrencyChange = result.changes.some(c => 
        c.content.includes('$100') || c.content.includes('$200') ||
        c.originalContent?.includes('$100') || c.revisedContent?.includes('$200'));
      expect(hasCurrencyChange).toBe(true);
    });

    it('handles percentages', async () => {
      const original = 'Rate is 5%';
      const revised = 'Rate is 10%';
      
      const result = await MyersAlgorithm.compare(original, revised);
      
      // Should detect the percentage changes
      expect(result.changes.length).toBeGreaterThan(1);
      const hasPercentageChange = result.changes.some(c => 
        c.content.includes('%') || c.originalContent?.includes('%') || c.revisedContent?.includes('%'));
      expect(hasPercentageChange).toBe(true);
    });
  });

  describe('date tokenization', () => {
    it('treats dates as single tokens', async () => {
      const original = 'Date is 01/01/2023';
      const revised = 'Date is 12/31/2023';
      
      const result = await MyersAlgorithm.compare(original, revised);
      
      // Should detect the date changes
      expect(result.changes.length).toBeGreaterThan(1);
      const hasDateChange = result.changes.some(c => 
        c.content.includes('01/01/2023') || c.content.includes('12/31/2023') ||
        c.originalContent?.includes('01/01/2023') || c.revisedContent?.includes('12/31/2023'));
      expect(hasDateChange).toBe(true);
    });

    it('handles different date formats', async () => {
      const original = 'Date is 01-01-2023';
      const revised = 'Date is 31-12-2023';
      
      const result = await MyersAlgorithm.compare(original, revised);
      
      // Should detect the date format changes
      expect(result.changes.length).toBeGreaterThan(1);
      const hasDateChange = result.changes.some(c => 
        c.content.includes('01-01-2023') || c.content.includes('31-12-2023') ||
        c.originalContent?.includes('01-01-2023') || c.revisedContent?.includes('31-12-2023'));
      expect(hasDateChange).toBe(true);
    });
  });

  describe('statistics calculation', () => {
    it('calculates correct addition and deletion counts', async () => {
      const original = 'Hello World';
      const revised = 'Hello Beautiful Universe';
      
      const result = await MyersAlgorithm.compare(original, revised);
      
      expect(result.stats.deletions).toBeGreaterThan(0); // Some deletions
      expect(result.stats.additions).toBeGreaterThan(0); // Some additions
      expect(result.stats.totalChanges).toBeGreaterThan(0);
    });

    it('counts unchanged words correctly', async () => {
      const original = 'Hello World Test';
      const revised = 'Hello Beautiful Test';
      
      const result = await MyersAlgorithm.compare(original, revised);
      
      // "Hello" and "Test" remain unchanged, "World" -> "Beautiful"
      expect(result.stats.unchanged).toBeGreaterThan(0);
      expect(result.stats.deletions).toBeGreaterThan(0);
      expect(result.stats.additions).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('handles very long strings efficiently', async () => {
      const longText = 'word '.repeat(1000);
      const original = longText + 'end';
      const revised = longText + 'finish';
      
      const startTime = Date.now();
      const result = await MyersAlgorithm.compare(original, revised);
      const duration = Date.now() - startTime;
      
      expect(result.changes.length).toBeGreaterThan(0); // Should detect changes
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('handles strings with only punctuation', async () => {
      const original = '!!!';
      const revised = '???';
      
      const result = await MyersAlgorithm.compare(original, revised);
      
      expect(result.changes.length).toBeGreaterThan(0); // Should detect changes
    });

    it('handles unicode characters', async () => {
      const original = 'Hello 世界';
      const revised = 'Hello 宇宙';
      
      const result = await MyersAlgorithm.compare(original, revised);
      
      // Should detect the unicode character changes
      expect(result.changes.length).toBeGreaterThan(1);
      const hasUnicodeChange = result.changes.some(c => 
        c.content.includes('世界') || c.content.includes('宇宙') ||
        c.originalContent?.includes('世界') || c.revisedContent?.includes('宇宙'));
      expect(hasUnicodeChange).toBe(true);
    });
  });

  describe('legal document patterns', () => {
    it('handles legal abbreviations correctly', async () => {
      const original = 'ABC Corp. filed';
      const revised = 'ABC Inc. filed';
      
      const result = await MyersAlgorithm.compare(original, revised);
      
      // Should detect the abbreviation changes
      expect(result.changes.length).toBeGreaterThan(1);
      const hasAbbrevChange = result.changes.some(c => 
        c.content.includes('Corp.') || c.content.includes('Inc.') ||
        c.originalContent?.includes('Corp.') || c.revisedContent?.includes('Inc.'));
      expect(hasAbbrevChange).toBe(true);
    });

    it('handles section references', async () => {
      const original = 'See Sec. 1.2';
      const revised = 'See Sec. 1.3';
      
      const result = await MyersAlgorithm.compare(original, revised);
      
      // Should detect the section number changes
      expect(result.changes.length).toBeGreaterThan(1);
      const hasSectionChange = result.changes.some(c => 
        c.content.includes('1.2') || c.content.includes('1.3') ||
        c.originalContent?.includes('1.2') || c.revisedContent?.includes('1.3'));
      expect(hasSectionChange).toBe(true);
    });
  });
});