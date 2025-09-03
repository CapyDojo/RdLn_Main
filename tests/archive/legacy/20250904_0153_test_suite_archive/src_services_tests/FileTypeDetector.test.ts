// src/services/__tests__/FileTypeDetector.test.ts
import { FileTypeDetector } from '../FileTypeDetector';

describe('FileTypeDetector', () => {
  describe('isDocx', () => {
    it('should detect DOCX files by MIME type', () => {
      const file = new File([''], 'test.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      expect(FileTypeDetector.isDocx(file)).toBe(true);
    });

    it('should detect DOCX files by extension', () => {
      const file = new File([''], 'test.docx', { type: 'application/octet-stream' });
      expect(FileTypeDetector.isDocx(file)).toBe(true);
    });

    it('should not detect non-DOCX files', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(FileTypeDetector.isDocx(file)).toBe(false);
    });
  });

  describe('isDoc', () => {
    it('should detect DOC files by MIME type', () => {
      const file = new File([''], 'test.doc', { type: 'application/msword' });
      expect(FileTypeDetector.isDoc(file)).toBe(true);
    });

    it('should detect DOC files by extension', () => {
      const file = new File([''], 'test.doc', { type: 'application/octet-stream' });
      expect(FileTypeDetector.isDoc(file)).toBe(true);
    });

    it('should not detect non-DOC files', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(FileTypeDetector.isDoc(file)).toBe(false);
    });
  });

  describe('isTxt', () => {
    it('should detect TXT files by MIME type', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(FileTypeDetector.isTxt(file)).toBe(true);
    });

    it('should detect TXT files by extension', () => {
      const file = new File([''], 'test.txt', { type: 'application/octet-stream' });
      expect(FileTypeDetector.isTxt(file)).toBe(true);
    });

    it('should not detect non-TXT files', () => {
      const file = new File([''], 'test.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      expect(FileTypeDetector.isTxt(file)).toBe(false);
    });
  });

  describe('getFileCategory', () => {
    it('should categorize DOCX files', () => {
      const file = new File([''], 'test.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      expect(FileTypeDetector.getFileCategory(file)).toBe('docx');
    });

    it('should categorize TXT files', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(FileTypeDetector.getFileCategory(file)).toBe('txt');
    });

    it('should categorize unknown files as unknown', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(FileTypeDetector.getFileCategory(file)).toBe('unknown');
    });
  });
});