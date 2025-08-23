// src/services/DocxProcessor.ts

import { ProcessingResult, ProcessingError, ERROR_CODES } from '../types/file-processing.types';

export class DocxProcessor {
  /**
   * Extract text from DOCX file
   */
  async extractText(docxFile: File): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // Check if this is actually a DOC file (not supported)
      if (this.isDocFile(docxFile)) {
        throw {
          message: 'Legacy DOC files are not supported. Please save your document as DOCX format and try again.',
          code: ERROR_CODES.DOC_FORMAT_NOT_SUPPORTED
        } as ProcessingError;
      }

      // Validate file type
      if (!this.isDocxFile(docxFile)) {
        throw {
          message: 'Selected file is not a DOCX file. Please select a valid .docx file.',
          code: ERROR_CODES.UNSUPPORTED_TYPE
        } as ProcessingError;
      }

      // Import mammoth.js dynamically to avoid build issues
      let mammoth: any;
      try {
        mammoth = await import('mammoth');
      } catch (importError) {
        throw {
          message: 'Failed to load DOCX processing library. Please try again.',
          code: ERROR_CODES.NETWORK_ERROR
        } as ProcessingError;
      }

      // Convert file to array buffer
      const arrayBuffer = await docxFile.arrayBuffer();

      // Process with mammoth
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });

      return {
        type: 'docx',
        content: result.value,
        processingTime: Date.now() - startTime,
        confidence: 1.0,
        method: 'text-extraction'
      };

    } catch (error: any) {
      // Handle ProcessingError objects
      if (error.code) {
        throw error;
      }

      // Handle other errors
      throw {
        message: error.message || 'Failed to process DOCX file.',
        code: ERROR_CODES.DOCX_PROCESSING_FAILED,
        details: error
      } as ProcessingError;
    }
  }

  /**
   * Check if file is a DOCX file
   */
  private isDocxFile(file: File): boolean {
    return file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
           file.name.toLowerCase().endsWith('.docx');
  }

  /**
   * Check if file is a legacy DOC file
   */
  private isDocFile(file: File): boolean {
    return file.type === 'application/msword' ||
           file.name.toLowerCase().endsWith('.doc');
  }
}