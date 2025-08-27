// src/services/FileTypeDetector.ts

import { FileType } from '../types/file-processing.types';

export class FileTypeDetector {
  /**
   * Check if file is a DOCX file
   */
  static isDocx(file: File): boolean {
    return file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
           file.name.toLowerCase().endsWith('.docx');
  }

  /**
   * Check if file is a legacy DOC file
   */
  static isDoc(file: File): boolean {
    return file.type === 'application/msword' ||
           file.name.toLowerCase().endsWith('.doc');
  }

  /**
   * Check if file is a PDF file
   */
  static isPdf(file: File): boolean {
    return file.type === 'application/pdf' ||
           file.name.toLowerCase().endsWith('.pdf');
  }

  /**
   * Check if file is a TXT file
   */
  static isTxt(file: File): boolean {
    return file.type === 'text/plain' ||
           file.name.toLowerCase().endsWith('.txt');
  }

  /**
   * Determine file category for processing
   */
  static getFileCategory(file: File): FileType {
    if (this.isDocx(file)) {
      return 'docx';
    }
    if (this.isTxt(file)) {
      return 'txt';
    }
    // Note: PDF detection would be implemented here for future support
    // For now, we're focusing on DOCX and TXT support
    return 'unknown';
  }
}