/**
 * (Version B) Cleans up pasted text using a conservative 'Don't Join If...' model.
 * This approach respects all initial line breaks and only joins a line with the next
 * if there are no strong indicators that the next line starts a new paragraph.
 * 
 * @param text The raw text string to format.
 * @returns The formatted text with unwanted line breaks removed.
 */
export function formatPastedText(text: string): string {
  const debugMode = true;
  const debugLog = (message: string) => {
    if (debugMode) {
      console.log(message);
    }
  };

  debugLog(`--- Formatting Pasted Text ---`);
  debugLog(`Original text: ${text}`);

  const headerLabelRegex = /^(Attention|Email|By|In favour of|Date of deed poll):/i;
  const signatoryRegex = /^(Sucasa|Blackstone|Steve Askew|Sam Young)/i;
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  const markerRegex = /^\s*(\d+\.|\([a-z]\)|\(i+\)|\•|\-)\s+/;
  const indentRegex = /^\s{4,}/;
  const definitionRegex = /^\s*"/;
  const clauseHeadingRegex = /^\s*(\d+(\.\d+)*)\.?\s+[A-Z]/; // e.g., "1. Heading", "2.1 Sub-heading", or "3 Heading"
  const headerEndRegex = /^(Definitions|1\.\s+Definitions)/i;

  const lines = text.split('\n').filter(line => line.trim().length > 0);
  debugLog(`Split into lines: [${lines.join(', ')}]`);

  if (lines.length <= 1) {
    debugLog(`Returning original text due to <= 1 line: ${text}`);
    return text;
  }

  // Find the end of the header. First, look for an explicit marker. If not found, fall back to the first numbered clause.
  let headerEndIndex = lines.findIndex(line => headerEndRegex.test(line));
  if (headerEndIndex === -1) {
    headerEndIndex = lines.findIndex(line => /^\s*1\.?\s+[A-Z]/.test(line));
  }

  const isHeaderLine = (index: number): boolean => {
    // If no header boundary is found at all, assume the entire text is body content.
    if (headerEndIndex === -1) return false;
    return index < headerEndIndex;
  };

  const isParagraphStart = (line: string, originalPreviousLine: string, index: number, lines: string[]): boolean => {
    const trimmedLine = line.trim();
    const trimmedPrevLine = originalPreviousLine.trim();

    // --- Universal Party/Title Rules ---
    // Rule: Break if the PREVIOUS line was a document title (all caps).
    if (/^[A-Z\s&]+$/.test(trimmedPrevLine)) {
      debugLog(`    isParagraphStart: true, previous line was a title.`);
      return true;
    }

    // Rule: Handle 'Between' and the line that follows it.
    if (trimmedLine.toLowerCase() === 'between') {
        debugLog(`    isParagraphStart: true (Universal Rule), line is 'Between'.`);
        return true;
    }
    if (trimmedPrevLine.toLowerCase() === 'between') {
        debugLog(`    isParagraphStart: true (Universal Rule), for line after 'Between'.`);
        return true;
    }

    // Rule: Handle 'and' and the line that follows it, but only if surrounded by capitalized lines.
    const nextLine = (index + 1 < lines.length) ? lines[index + 1].trim() : null;
    if (trimmedLine.toLowerCase() === 'and' && /^[A-Z]/.test(trimmedPrevLine) && nextLine && /^[A-Z]/.test(nextLine)) {
        debugLog(`    isParagraphStart: true (Universal Rule), for 'and' between capitalized lines.`);
        return true;
    }
    const prevPrevLine = (index > 1) ? lines[index - 2].trim() : null;
    if (trimmedPrevLine.toLowerCase() === 'and' && /^[A-Z]/.test(trimmedLine) && prevPrevLine && /^[A-Z]/.test(prevPrevLine)) {
        debugLog(`    isParagraphStart: true (Universal Rule), for capitalized line after qualifying 'and'.`);
        return true;
    }

    // --- Universal Structural Rules ---
    if (markerRegex.test(line) || indentRegex.test(line) || definitionRegex.test(trimmedLine)) {
      debugLog(`    isParagraphStart: true (Universal Rule) for line "${trimmedLine}"`);
      return true;
    }

    // --- Header-Specific Rules (for things that ONLY happen in headers) ---
    if (isHeaderLine(index)) {
      // Rule: Break if the PREVIOUS line ended with a sign-off like (Discloser).
      if (/\([A-Za-z]+\)$/.test(trimmedPrevLine)) {
        debugLog(`    isParagraphStart: true (Header Rule), previous line ended with sign-off.`);
        return true;
      }
      // Rule: Break if the CURRENT line is a label, name, or email.
      if (headerLabelRegex.test(trimmedLine) || signatoryRegex.test(trimmedLine) || emailRegex.test(trimmedLine)) {
        debugLog(`    isParagraphStart: true (Header Rule) for label/signatory/email: "${trimmedLine}"`);
        return true;
      }
    }

    // --- Body-Specific Rules ---
    // Rule: A clause heading always starts a new paragraph.
    if (clauseHeadingRegex.test(trimmedLine)) {
      debugLog(`    isParagraphStart: true, current line is a clause heading.`);
      return true;
    }
    // Rule: Break if the PREVIOUS line was a numbered clause heading.
    if (clauseHeadingRegex.test(trimmedPrevLine)) {
      debugLog(`    isParagraphStart: true, previous line was a clause heading.`);
      return true;
    }

    return false;
  };

  const shouldContinue = (prevParagraph: string, currentLine: string): boolean => {
    const trimmedPrev = prevParagraph.trim();
    const trimmedCurr = currentLine.trim();

    // Rule 1: Do NOT join if the current line starts with an uppercase letter and the previous line ends with a period.
    // This prevents joining what appear to be new sentences.
    if (/^\p{Lu}/u.test(trimmedCurr) && trimmedPrev.endsWith('.')) {
      debugLog(`      shouldContinue: false, current line starts with uppercase and previous ends with period.`);
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
    if (!/[.!?]$/.test(trimmedPrev)) {
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

    if (isParagraphStart(currentLine, originalPreviousLine, i, lines)) {
      // It's a definite paragraph start, so break.
      reconstructedLines.push(currentParagraph);
      currentParagraph = currentLine;
      debugLog(`  -> New paragraph (isParagraphStart): "${currentLine}"`);
    } else if (shouldContinue(currentParagraph, currentLine)) {
      // It's not a start, but it is a continuation, so join.
      currentParagraph += ' ' + currentLine.trim();
      debugLog(`  -> Joining line: "${currentLine}"`);
    } else {
      // Default: Not a start, not a continuation. It's a new paragraph.
      reconstructedLines.push(currentParagraph);
      currentParagraph = currentLine;
      debugLog(`  -> New paragraph (default): "${currentLine}"`);
    }
  }

  reconstructedLines.push(currentParagraph);

  // Join with double newlines for paragraph breaks, but single for header party sections.
  const finalOutput = reconstructedLines.join('\n\n');
  debugLog(`Final output: ${finalOutput}`);
  return finalOutput;
}