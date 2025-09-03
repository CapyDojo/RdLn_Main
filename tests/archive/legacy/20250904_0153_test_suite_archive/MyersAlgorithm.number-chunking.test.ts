import { describe, it, expect } from 'vitest';
import { MyersAlgorithm } from '../MyersAlgorithm';

describe('MyersAlgorithm - Number Chunking Fix', () => {
  it('should treat 15,000,000 -> 20,000,000 as a single substitution', async () => {
    const original = "15,000,000 shares of Parent Common Stock.";
    const revised = "20,000,000 shares of Parent Common Stock.";
    
    const result = await MyersAlgorithm.compare(original, revised);
    

    
    // Find the change that involves the numbers
    const numberChange = result.changes.find(change => 
      change.type === 'changed' && 
      change.originalContent?.includes('15,000,000') &&
      change.revisedContent?.includes('20,000,000')
    );
    
    expect(numberChange).toBeDefined();
    expect(numberChange?.type).toBe('changed');
    expect(numberChange?.originalContent).toBe('15,000,000');
    expect(numberChange?.revisedContent).toBe('20,000,000');
  });

  it('should still work for currency substitutions', async () => {
    const original = "The price is $12.50 per share.";
    const revised = "The price is $15.00 per share.";
    
    const result = await MyersAlgorithm.compare(original, revised);
    
    const currencyChange = result.changes.find(change => 
      change.type === 'changed' && 
      change.originalContent?.includes('$12.50') &&
      change.revisedContent?.includes('$15.00')
    );
    
    expect(currencyChange).toBeDefined();
    expect(currencyChange?.type).toBe('changed');
    expect(currencyChange?.originalContent).toBe('$12.50');
    expect(currencyChange?.revisedContent).toBe('$15.00');
  });

  it('should work for large currency amounts', async () => {
    const original = "not exceed $500,000,000 in cash";
    const revised = "not exceed $750,000,000 in cash";
    
    const result = await MyersAlgorithm.compare(original, revised);
    
    const currencyChange = result.changes.find(change => 
      change.type === 'changed' && 
      change.originalContent?.includes('$500,000,000') &&
      change.revisedContent?.includes('$750,000,000')
    );
    
    expect(currencyChange).toBeDefined();
    expect(currencyChange?.type).toBe('changed');
    expect(currencyChange?.originalContent).toBe('$500,000,000');
    expect(currencyChange?.revisedContent).toBe('$750,000,000');
  });

  it('should work for decimal substitutions', async () => {
    const original = "The ratio is 0.75 percent.";
    const revised = "The ratio is 0.85 percent.";
    
    const result = await MyersAlgorithm.compare(original, revised);
    
    const decimalChange = result.changes.find(change => 
      change.type === 'changed' && 
      change.originalContent?.includes('0.75') &&
      change.revisedContent?.includes('0.85')
    );
    
    expect(decimalChange).toBeDefined();
    expect(decimalChange?.type).toBe('changed');
    expect(decimalChange?.originalContent).toBe('0.75');
    expect(decimalChange?.revisedContent).toBe('0.85');
  });
});