/**
 * Paste PDF Detection Utility
 * 
 * Analyzes clipboard data to determine if pasted content was originally formatted
 * and should skip auto-formatting, or if it's raw plain text that needs formatting.
 * 
 * Based on the KEY_LEARNINGS approach: check data source first, then adapt strategy.
 */

export type FormatLevel = 'None' | 'RTF_HTML_Paste_Format' | 'PDF_Paste_Format';

export interface PasteContext {
  hasHtml: boolean;
  hasRtf: boolean;
  hasPlainOnly: boolean;
  sourceType: 'formatted' | 'plain' | 'mixed';
  formatCount: number;
  formatLevel: FormatLevel;
  detectedSource: string;
}

/**
 * Simple PDF detection based on line length patterns
 * PDFs create artificial line breaks at page width, not semantic boundaries
 */
function isPdfLikeContent(plainText: string): boolean {
  if (!plainText || plainText.length < 200) return false; // Skip very short text

  const lines = plainText.split('\n').filter(line => line.trim().length > 0);
  if (lines.length < 3) return false; // Need at least 3 lines for pattern detection

  // Count lines ending without sentence punctuation
  let nonPunctuationEndLines = 0;

  lines.forEach(line => {
    const trimmed = line.trim();
    // Count lines ending without sentence punctuation
    if (!/[.!?:;]$/.test(trimmed)) {
      nonPunctuationEndLines++;
    }
  });

  const nonPunctuationRatio = nonPunctuationEndLines / lines.length;

  console.log(`[PDF Analysis] Lines: ${lines.length}, NonPunctuation: ${(nonPunctuationRatio * 100).toFixed(1)}%`);

  // PDF indicator: most lines end without punctuation (artificial page-width breaks)
  const isPdf = nonPunctuationRatio > 0.55;

  console.log(`[PDF Analysis] Result: ${isPdf ? 'PDF DETECTED' : 'NOT PDF'} (threshold: nonPunct>55%)`);

  return isPdf;
}

/**
 * Analyzes clipboard items to determine paste context
 */
export function analyzePasteContext(clipboardItems: DataTransferItem[], plainTextContent?: string): PasteContext {
  const debugMode = true; // Set to true for debugging
  const debugLog = (message: string) => {
    if (debugMode) {
      console.log(`[PasteDetection] ${message}`);
    }
  };

  // Detect available formats
  const formats = clipboardItems.map(item => item.type);
  const hasHtml = formats.includes('text/html');
  const hasRtf = formats.includes('text/rtf');
  const hasPlain = formats.includes('text/plain');
  const formatCount = formats.length;

  debugLog(`Detected formats: [${formats.join(', ')}]`);

  // Determine source type based on format combination
  let sourceType: 'formatted' | 'plain' | 'mixed';
  let detectedSource: string;
  let formatLevel: FormatLevel;

  if (hasHtml && hasRtf && hasPlain && formatCount === 3) {
    // HTML + RTF + Plain = Word document (comprehensive clipboard support)
    sourceType = 'formatted';
    detectedSource = 'Word document (HTML+RTF+Plain)';
    formatLevel = 'RTF_HTML_Paste_Format';
    debugLog('Word document detected - MINIMAL formatting (paragraph spacing)');
  } else if (formatCount > 3) {
    // 4+ formats = Truly complex application with excessive clipboard data
    sourceType = 'mixed';
    detectedSource = 'Complex application with multiple formats';
    formatLevel = 'None';
    debugLog('Complex formats detected - NO formatting');
  } else if (hasHtml && hasPlain) {
    // HTML + Plain = Rich text source (Word, Google Docs, web pages)
    sourceType = 'formatted';
    detectedSource = 'Rich text application (Word/Google Docs/Web)';
    formatLevel = 'RTF_HTML_Paste_Format';
    debugLog('Rich text source detected - MINIMAL formatting (paragraph spacing)');
  } else if (hasRtf && hasPlain) {
    // RTF + Plain = Check if it's PDF-like content or genuine RTF
    if (plainTextContent && isPdfLikeContent(plainTextContent)) {
      // PDF viewer providing RTF format - treat as plain text that needs formatting
      sourceType = 'plain';
      detectedSource = 'PDF viewer (detected via content analysis)';
      formatLevel = 'PDF_Paste_Format';
      debugLog('PDF-like RTF content detected - FULL formatting');
    } else {
      // Genuine RTF source (some rich text editors)
      sourceType = 'formatted';
      detectedSource = 'RTF application';
      formatLevel = 'RTF_HTML_Paste_Format';
      debugLog('RTF source detected - MINIMAL formatting (paragraph spacing)');
    }
  } else if (hasPlain && !hasHtml && !hasRtf) {
    // Plain only = Raw text source (PDFs, plain text editors, terminal)
    sourceType = 'plain';
    detectedSource = 'Plain text source (PDF/Terminal/Text Editor)';
    formatLevel = 'PDF_Paste_Format';
    debugLog('Plain text source detected - FULL formatting');
  } else {
    // Fallback: treat as plain if we have any plain text
    sourceType = hasPlain ? 'plain' : 'mixed';
    detectedSource = 'Unknown source';
    formatLevel = hasPlain ? 'PDF_Paste_Format' : 'None';
    debugLog(`Fallback case - ${formatLevel} formatting`);
  }

  const context: PasteContext = {
    hasHtml,
    hasRtf,
    hasPlainOnly: hasPlain && !hasHtml && !hasRtf,
    sourceType,
    formatCount,
    formatLevel,
    detectedSource
  };

  debugLog(`Final decision: ${JSON.stringify(context, null, 2)}`);
  return context;
}

/**
 * Gets a user-friendly description of the detected source
 */
export function getSourceDescription(context: PasteContext): string {
  switch (context.sourceType) {
    case 'formatted':
      return context.hasHtml ? 'Word/HTML Detected' : 'RTF document';
    case 'plain':
      return 'Plain text';
    case 'mixed':
      return 'Mixed content';
    default:
      return 'Unknown source';
  }
}

/**
 * Determines what level of formatting should be applied based on context and user preference
 */
export function getFormattingLevel(
  context: PasteContext,
  userAutoFormatEnabled: boolean,
  userOverride?: boolean
): FormatLevel {
  // User override takes precedence
  if (userOverride !== undefined) {
    return userOverride ? 'PDF_Paste_Format' : 'None';
  }

  // If user has auto-format disabled, no formatting
  if (!userAutoFormatEnabled) {
    return 'None';
  }

  // Use intelligent detection
  return context.formatLevel;
}