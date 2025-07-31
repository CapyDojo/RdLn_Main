/**
 * Smart PDF-aware paragraph formatter using short-line detection
 * 
 * Two-question framework:
 * 1. Is this line break from PDF wrapping? -> shouldContinue() handles joining
 * 2. Is this line break intentionally structural? -> Short-line rule preserves breaks
 */

/**
 * Detects if text contains Chinese characters
 */
function containsChinese(text: string): boolean {
  // Unicode ranges for CJK characters
  return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(text);
}

/**
 * Detects if text contains Japanese characters
 */
function containsJapanese(text: string): boolean {
  // Hiragana, Katakana ranges
  return /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
}

/**
 * Detects if text contains Korean characters
 */
function containsKorean(text: string): boolean {
  // Hangul syllables
  return /[\uac00-\ud7af]/.test(text);
}

/**
 * Detects if text contains CJK (Chinese, Japanese, Korean) characters
 */
function containsCJK(text: string): boolean {
  return containsChinese(text) || containsJapanese(text) || containsKorean(text);
}

/**
 * Counts content units (words for European languages, characters for CJK)
 */
function countContentUnits(line: string): number {
  const trimmed = line.trim();
  if (containsCJK(trimmed)) {
    // For CJK: count characters, excluding punctuation and spaces
    return trimmed.replace(/[\s\u3000-\u303f\uff00-\uffef]/g, '').length;
  } else {
    // For European languages: count words
    return trimmed.split(/\s+/).length;
  }
}

/**
 * Minimal formatting for RTF/HTML pastes - just adds extra paragraph spacing
 */
export function formatRtfHtmlPaste(text: string): string {
  // Split into lines, normalize whitespace-only lines to empty, then rejoin
  // This preserves the count of blank lines while treating whitespace-only lines as truly empty
  const lines = text.split('\n');
  const normalizedLines = lines.map(line => line.trim() === '' ? '' : line);
  const normalizedText = normalizedLines.join('\n');
  
  // Replace single line breaks with double line breaks for better visual separation
  // But preserve any existing double (or more) line breaks completely unchanged
  return normalizedText.replace(/(?<!\n)\n(?!\n)/g, '\n\n');
}

export function formatPastedText(text: string): string {
  const debugMode = false;
  const debugLog = (message: string) => {
    if (debugMode) {
      console.log(message);
    }
  };

  debugLog(`--- Smart PDF Formatting ---`);
  debugLog(`Original text: ${text}`);

  const lines = text.split('\n').filter(line => line.trim().length > 0);
  debugLog(`Split into lines: [${lines.join(', ')}]`);

  if (lines.length <= 1) {
    debugLog(`Returning original text due to <= 1 line: ${text}`);
    return text;
  }

  debugLog(`Using pure language detection thresholds (CJK: 30 chars, European: 5 words)`);

  /**
   * Determines language threshold for a line
   */
  const getLanguageThreshold = (line: string): number => {
    if (containsCJK(line)) return 30;      // CJK (Chinese, Japanese, Korean)
    return 5;                              // European languages (English, French, German, Spanish)
  };

  const isShortLine = (line: string): boolean => {
    const contentUnits = countContentUnits(line);
    const threshold = getLanguageThreshold(line);
    const isShort = contentUnits <= threshold;
    debugLog(`  Line "${line.trim()}" has ${contentUnits} units (threshold: ${threshold}) - ${isShort ? 'SHORT' : 'NORMAL'}`);
    return isShort;
  };

  const shouldContinue = (prevParagraph: string, currentLine: string): boolean => {
    const trimmedPrev = prevParagraph.trim();
    const trimmedCurr = currentLine.trim();

    // Rule 1: Do NOT join if the previous line ends with semantic breaks (European + CJK).
    if (/[.!?:;。！？：；]$/.test(trimmedPrev) || 
        /:-\s*$/.test(trimmedPrev) || 
        /:\s*-\s*$/.test(trimmedPrev) || 
        /;\s*or\s*$/.test(trimmedPrev) || 
        /;\s*and\s*$/.test(trimmedPrev)) {
      debugLog(`      shouldContinue: false, previous line ends with semantic break punctuation.`);
      return false;
    }

    // Rule 2: Join if the previous line ends with a hyphen (indicating a broken word).
    if (trimmedPrev.endsWith('-')) {
      debugLog(`      shouldContinue: true, previous line ends with hyphen.`);
      return true;
    }

    // Rule 3: Join if the current line starts with a lowercase letter (European languages only).
    if (/^\p{Ll}/u.test(trimmedCurr) && !containsCJK(trimmedCurr)) {
      debugLog(`      shouldContinue: true, starts with lowercase.`);
      return true;
    }
    
    // Rule 3b: For CJK text, join if previous line doesn't end with CJK punctuation
    if (containsCJK(trimmedPrev) && !(/[。！？：；]$/.test(trimmedPrev))) {
      debugLog(`      shouldContinue: true, CJK text without ending punctuation.`);
      return true;
    }

    // Rule 4: Join if the previous line does NOT end in sentence-ending punctuation (European + CJK).
    if (!/[.!?:;。！？：；]$/.test(trimmedPrev) && 
        !/:-\s*$/.test(trimmedPrev) && 
        !/:\s*-\s*$/.test(trimmedPrev) && 
        !/;\s*or\s*$/.test(trimmedPrev) && 
        !/;\s*and\s*$/.test(trimmedPrev)) {
      debugLog(`      shouldContinue: true, previous line does not end with sentence-ending punctuation.`);
      return true;
    }

    return false;
  };

  let reconstructedLines: string[] = [];
  let currentParagraph = lines[0];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    const originalPreviousLine = lines[i - 1];

    // NEW FRAMEWORK: Check if previous line is short (structural element)
    if (isShortLine(originalPreviousLine)) {
      // Short lines indicate structural breaks - preserve the break
      reconstructedLines.push(currentParagraph);
      currentParagraph = currentLine;
      debugLog(`  -> New paragraph (short previous line): "${currentLine}"`);
    } else if (shouldContinue(currentParagraph, currentLine)) {
      // Previous line was normal length - use existing PDF wrapping logic
      // Use space separator unless both lines are purely CJK
      const prevPureCJK = containsCJK(currentParagraph) && !/[a-zA-Z]/.test(currentParagraph);
      const currPureCJK = containsCJK(currentLine) && !/[a-zA-Z]/.test(currentLine);
      const separator = prevPureCJK && currPureCJK ? '' : ' ';
      currentParagraph += separator + currentLine.trim();
      debugLog(`  -> Joining line: "${currentLine}"`);
    } else {
      // shouldContinue said no - start new paragraph
      reconstructedLines.push(currentParagraph);
      currentParagraph = currentLine;
      debugLog(`  -> New paragraph (shouldContinue=false): "${currentLine}"`);
    }
  }

  reconstructedLines.push(currentParagraph);

  const finalOutput = reconstructedLines.join('\n\n');
  debugLog(`Final output: ${finalOutput}`);
  return finalOutput;
}