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
   * Sanitize DOCX to fix negative indentation values
   * Negative indents cause "Invalid count value: -1" error in the library
   * @param arrayBuffer - Original DOCX file
   * @returns Sanitized DOCX with negative indents replaced by zero, or original if no issues found
   */
  private async sanitizeNegativeIndents(arrayBuffer: ArrayBuffer): Promise<{ buffer: ArrayBuffer; sanitized: boolean }> {
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      let documentXml = await zip.file('word/document.xml')?.async('string');

      if (!documentXml) {
        // No document.xml, return original
        return { buffer: arrayBuffer, sanitized: false };
      }

      // Check if negative indents exist
      const hasNegativeIndents = /<w:ind[^>]*w:(?:left|right|firstLine|hanging)="-\d+"/.test(documentXml);

      if (!hasNegativeIndents) {
        // No negative indents, return original
        return { buffer: arrayBuffer, sanitized: false };
      }

      console.log('🔧 Detected negative indentation values, sanitizing...');

      let replacementCount = 0;

      // Replace negative left indentation with zero
      documentXml = documentXml.replace(
        /(<w:ind[^>]*)w:left="-\d+"([^>]*>)/g,
        (_match, before, after) => {
          replacementCount++;
          return `${before}w:left="0"${after}`;
        }
      );

      // Replace negative right indentation with zero
      documentXml = documentXml.replace(
        /(<w:ind[^>]*)w:right="-\d+"([^>]*>)/g,
        (_match, before, after) => {
          replacementCount++;
          return `${before}w:right="0"${after}`;
        }
      );

      // Replace negative firstLine indentation
      documentXml = documentXml.replace(
        /(<w:ind[^>]*)w:firstLine="-\d+"([^>]*>)/g,
        (_match, before, after) => {
          replacementCount++;
          return `${before}w:firstLine="0"${after}`;
        }
      );

      // Replace negative hanging indentation
      documentXml = documentXml.replace(
        /(<w:ind[^>]*)w:hanging="-\d+"([^>]*>)/g,
        (_match, before, after) => {
          replacementCount++;
          return `${before}w:hanging="0"${after}`;
        }
      );

      // Update ZIP with sanitized document.xml
      zip.file('word/document.xml', documentXml);

      console.log(`✅ Normalized ${replacementCount} negative indentation values to zero`);

      const sanitizedBuffer = await zip.generateAsync({ type: 'arraybuffer' });
      return { buffer: sanitizedBuffer, sanitized: true };
    } catch (error) {
      console.warn('⚠️ Failed to sanitize negative indents, using original:', error);
      return { buffer: arrayBuffer, sanitized: false };
    }
  }

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

      // Pre-process: Sanitize negative indentation values
      const { buffer: sanitizedBuffer, sanitized: wasSanitized } = await this.sanitizeNegativeIndents(arrayBuffer);

      let converter;
      let text = '';
      let hasNumberingErrors = false;
      let noNumberingFile = false;

      // Try to create converter with full numbering support
      try {
        converter = await DocxToTxtConverter.create(sanitizedBuffer, {
          useDefaultValues: true,
        });

        // Track numbering errors during conversion
        const originalWarn = console.warn;
        const numberingErrors: string[] = [];
        const failedNumIds = new Set<number>();
        const failedLevels = new Map<number, Set<number>>(); // numId -> Set of ilvl

        console.warn = (...args: any[]) => {
          const message = args[0];
          if (typeof message === 'string' && message.includes('Numbering level not found')) {
            hasNumberingErrors = true;
            numberingErrors.push(message);

            // Extract numId and ilvl from error message
            const match = message.match(/numId: (\d+), ilvl: (\d+)/);
            if (match) {
              const numId = parseInt(match[1]);
              const ilvl = parseInt(match[2]);

              failedNumIds.add(numId);

              if (!failedLevels.has(numId)) {
                failedLevels.set(numId, new Set());
              }
              failedLevels.get(numId)!.add(ilvl);
            }
          }
          originalWarn(...args); // Still log for debugging
        };

        // Convert to text with indentation enabled
        // Wrap in try-catch to handle "Invalid count value: -1" error from tables
        try {
          text = converter.convertToTxt({
            indent: true,
          });
        } catch (conversionError) {
          const convErrorMsg = conversionError instanceof Error ? conversionError.message : '';

          if (convErrorMsg.includes('Invalid count value')) {
            console.warn('⚠️ Indentation error detected (likely from table formatting)');
            console.log('🔄 Retrying without indentation...');

            // Retry without indentation
            text = converter.convertToTxt({
              indent: false,
            });

            console.log('✅ Extraction successful without indentation');
          } else {
            // Different error, rethrow
            throw conversionError;
          }
        }

        // Restore original console.warn
        console.warn = originalWarn;

        // If numbering errors occurred, apply fallback numbering
        if (hasNumberingErrors) {
          console.log('🔧 Applying fallback numbering...');

          // Log which numIds failed
          if (failedNumIds.size > 0) {
            console.log(`📋 Failed numIds: ${Array.from(failedNumIds).join(', ')}`);

            // Show details for each failed numId
            failedLevels.forEach((levels, numId) => {
              console.log(`   numId ${numId}: levels ${Array.from(levels).sort((a, b) => a - b).join(', ')} failed`);
            });
          }

          text = NumberingFallback.postProcessText(text, true);

          const stats = NumberingFallback.analyzeListItems(text);
          console.log(`📊 Fixed ${stats.bulletLines} list items across ${stats.indentationLevels.length} levels`);
        }
      } catch (initError) {
        // Check if it's a numbering.xml-related error
        const errorMsg = initError instanceof Error ? initError.message : '';

        if (errorMsg.includes('numbering.xml') && errorMsg.includes('not found')) {
          // Before assuming "no lists", check if numbering.xml actually exists
          const zip = await JSZip.loadAsync(sanitizedBuffer);
          const numberingFile = zip.file('word/numbering.xml');

          if (!numberingFile) {
            // numbering.xml truly doesn't exist - document has no lists
            console.log('ℹ️ No numbering.xml found - document has no lists. Using manual extraction...');
            noNumberingFile = true;
            text = await this.extractPlainTextManually(sanitizedBuffer);
          } else {
            // numbering.xml EXISTS but library failed to parse it
            // This is a different failure mode - the library has a bug or XML is malformed
            console.error('⚠️ numbering.xml exists but library failed to parse it');
            console.log('🔧 Attempting recovery with manual extraction + smart list detection...');

            // Try manual extraction but flag that this file SHOULD have lists
            text = await this.extractPlainTextManually(sanitizedBuffer);

            // Change warning to indicate this is a library limitation, not missing lists
            noNumberingFile = false;
            hasNumberingErrors = true;
          }
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
      const warnings: string[] = [];

      if (noNumberingFile) {
        warnings.push('Document contains no lists or numbering definitions.');
      } else if (hasNumberingErrors) {
        warnings.push('Applied fallback numbering due to missing or invalid list definitions. Original numbering style may differ.');
      }

      if (wasSanitized) {
        warnings.push('Document contained negative indentation values (likely from tables) that were normalized for parsing.');
      }

      warning = warnings.length > 0 ? warnings.join(' ') : undefined;

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

      // Enhanced error logging for debugging
      console.error('❌ Extraction failed:', errorMessage);
      if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack);
      }

      // Log additional error details for specific error types
      if (errorMessage.includes('Invalid count value')) {
        console.error('🔍 Invalid count value error detected - this may be a library bug or malformed XML');
        console.error('Please report this error with the DOCX file for investigation');
      }

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
