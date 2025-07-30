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
 * Counts content units (words for English, characters for Chinese)
 */
function countContentUnits(line: string): number {
  const trimmed = line.trim();
  if (containsChinese(trimmed)) {
    // For Chinese: count characters, excluding punctuation and spaces
    return trimmed.replace(/[\s\u3000-\u303f\uff00-\uffef]/g, '').length;
  } else {
    // For English: count words
    return trimmed.split(/\s+/).length;
  }
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

  // Calculate average line length for statistical threshold using language-aware counting
  const contentUnitCounts = lines.map(line => countContentUnits(line));
  const averageContentUnits = contentUnitCounts.reduce((sum, count) => sum + count, 0) / contentUnitCounts.length;
  const hasChineseContent = lines.some(line => containsChinese(line));
  
  // Adjust thresholds based on content type
  const baseThreshold = hasChineseContent ? 30 : 5; // Chinese: 30 chars, English: 5 words
  const shortLineThreshold = Math.max(baseThreshold, Math.floor(averageContentUnits * 0.3)); // Lower percentage for Chinese
  
  debugLog(`Average content units per line: ${averageContentUnits.toFixed(1)} (Chinese: ${hasChineseContent})`);
  debugLog(`Short line threshold: ${shortLineThreshold} units`);

  const isShortLine = (line: string): boolean => {
    const contentUnits = countContentUnits(line);
    // Use line-specific threshold: if this line has Chinese, use Chinese threshold; otherwise English
    const lineThreshold = containsChinese(line) ? 
      Math.max(30, Math.floor(averageContentUnits * 0.3)) : 
      Math.max(5, Math.floor(averageContentUnits * 0.5));
    const isShort = contentUnits <= lineThreshold;
    debugLog(`  Line "${line.trim()}" has ${contentUnits} units (${containsChinese(line) ? 'Chinese' : 'English'} threshold: ${lineThreshold}) - ${isShort ? 'SHORT' : 'NORMAL'}`);
    return isShort;
  };

  const shouldContinue = (prevParagraph: string, currentLine: string): boolean => {
    const trimmedPrev = prevParagraph.trim();
    const trimmedCurr = currentLine.trim();

    // Rule 1: Do NOT join if the previous line ends with semantic breaks (English + Chinese).
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

    // Rule 3: Join if the current line starts with a lowercase letter (English only).
    if (/^\p{Ll}/u.test(trimmedCurr) && !containsChinese(trimmedCurr)) {
      debugLog(`      shouldContinue: true, starts with lowercase.`);
      return true;
    }
    
    // Rule 3b: For Chinese text, join if previous line doesn't end with Chinese punctuation
    if (containsChinese(trimmedPrev) && !(/[。！？：；]$/.test(trimmedPrev))) {
      debugLog(`      shouldContinue: true, Chinese text without ending punctuation.`);
      return true;
    }

    // Rule 4: Join if the previous line does NOT end in sentence-ending punctuation (English + Chinese).
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
      // Use space separator unless both lines are purely Chinese
      const prevPureChinese = containsChinese(currentParagraph) && !/[a-zA-Z]/.test(currentParagraph);
      const currPureChinese = containsChinese(currentLine) && !/[a-zA-Z]/.test(currentLine);
      const separator = prevPureChinese && currPureChinese ? '' : ' ';
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