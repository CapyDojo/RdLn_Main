// src/services/FileProcessingService.ts

import { FileTypeDetector } from './FileTypeDetector';
import { DocxProcessor } from './DocxProcessor';
import { ProcessingResult, FileValidationResult, ProcessingError, ERROR_CODES } from '../types/file-processing.types';

export class FileProcessingService {
  private docxProcessor: DocxProcessor;

  constructor() {
    this.docxProcessor = new DocxProcessor();
  }

  /**
   * Process a file based on its type
   */
  async processFile(file: File): Promise<ProcessingResult> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw {
        message: validation.message || 'Invalid file',
        code: ERROR_CODES.UNSUPPORTED_TYPE
      } as ProcessingError;
    }

    // Detect file type
    const fileType = FileTypeDetector.getFileCategory(file);

    // Route to appropriate processor
    switch (fileType) {
      case 'docx':
        return await this.docxProcessor.extractText(file);
      
      // Future cases for PDF would go here
      // case 'pdf-text':
      //   return await this.pdfProcessor.extractTextDirectly(file);
      
      default:
        throw {
          message: 'Unsupported file type. Please upload a DOCX file.',
          code: ERROR_CODES.UNSUPPORTED_TYPE
        } as ProcessingError;
    }
  }

  /**
   * Validate file for processing
   */
  validateFile(file: File): FileValidationResult {
    // Check if file is a legacy DOC file
    if (FileTypeDetector.isDoc(file)) {
      return {
        valid: false,
        message: 'Legacy DOC files are not supported. Please save your document as DOCX format and try again.'
      };
    }

    // Check if it's a supported file type
    const fileType = FileTypeDetector.getFileCategory(file);
    if (fileType === 'unknown') {
      return {
        valid: false,
        message: 'Unsupported file type. Please upload a DOCX file.'
      };
    }

    // Check file size (10MB limit)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      return {
        valid: false,
        message: 'File is too large. Please select a file under 10MB.'
      };
    }

    return {
      valid: true
    };
  }
}