// src/services/__tests__/TxtProcessor.test.ts
import { TxtProcessor } from '../TxtProcessor';
import { ERROR_CODES } from '../../types/file-processing.types';

describe('TxtProcessor', () => {
  let txtProcessor: TxtProcessor;

  beforeEach(() => {
    txtProcessor = new TxtProcessor();
  });

  describe('extractText', () => {
    it('should extract text from simple TXT file', async () => {
      const file = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
      const result = await txtProcessor.extractText(file);
      
      expect(result.type).toBe('txt');
      expect(result.content).toBe('Hello World');
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBe(1.0);
      expect(result.method).toBe('text-read');
    });

    it('should handle multiline TXT content', async () => {
      const content = 'Line 1\\nLine 2\\nLine 3';
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      const result = await txtProcessor.extractText(file);
      
      expect(result.content).toBe(content);
    });

    it('should handle empty TXT file', async () => {
      const file = new File([''], 'empty.txt', { type: 'text/plain' });
      const result = await txtProcessor.extractText(file);
      
      expect(result.content).toBe('');
    });

    it('should handle special characters and Unicode', async () => {
      const content = 'Special chars: áéíóú ñ € © ® ™';
      const file = new File([content], 'unicode.txt', { type: 'text/plain' });
      const result = await txtProcessor.extractText(file);
      
      expect(result.content).toBe(content);
    });

    it('should handle large TXT files', async () => {
      // Create a moderately large file (1MB of text)
      const largeContent = 'A'.repeat(1024 * 1024);
      const file = new File([largeContent], 'large.txt', { type: 'text/plain' });
      const result = await txtProcessor.extractText(file);
      
      expect(result.content).toBe(largeContent);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle files with different encodings (UTF-8)', async () => {
      const content = 'UTF-8 content: 中文 русский العربية';
      const file = new File([content], 'utf8.txt', { 
        type: 'text/plain' 
      });
      const result = await txtProcessor.extractText(file);
      
      expect(result.content).toBe(content);
    });
  });
});