// src/services/TxtProcessor.ts

import { ProcessingResult, ProcessingError, ERROR_CODES } from '../types/file-processing.types';

export class TxtProcessor {
  /**
   * Extract text from TXT file
   */
  async extractText(txtFile: File): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // Read the text content using FileReader
      const content = await this.readFileAsText(txtFile);

      return {
        type: 'txt',
        content: content,
        processingTime: Date.now() - startTime,
        confidence: 1.0,
        method: 'text-read'
      };

    } catch (error: any) {
      // Handle ProcessingError objects
      if (error.code) {
        throw error;
      }

      // Handle other errors
      throw {
        message: error.message || 'Failed to process TXT file.',
        code: ERROR_CODES.TXT_PROCESSING_FAILED,
        details: error
      } as ProcessingError;
    }
  }

  /**
   * Read file content as text using FileReader
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve(reader.result as string);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read TXT file.'));
      };
      
      reader.readAsText(file);
    });
  }
}