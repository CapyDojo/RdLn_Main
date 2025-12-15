/**
 * DocxListExtractor - Wrapper around @omer-go/docx-parser-converter-ts
 * Extracts text from DOCX files with faithful list numbering reproduction
 *
 * PATCHED VERSION: Includes fallback numbering for when library fails
 */

import { DocxToTxtConverter } from '@omer-go/docx-parser-converter-ts';
import { NumberingFallback } from './NumberingFallback';
import JSZip from 'jszip';
import type { ExtractionResult, DocxMetadata } from './types';

export class DocxListExtractor {
  /**
   * Manual text extraction from document.xml for files without numbering.xml
   * @param arrayBuffer - The DOCX file as ArrayBuffer
   * @returns Extracted plain text
   */
  private async extractPlainTextManually(arrayBuffer: ArrayBuffer): Promise<string> {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXml = await zip.file('word/document.xml')?.async('string');

    if (!documentXml) {
      throw new Error('Could not find document.xml in DOCX archive');
    }

    // Basic XML text extraction - remove all tags
    let text = documentXml
      .replace(/<w:t[^>]*>/g, '') // Remove opening text tags
      .replace(/<\/w:t>/g, '') // Remove closing text tags
      .replace(/<w:p[^>]*>/g, '\n') // Paragraphs become newlines
      .replace(/<[^>]+>/g, '') // Remove all other XML tags
      .replace(/\n\n+/g, '\n') // Collapse multiple newlines
      .trim();

    return text;
  }
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

      let converter;
      let text = '';
      let hasNumberingErrors = false;
      let noNumberingFile = false;

      // Try to create converter with full numbering support
      try {
        converter = await DocxToTxtConverter.create(arrayBuffer, {
          useDefaultValues: true,
        });

        // Track numbering errors during conversion
        const originalWarn = console.warn;
        const numberingErrors: string[] = [];

        console.warn = (...args: any[]) => {
          const message = args[0];
          if (typeof message === 'string' && message.includes('Numbering level not found')) {
            hasNumberingErrors = true;
            numberingErrors.push(message);
          }
          originalWarn(...args); // Still log for debugging
        };

        // Convert to text with indentation enabled
        text = converter.convertToTxt({
          indent: true,
        });

        // Restore original console.warn
        console.warn = originalWarn;

        // If numbering errors occurred, apply fallback numbering
        if (hasNumberingErrors) {
          console.log('🔧 Applying fallback numbering...');
          text = NumberingFallback.postProcessText(text, true);

          const stats = NumberingFallback.analyzeListItems(text);
          console.log(`📊 Fixed ${stats.bulletLines} list items across ${stats.indentationLevels.length} levels`);
        }
      } catch (initError) {
        // Check if it's the missing numbering.xml error
        const errorMsg = initError instanceof Error ? initError.message : '';
        if (errorMsg.includes('numbering.xml') && errorMsg.includes('not found')) {
          console.log('ℹ️ No numbering.xml found - document has no lists. Using manual extraction...');
          noNumberingFile = true;

          // Use manual extraction since library can't handle missing numbering.xml
          text = await this.extractPlainTextManually(arrayBuffer);
        } else {
          // Different error, rethrow
          throw initError;
        }
      }

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      const metadata: DocxMetadata = {
        fileName: file.name,
        fileSize: file.size,
        extractionDate: new Date(),
        processingTime,
      };

      // Determine warning message
      let warning: string | undefined;
      if (noNumberingFile) {
        warning = 'Document contains no lists or numbering definitions.';
      } else if (hasNumberingErrors) {
        warning = 'Applied fallback numbering. Original numbering style may differ.';
      }

      return {
        text,
        metadata,
        success: true,
        warning,
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

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Extraction failed:', errorMessage);

      return {
        text: '',
        metadata,
        success: false,
        error: errorMessage,
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
