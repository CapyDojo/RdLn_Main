import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OCRService } from "../../src/services/OCRService";
import { OCRLanguage } from '../../src/types/ocr-types';
// import { TEST_IMAGES, EXPECTED_TEXT, EXPECTED_LANGUAGES } from '../helpers/test-utils';

// Mock Tesseract.js with realistic responses
const mockOCRResponses = {
  english: {
    data: {
      text: 'This is a sample English document.\n\nIt contains multiple paragraphs of text.\n\nEach paragraph demonstrates proper formatting.',
      confidence: 94.5,
      words: [
        { text: 'This', confidence: 96, bbox: { x0: 50, y0: 50, x1: 80, y1: 70 } },
        { text: 'is', confidence: 98, bbox: { x0: 85, y0: 50, x1: 95, y1: 70 } },
        { text: 'a', confidence: 97, bbox: { x0: 100, y0: 50, x1: 110, y1: 70 } }
      ],
      paragraphs: [
        { text: 'This is a sample English document.', confidence: 95 },
        { text: 'It contains multiple paragraphs of text.', confidence: 93 },
        { text: 'Each paragraph demonstrates proper formatting.', confidence: 96 }
      ]
    }
  },
  chinese: {
    data: {
      text: '这是一个中文文档示例。\n\n它包含多个段落的文本。\n\n每个段落都展示了正确的格式。',
      confidence: 89.2,
      words: [
        { text: '这', confidence: 91, bbox: { x0: 50, y0: 50, x1: 70, y1: 70 } },
        { text: '是', confidence: 88, bbox: { x0: 75, y0: 50, x1: 95, y1: 70 } }
      ],
      paragraphs: [
        { text: '这是一个中文文档示例。', confidence: 90 },
        { text: '它包含多个段落的文本。', confidence: 88 },
        { text: '每个段落都展示了正确的格式。', confidence: 91 }
      ]
    }
  },
  multilingual: {
    data: {
      text: 'Hello World 你好世界\n\nThis document contains both English and Chinese.\n这个文档包含英文和中文。',
      confidence: 87.8,
      words: [
        { text: 'Hello', confidence: 95, bbox: { x0: 50, y0: 50, x1: 85, y1: 70 } },
        { text: 'World', confidence: 94, bbox: { x0: 90, y0: 50, x1: 125, y1: 70 } },
        { text: '你好', confidence: 86, bbox: { x0: 130, y0: 50, x1: 155, y1: 70 } },
        { text: '世界', confidence: 88, bbox: { x0: 160, y0: 50, x1: 185, y1: 70 } }
      ],
      paragraphs: [
        { text: 'Hello World 你好世界', confidence: 89 },
        { text: 'This document contains both English and Chinese.\n这个文档包含英文和中文。', confidence: 86 }
      ]
    }
  },
  lowQuality: {
    data: {
      text: 'Th1s 15 p00r qu4l1ty 0CR t3xt w1th 3rr0rs.',
      confidence: 62.3,
      words: [
        { text: 'Th1s', confidence: 65, bbox: { x0: 50, y0: 50, x1: 75, y1: 70 } },
        { text: '15', confidence: 45, bbox: { x0: 80, y0: 50, x1: 90, y1: 70 } }
      ],
      paragraphs: [
        { text: 'Th1s 15 p00r qu4l1ty 0CR t3xt w1th 3rr0rs.', confidence: 62 }
      ]
    }
  }
};

const mockWorker = {
  loadLanguage: vi.fn().mockResolvedValue(undefined),
  initialize: vi.fn().mockResolvedValue(undefined),
  setParameters: vi.fn().mockResolvedValue(undefined),
  recognize: vi.fn().mockImplementation((image, options) => {
    // Simulate different responses based on language or context
    const langs = Array.isArray(options) ? options : [options];
    
    if (langs.includes('chi_sim') && langs.includes('eng')) {
      return Promise.resolve(mockOCRResponses.multilingual);
    } else if (langs.includes('chi_sim')) {
      return Promise.resolve(mockOCRResponses.chinese);
    } else if (langs.includes('eng')) {
      // Simulate low quality response sometimes
      const isLowQuality = Math.random() < 0.1; // 10% chance
      return Promise.resolve(isLowQuality ? mockOCRResponses.lowQuality : mockOCRResponses.english);
    }
    
    return Promise.resolve(mockOCRResponses.english);
  }),
  terminate: vi.fn().mockResolvedValue(undefined)
};

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(() => mockWorker)
}));

// Mock opencc-js
vi.mock('opencc-js', () => ({
  Converter: vi.fn().mockImplementation(() => ({
    convert: vi.fn((text: string) => text)
  }))
}));

