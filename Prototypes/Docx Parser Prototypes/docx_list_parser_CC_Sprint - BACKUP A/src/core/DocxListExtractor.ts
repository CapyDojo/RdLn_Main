/**
 * DocxListExtractor - Wrapper around @omer-go/docx-parser-converter-ts
 * Extracts text from DOCX files with faithful list numbering reproduction
 */

import { DocxToTxtConverter } from '@omer-go/docx-parser-converter-ts';
import type { ExtractionResult, DocxMetadata } from './types';

export class DocxListExtractor {
  /**
   * Extract text from DOCX file with preserved list numbering
   * @param file - The DOCX file to extract from
   * @returns Promise with extraction result including text and metadata
   */
  async extractText(file: File): Promise<ExtractionResult> {
    const startTime = performance.now();

    try {
      // Validate file type
      if (!file.name.endsWith('.docx')) {
        throw new Error('Invalid file type. Expected .docx file.');
      }

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Create converter using static factory method
      const converter = await DocxToTxtConverter.create(arrayBuffer, {
        useDefaultValues: true,
      });

      // Convert to text with indentation enabled
      const text = converter.convertToTxt({
        indent: true,
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      const metadata: DocxMetadata = {
        fileName: file.name,
        fileSize: file.size,
        extractionDate: new Date(),
        processingTime,
      };

      return {
        text,
        metadata,
        success: true,
      };
    } catch (error) {
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      const metadata: DocxMetadata = {
        fileName: file.name,
        fileSize: file.size,
        extractionDate: new Date(),
        processingTime,
      };

      return {
        text: '',
        metadata,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Extract text from ArrayBuffer (for Node.js or alternative input)
   * @param buffer - ArrayBuffer containing DOCX data
   * @param fileName - Original file name
   * @returns Promise with extraction result
   */
  async extractFromBuffer(
    buffer: ArrayBuffer,
    fileName: string
  ): Promise<ExtractionResult> {
    const startTime = performance.now();

    try {
      // Create converter using static factory method
      const converter = await DocxToTxtConverter.create(buffer, {
        useDefaultValues: true,
      });

      // Convert to text with indentation enabled
      const text = converter.convertToTxt({
        indent: true,
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      const metadata: DocxMetadata = {
        fileName,
        fileSize: buffer.byteLength,
        extractionDate: new Date(),
        processingTime,
      };

      return {
        text,
        metadata,
        success: true,
      };
    } catch (error) {
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      const metadata: DocxMetadata = {
        fileName,
        fileSize: buffer.byteLength,
        extractionDate: new Date(),
        processingTime,
      };

      return {
        text: '',
        metadata,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Extract text and return only the text string (convenience method)
   * @param file - The DOCX file to extract from
   * @returns Promise with extracted text string
   * @throws Error if extraction fails
   */
  async extractTextOnly(file: File): Promise<string> {
    const result = await this.extractText(file);

    if (!result.success) {
      throw new Error(result.error || 'Extraction failed');
    }

    return result.text;
  }
}
