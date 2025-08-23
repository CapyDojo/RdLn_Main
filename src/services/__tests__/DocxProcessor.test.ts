// src/services/__tests__/DocxProcessor.test.ts
import { DocxProcessor } from '../DocxProcessor';
import { ERROR_CODES } from '../../types/file-processing.types';

describe('DocxProcessor', () => {
  let docxProcessor: DocxProcessor;

  beforeEach(() => {
    docxProcessor = new DocxProcessor();
  });

  describe('extractText', () => {
    it('should reject DOC files with appropriate error', async () => {
      const file = new File([''], 'test.doc', { type: 'application/msword' });
      
      try {
        await docxProcessor.extractText(file);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(ERROR_CODES.DOC_FORMAT_NOT_SUPPORTED);
        expect(error.message).toContain('Legacy DOC files are not supported');
      }
    });

    it('should reject non-DOCX files with appropriate error', async () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      
      try {
        await docxProcessor.extractText(file);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(ERROR_CODES.UNSUPPORTED_TYPE);
        expect(error.message).toContain('Selected file is not a DOCX file');
      }
    });
  });
});