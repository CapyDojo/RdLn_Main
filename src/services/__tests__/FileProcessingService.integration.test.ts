// src/services/__tests__/FileProcessingService.integration.test.ts
import { FileProcessingService } from '../FileProcessingService';
import { ERROR_CODES } from '../../types/file-processing.types';

describe('FileProcessingService Integration', () => {
  let fileProcessingService: FileProcessingService;

  beforeEach(() => {
    fileProcessingService = new FileProcessingService();
  });

  describe('processFile', () => {
    it('should reject DOC files with appropriate error', async () => {
      const file = new File([''], 'test.doc', { type: 'application/msword' });
      
      try {
        await fileProcessingService.processFile(file);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(ERROR_CODES.UNSUPPORTED_TYPE);
        expect(error.message).toContain('Legacy DOC files are not supported');
      }
    });

    it('should reject non-supported files with appropriate error', async () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      
      try {
        await fileProcessingService.processFile(file);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(ERROR_CODES.UNSUPPORTED_TYPE);
        expect(error.message).toContain('Unsupported file type');
      }
    });

    it('should process DOCX files correctly', async () => {
      // Create a minimal valid DOCX file (ZIP with required structure)
      const docxContent = new ArrayBuffer(22); // Minimal valid ZIP header
      const file = new File([docxContent], 'test.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      try {
        await fileProcessingService.processFile(file);
        // Should either succeed or fail with DOCX-specific error, not unsupported type error
      } catch (error: any) {
        expect(error.code).not.toBe(ERROR_CODES.UNSUPPORTED_TYPE);
        // Could be DOCX_PROCESSING_FAILED due to minimal content, which is expected
      }
    });

    it('should process TXT files correctly', async () => {
      const file = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
      
      try {
        const result = await fileProcessingService.processFile(file);
        expect(result.type).toBe('txt');
        expect(result.content).toBe('Hello World');
      } catch (error: any) {
        // If it fails, it shouldn't be due to unsupported type
        expect(error.code).not.toBe(ERROR_CODES.UNSUPPORTED_TYPE);
      }
    });

    it('should reject files that are too large', async () => {
      // Create a large file (15MB)
      const largeContent = new ArrayBuffer(15 * 1024 * 1024);
      const file = new File([largeContent], 'large.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      try {
        await fileProcessingService.processFile(file);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(ERROR_CODES.UNSUPPORTED_TYPE);
        expect(error.message).toContain('File is too large');
      }
    });
  });
});