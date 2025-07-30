/**
 * Smart PDF-aware paragraph formatter using short-line detection
 * 
 * Two-question framework:
 * 1. Is this line break from PDF wrapping? -> shouldContinue() handles joining
 * 2. Is this line break intentionally structural? -> Short-line rule preserves breaks
 */

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

  // Calculate average line length for statistical threshold
  const wordCounts = lines.map(line => line.trim().split(/\s+/).length);
  const averageWordCount = wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length;
  const shortLineThreshold = Math.max(5, Math.floor(averageWordCount * 0.5));
  
  debugLog(`Average words per line: ${averageWordCount.toFixed(1)}`);
  debugLog(`Short line threshold: ${shortLineThreshold} words`);

  const isShortLine = (line: string): boolean => {
    const wordCount = line.trim().split(/\s+/).length;
    const isShort = wordCount <= 5 || wordCount <= shortLineThreshold;
    debugLog(`  Line "${line.trim()}" has ${wordCount} words - ${isShort ? 'SHORT' : 'NORMAL'}`);
    return isShort;
  };

  const shouldContinue = (prevParagraph: string, currentLine: string): boolean => {
    const trimmedPrev = prevParagraph.trim();
    const trimmedCurr = currentLine.trim();

    // Rule 1: Do NOT join if the previous line ends with semantic breaks.
    if (/[.!?:;]$/.test(trimmedPrev) || 
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

    // Rule 3: Join if the current line starts with a lowercase letter.
    if (/^\p{Ll}/u.test(trimmedCurr)) {
      debugLog(`      shouldContinue: true, starts with lowercase.`);
      return true;
    }

    // Rule 4: Join if the previous line does NOT end in sentence-ending punctuation.
    if (!/[.!?:;]$/.test(trimmedPrev) && 
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
      currentParagraph += ' ' + currentLine.trim();
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