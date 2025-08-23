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

    it('should reject non-DOCX files with appropriate error', async () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      
      try {
        await fileProcessingService.processFile(file);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(ERROR_CODES.UNSUPPORTED_TYPE);
        expect(error.message).toContain('Unsupported file type');
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