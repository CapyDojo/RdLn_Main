 OCR Post-Processing Logic Flow

  The OCR post-processing occurs in several stages after language detection and text extraction:

1. Text Cleanup Service (OCRTextCleanupService.ts) - Main post-processing logic

2. Paragraph Formatting (paragraphFormatting.ts) - Final formatting step

3. Orchestrator (OCROrchestrator.ts) - Coordinates the entire process
   
   Key Post-Processing Components
   
   1. OCRTextCleanupService.ts
      This is the main post-processing service that handles language-specific text cleaning:
   
   1 // Main entry point for text processing
   2 public static async processText(
   3   text: string,
   4   languages: OCRLanguage[],
   5   options: TextProcessingOptions = {}
   6 ): Promise<ProcessingResult>
   
   The service applies different processing based on language:
- CJK Languages (Chinese, Japanese, Korean): Special handling for character-based languages

- European Languages (French, German, Spanish, Russian): Language-specific punctuation and character fixes

- English: Full enhancement suite including legal terminology fixes
  
  2. Key Post-Processing Functions
  
  Character Error Correction
  
  1 private static fixCharacterErrors(text: string): string
  Fixes common OCR character substitution errors like:

- 0 → O, 1 → I/l

- Pipe to I

- 5 at start of word → S

- 8 before letters → B
  
  Number Formatting Fixes
  
  1 private static fixNumberFormatting(text: string): string
  Handles:

- Concatenated numbers

- Currency formatting

- Percentage formatting

- Decimal formatting

- Date formatting

- Phone number formatting
  
  Legal Terminology Fixes (English only)
  
  1 private static fixLegalTerminology(text: string): string
  Corrects common legal/business terms:

- Contract terms (WHEREAS, NOW THEREFORE, etc.)

- Legal entities (LLC, Inc, Corp, Ltd)

- Common legal phrases

- Legal abbreviations (e.g., "vs." "Sec.", etc.)
  
  Spacing and Punctuation Fixes
  
  1 private static fixSpacingAndPunctuation(text: string): string
  Handles:

- Multiple spaces to single space

- Spacing around punctuation

- Parentheses spacing

- Quote spacing

- Hyphen and dash spacing

- Colon and semicolon spacing
  
  Paragraph Reconstruction
  
  1 private static applyIntelligentParagraphReconstruction(text: string): string
  Reconstructs paragraphs intelligently by:

- Preserving existing paragraph structure

- Joining lines with clear evidence they should be joined

- Respecting definite paragraph starters
  
  3. Final Formatting Step
  
  The final step uses the formatPastedText function from paragraphFormatting.ts:
  
  1 // In OCROrchestrator.ts
  2 const finalText = formatPastedText(processingResult.processedText);
  
  This function:
1. Detects if text contains CJK characters

2. Counts content units appropriately (characters for CJK, words for European)

3. Applies short-line detection to preserve intentional line breaks

4. Uses semantic break detection to avoid joining sentences incorrectly

5. Handles hyphenated words correctly
   
   Summary of Post-Processing Flow

6. Language Detection → Detects languages in the image

7. Text Extraction → Extracts raw text using Tesseract.js

8. Language-Specific Cleanup → Applies appropriate cleanup based on detected languages:
   
   - CJK languages: Special character handling
   - European languages: Language-specific punctuation fixes
   - English: Full enhancement suite including legal terminology fixes

9. Universal Preservation → Preserves paragraph structure across all languages

10. Final Paragraph Formatting → Applies smart PDF-aware formatting using short-line detection
    
    The post-processing is designed to be language-aware and applies different rules based on the detected language,
    with special attention to legal document formatting and CJK character handling.