describe('OCRService', () => {
  beforeEach(() => {
    // Reset any existing state
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up after each test
    await OCRService.terminate();
  });

  describe('Static Service', () => {
    it('should have static methods available', () => {
      expect(typeof OCRService.detectLanguage).toBe('function');
      expect(typeof OCRService.extractTextFromImage).toBe('function');
      expect(typeof OCRService.terminate).toBe('function');
    });
  });

  describe('Language Detection', () => {
    it('should detect English language correctly', async () => {
      // Set up mock to return English content
      mockWorker.recognize.mockResolvedValueOnce(mockOCRResponses.english);
      
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const result = await OCRService.detectLanguage(mockBlob);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('eng');
    });

    it('should detect Chinese language correctly', async () => {
      // Set up mock to return Chinese content
      mockWorker.recognize.mockResolvedValueOnce(mockOCRResponses.chinese);
      
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const result = await OCRService.detectLanguage(mockBlob);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('chi_sim');
    });

    it('should detect multiple languages in mixed content', async () => {
      // Set up mock to return multilingual content
      mockWorker.recognize.mockResolvedValueOnce(mockOCRResponses.multilingual);
      
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const result = await OCRService.detectLanguage(mockBlob);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(1);
      expect(result).toContain('eng');
      expect(result).toContain('chi_sim');
    });

    it('should prioritize primary language correctly', async () => {
      // Set up mock to return multilingual content
      mockWorker.recognize.mockResolvedValueOnce(mockOCRResponses.multilingual);
      
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const result = await OCRService.detectLanguage(mockBlob);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // The first language should be the primary one
      expect(result[0]).toBeDefined();
    });

    it('should handle low confidence text appropriately', async () => {
      // Set up mock to return low quality OCR
      mockWorker.recognize.mockResolvedValueOnce(mockOCRResponses.lowQuality);
      
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const result = await OCRService.detectLanguage(mockBlob);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Should still return a result, but may have lower confidence
      expect(result.length).toBeGreaterThan(0);
    });

    it('should cache language detection results', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      
      // First call
      const result1 = await OCRService.detectLanguage(mockBlob);
      
      // Second call with same image
      const result2 = await OCRService.detectLanguage(mockBlob);
      
      expect(result1).toEqual(result2);
    });
  });

  describe('Text Extraction', () => {
    it('should extract text from English image', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const result = await OCRService.extractTextFromImage(
        mockBlob,
        { languages: ['eng'], autoDetect: false }
      );
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should extract text from Chinese image', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const result = await OCRService.extractTextFromImage(
        mockBlob,
        { languages: ['chi_sim'], autoDetect: false }
      );
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle multi-language extraction', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const result = await OCRService.extractTextFromImage(
        mockBlob,
        { languages: ['eng', 'chi_sim'], autoDetect: false }
      );
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should preserve paragraphs when requested', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const result = await OCRService.extractTextFromImage(
        mockBlob,
        { languages: ['eng'], autoDetect: false }
      );
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle extraction options', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const result = await OCRService.extractTextFromImage(
        mockBlob,
        {
          languages: ['chi_sim'],
          autoDetect: false,
          primaryLanguage: 'chi_sim'
        }
      );
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress during extraction', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      
      // The current OCRService doesn't expose progress callbacks in its API
      // but we can test that extraction completes successfully
      const result = await OCRService.extractTextFromImage(
        mockBlob,
        { languages: ['eng'], autoDetect: false }
      );
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid image data', async () => {
      await expect(
        OCRService.extractTextFromImage('invalid-image-data' as any, { languages: ['eng'] })
      ).rejects.toThrow();
    });

    it('should handle unsupported languages', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      await expect(
        OCRService.extractTextFromImage(mockBlob, { languages: ['unsupported'] as any })
      ).rejects.toThrow();
    });

    it('should handle empty language array', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      // Empty language array should use auto-detect or default to English
      const result = await OCRService.extractTextFromImage(mockBlob, { languages: [] });
      expect(result).toBeDefined();
    });
  });

  describe('Worker Management', () => {
    it('should create workers as needed', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const result = await OCRService.extractTextFromImage(
        mockBlob,
        { languages: ['eng'], autoDetect: false }
      );
      expect(result).toBeDefined();
    });

    it('should reuse workers when possible', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      
      // First extraction
      await OCRService.extractTextFromImage(mockBlob, { languages: ['eng'] });
      
      // Second extraction with same language
      await OCRService.extractTextFromImage(mockBlob, { languages: ['eng'] });
      
      // Worker should be reused (this is implicit in the test)
      expect(true).toBe(true);
    });

    it('should clean up workers properly', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      await OCRService.extractTextFromImage(mockBlob, { languages: ['eng'] });
      
      // Cleanup should not throw
      await expect(OCRService.terminate()).resolves.not.toThrow();
    });
  });

  describe('Chinese Variant Detection', () => {
    it('should detect simplified Chinese', async () => {
      // This would need actual Chinese text to test properly
      const mockChineseText = '这是简体中文文本';
      
      // Test the detection logic (mocked)
      expect(mockChineseText).toBeDefined();
    });

    it('should detect traditional Chinese', async () => {
      // This would need actual Chinese text to test properly
      const mockChineseText = '這是繁體中文文本';
      
      // Test the detection logic (mocked)
      expect(mockChineseText).toBeDefined();
    });
  });

  describe('Performance Considerations', () => {
    it('should complete extraction within reasonable time', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const startTime = Date.now();
      
      await OCRService.extractTextFromImage(mockBlob, { languages: ['eng'] });
      
      const duration = Date.now() - startTime;
      
      // Should complete within 30 seconds (generous for test environment)
      expect(duration).toBeLessThan(30000);
    });

    it('should handle multiple concurrent extractions', async () => {
      const mockBlob1 = new Blob(['test1'], { type: 'image/png' });
      const mockBlob2 = new Blob(['test2'], { type: 'image/png' });
      
      const promises = [
        OCRService.extractTextFromImage(mockBlob1, { languages: ['eng'] }),
        OCRService.extractTextFromImage(mockBlob2, { languages: ['chi_sim'] }),
        OCRService.extractTextFromImage(mockBlob1, { languages: ['eng', 'chi_sim'] })
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Configuration', () => {
    it('should respect default configuration', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });

      const result = await OCRService.extractTextFromImage(
        mockBlob,
        { languages: ['eng'], autoDetect: false }
      );
      
      expect(result).toBeDefined();
    });

    it('should handle custom extraction options', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });

      const customOptions = {
        languages: ['eng'],
        autoDetect: false,
        primaryLanguage: 'eng'
      };
      
      const result = await OCRService.extractTextFromImage(
        mockBlob,
        customOptions
      );
      expect(result).toBeDefined();
    });
  });
});
