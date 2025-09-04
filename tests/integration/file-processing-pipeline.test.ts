import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileProcessingService } from '@/services/FileProcessingService';
import { FileTypeDetector } from '@/services/FileTypeDetector';
import { DocxProcessor } from '@/services/DocxProcessor';
import { TxtProcessor } from '@/services/TxtProcessor';
import { ERROR_CODES } from '@/types/file-processing.types';
import { createMockDocxFile, createMockTextFile } from '@/testing/test-utils';

describe('File Processing Pipeline Integration', () => {
  let fileProcessingService: FileProcessingService;
  let mockDocxProcessor: any;
  let mockTxtProcessor: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the processors
    mockDocxProcessor = {
      extractText: vi.fn()
    };
    mockTxtProcessor = {
      extractText: vi.fn()
    };

    // Mock the processor constructors
    vi.mocked(DocxProcessor).mockImplementation(() => mockDocxProcessor);
    vi.mocked(TxtProcessor).mockImplementation(() => mockTxtProcessor);

    fileProcessingService = new FileProcessingService();
  });

  describe('end-to-end file processing', () => {
    it('should process DOCX files through the complete pipeline', async () => {
      const mockDocxFile = createMockDocxFile('Test content');
      const expectedResult = {
        text: 'Extracted DOCX content',
        metadata: { format: 'docx' }
      };

      mockDocxProcessor.extractText.mockResolvedValue(expectedResult);

      const result = await fileProcessingService.processFile(mockDocxFile);

      expect(FileTypeDetector.getFileCategory(mockDocxFile)).toBe('docx');
      expect(mockDocxProcessor.extractText).toHaveBeenCalledWith(mockDocxFile);
      expect(result).toEqual(expectedResult);
    });

    it('should process TXT files through the complete pipeline', async () => {
      const mockTxtFile = createMockTextFile('Plain text content');
      const expectedResult = {
        text: 'Extracted TXT content',
        metadata: { format: 'txt' }
      };

      mockTxtProcessor.extractText.mockResolvedValue(expectedResult);

      const result = await fileProcessingService.processFile(mockTxtFile);

      expect(FileTypeDetector.getFileCategory(mockTxtFile)).toBe('txt');
      expect(mockTxtProcessor.extractText).toHaveBeenCalledWith(mockTxtFile);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('file validation integration', () => {
    it('should validate and process valid DOCX files', async () => {
      const validDocxFile = createMockDocxFile('Valid content');
      mockDocxProcessor.extractText.mockResolvedValue({ text: 'content' });

      const validation = fileProcessingService.validateFile(validDocxFile);
      expect(validation.valid).toBe(true);

      const result = await fileProcessingService.processFile(validDocxFile);
      expect(result).toBeDefined();
    });

    it('should reject legacy DOC files', async () => {
      const docFile = new File(['content'], 'document.doc', {
        type: 'application/msword'
      });

      const validation = fileProcessingService.validateFile(docFile);
      expect(validation.valid).toBe(false);
      expect(validation.message).toContain('Legacy DOC files are not supported');

      await expect(fileProcessingService.processFile(docFile)).rejects.toMatchObject({
        code: ERROR_CODES.UNSUPPORTED_TYPE
      });
    });

    it('should reject files that are too large', async () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const validation = fileProcessingService.validateFile(largeFile);
      expect(validation.valid).toBe(false);
      expect(validation.message).toContain('File is too large');

      await expect(fileProcessingService.processFile(largeFile)).rejects.toMatchObject({
        code: ERROR_CODES.UNSUPPORTED_TYPE
      });
    });

    it('should reject unsupported file types', async () => {
      const unsupportedFile = new File(['content'], 'document.pdf', {
        type: 'application/pdf'
      });

      const validation = fileProcessingService.validateFile(unsupportedFile);
      expect(validation.valid).toBe(false);
      expect(validation.message).toContain('Unsupported file type');

      await expect(fileProcessingService.processFile(unsupportedFile)).rejects.toMatchObject({
        code: ERROR_CODES.UNSUPPORTED_TYPE
      });
    });
  });

  describe('error handling integration', () => {
    it('should propagate processor errors with proper context', async () => {
      const mockDocxFile = createMockDocxFile('Test content');
      const processorError = new Error('DOCX processing failed');

      mockDocxProcessor.extractText.mockRejectedValue(processorError);

      await expect(fileProcessingService.processFile(mockDocxFile)).rejects.toThrow(
        'DOCX processing failed'
      );
    });

    it('should handle processor timeout errors', async () => {
      const mockTxtFile = createMockTextFile('Test content');
      const timeoutError = new Error('Processing timeout');

      mockTxtProcessor.extractText.mockRejectedValue(timeoutError);

      await expect(fileProcessingService.processFile(mockTxtFile)).rejects.toThrow(
        'Processing timeout'
      );
    });

    it('should provide meaningful error messages for validation failures', async () => {
      const emptyFile = new File([], 'empty.unknown', { type: '' });

      const validation = fileProcessingService.validateFile(emptyFile);
      expect(validation.valid).toBe(false);
      expect(validation.message).toContain('Unsupported file type');

      try {
        await fileProcessingService.processFile(emptyFile);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(ERROR_CODES.UNSUPPORTED_TYPE);
        expect(error.message).toContain('Unsupported file type');
      }
    });
  });

  describe('file type detection integration', () => {
    it('should correctly route files based on type detection', async () => {
      // Test DOCX routing
      const docxFile = createMockDocxFile('DOCX content');
      mockDocxProcessor.extractText.mockResolvedValue({ text: 'docx result' });

      await fileProcessingService.processFile(docxFile);
      expect(mockDocxProcessor.extractText).toHaveBeenCalledWith(docxFile);
      expect(mockTxtProcessor.extractText).not.toHaveBeenCalled();

      vi.clearAllMocks();

      // Test TXT routing
      const txtFile = createMockTextFile('TXT content');
      mockTxtProcessor.extractText.mockResolvedValue({ text: 'txt result' });

      await fileProcessingService.processFile(txtFile);
      expect(mockTxtProcessor.extractText).toHaveBeenCalledWith(txtFile);
      expect(mockDocxProcessor.extractText).not.toHaveBeenCalled();
    });

    it('should handle edge cases in file type detection', async () => {
      // File with DOCX extension but no MIME type
      const docxFileNoMime = new File(['content'], 'document.docx', { type: '' });
      mockDocxProcessor.extractText.mockResolvedValue({ text: 'result' });

      const result = await fileProcessingService.processFile(docxFileNoMime);
      expect(result).toBeDefined();
      expect(mockDocxProcessor.extractText).toHaveBeenCalled();
    });

    it('should handle files with correct MIME type but no extension', async () => {
      // File with DOCX MIME type but no extension
      const docxFileNoExt = new File(['content'], 'document', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      mockDocxProcessor.extractText.mockResolvedValue({ text: 'result' });

      const result = await fileProcessingService.processFile(docxFileNoExt);
      expect(result).toBeDefined();
      expect(mockDocxProcessor.extractText).toHaveBeenCalled();
    });
  });

  describe('processor dependency injection', () => {
    it('should properly initialize processors during construction', () => {
      expect(DocxProcessor).toHaveBeenCalledOnce();
      expect(TxtProcessor).toHaveBeenCalledOnce();
    });

    it('should use the same processor instances for multiple operations', async () => {
      const file1 = createMockDocxFile('Content 1');
      const file2 = createMockDocxFile('Content 2');

      mockDocxProcessor.extractText.mockResolvedValue({ text: 'result' });

      await fileProcessingService.processFile(file1);
      await fileProcessingService.processFile(file2);

      // Should use the same processor instance
      expect(mockDocxProcessor.extractText).toHaveBeenCalledTimes(2);
      expect(DocxProcessor).toHaveBeenCalledOnce(); // Constructor called only once
    });
  });

  describe('performance and resource management', () => {
    it('should handle multiple concurrent file processing requests', async () => {
      const files = [
        createMockDocxFile('Content 1'),
        createMockTextFile('Content 2'),
        createMockDocxFile('Content 3')
      ];

      mockDocxProcessor.extractText.mockResolvedValue({ text: 'docx result' });
      mockTxtProcessor.extractText.mockResolvedValue({ text: 'txt result' });

      const promises = files.map(file => fileProcessingService.processFile(file));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockDocxProcessor.extractText).toHaveBeenCalledTimes(2);
      expect(mockTxtProcessor.extractText).toHaveBeenCalledTimes(1);
    });

    it('should handle memory-intensive files gracefully', async () => {
      const largeValidFile = createMockDocxFile('x'.repeat(5 * 1024 * 1024)); // 5MB
      mockDocxProcessor.extractText.mockResolvedValue({ text: 'large result' });

      const result = await fileProcessingService.processFile(largeValidFile);
      expect(result).toBeDefined();
    });
  });
});

// Mock the service modules
vi.mock('@/services/DocxProcessor', () => ({
  DocxProcessor: vi.fn()
}));

vi.mock('@/services/TxtProcessor', () => ({
  TxtProcessor: vi.fn()
}));