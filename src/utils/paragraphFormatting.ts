/**
 * (Version B) Cleans up pasted text using a conservative 'Don't Join If...' model.
 * This approach respects all initial line breaks and only joins a line with the next
 * if there are no strong indicators that the next line starts a new paragraph.
 * 
 * @param text The raw text string to format.
 * @returns The formatted text with unwanted line breaks removed.
 */
export function formatPastedText(text: string): string {
  if (!text) {
    return '';
  }

  const lines = text.replace(/\r\n|\r/g, '\n').split('\n');
  if (lines.length <= 1) {
    return text;
  }

  // Debug mode
  const debug = true;
  const debugLog = debug ? console.log : () => {};

  debugLog('--- Formatting Pasted Text ---');
  debugLog('Original text:', text);
  debugLog('Split into lines:', lines);

  // Define all heuristics for what marks the start of a new paragraph.
  const markerRegex = /^(?:\d+(?:\.\d+)*\.?|\([a-zA-Z0-9]+\)|[\*\-•])\s+/;
  const indentRegex = /^(?:\s{3,}|\t)/;
  const definitionRegex = /^[A-Z][A-Za-z\s]*\s(?:means|has the meaning)/;
  const signpostKeywords = [
    'WHEREAS',
    'NOW, THEREFORE,',
    'IN WITNESS WHEREOF',
    'FURTHERMORE',
    'PROVIDED THAT',
    'HENCEFORTH',
    'NOTWITHSTANDING',
    'BE IT RESOLVED',
    // Contract header specific
    'BETWEEN',
    'AND',
    'PARTIES',
    'AGREEMENT',
    'CONFIDENTIALITY',
    'EFFECTIVE DATE',
    'collectively referred to as',
    'hereinafter'
  ];
  const signpostRegex = new RegExp(`^(${signpostKeywords.join('|')})`, 'i');

  // Enhanced regexes for legal contract elements
  const enhancedAddressRegex = /^(?:\d+[A-Za-z]*\b\s*[A-Za-z]*,?\s*)+/;
  const emailRegex = /^\S+@\S+\.\S+$/;
  const nameRegex = /^[A-Z][a-z]+ [A-Z][a-z]+$/;
  const dateClauseRegex = /\b(?:Date|Dated)\s+of\b/i;

  // Header detection with end marker
  const headerEndRegex = /Date of deed poll:|Effective Date:/i;
  let headerEndIndex = -1;
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    if (headerEndRegex.test(lines[i])) {
      headerEndIndex = i;
      break;
    }
  }
  const isHeaderLine = (index: number) => 
    headerEndIndex === -1 ? index < 20 : index <= headerEndIndex;

  const isParagraphStart = (line: string): boolean => {
    // Check for all-caps lines (like titles)
    if (/^[A-Z\s]{2,}$/.test(line.trim())) {
      debugLog('    isParagraphStart: all-caps title');
      return true;
    }
    const result = (
      markerRegex.test(line) ||
      indentRegex.test(line) ||
      signpostRegex.test(line) ||
      definitionRegex.test(line) ||
      enhancedAddressRegex.test(line.trim()) ||
      emailRegex.test(line.trim()) ||
      nameRegex.test(line) ||
      dateClauseRegex.test(line)
    );
    if (result) {
      debugLog(`    isParagraphStart: true for line "${line}"`);
    }
    return result;
  };

  const reconstructedLines: string[] = [];
  let currentParagraph = lines[0];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    const previousLine = lines[i - 1];

    debugLog('\nProcessing line', i, ':', currentLine);
    debugLog('Current paragraph:', currentParagraph);

    // Special handling rules only apply in header
    if (isHeaderLine(i)) {
      // Special handling for address lines
      if (enhancedAddressRegex.test(previousLine.trim()) && enhancedAddressRegex.test(currentLine.trim())) {
        debugLog('  -> Address lines joined');
        currentParagraph += ' ' + currentLine.trim();
        continue;
      }

      // Special handling for standalone emails
      if (emailRegex.test(currentLine.trim())) {
        debugLog('  -> Email detected, starting new paragraph');
        reconstructedLines.push(currentParagraph);
        currentParagraph = currentLine.trim();
        continue;
      }
    }

    // Improved joining logic: join if not a hard break and the line appears to be a continuation
    const isHardBreak = (
      previousLine.trim().endsWith('.') ||
      previousLine.trim().endsWith(':') ||
      previousLine.trim().endsWith(';') ||
      isParagraphStart(currentLine)
    );

    if (!isHardBreak) {
      let isContinuation = false;
      
      if (isHeaderLine(i)) {
        // Special header joining rules: join address and email lines
        isContinuation = enhancedAddressRegex.test(currentLine.trim()) || emailRegex.test(currentLine.trim());
      } else {
        // Body joining rules: join clauses and lowercase starters
        isContinuation = 
          !/^[A-Z]/.test(currentLine.trim()) || 
          /^\s*\(\w+\)/.test(currentLine.trim()) ||
          /^[a-z]/.test(currentLine.trim()) ||
          /[a-z0-9,]$/.test(previousLine.trim());
      }
      
      if (isContinuation) {
        debugLog('  -> Soft break, joining lines');
        currentParagraph += ' ' + currentLine.trim();
        continue;
      }
    }

    debugLog('  -> Hard break (punctuation or paragraph start)');
    reconstructedLines.push(currentParagraph);
    currentParagraph = currentLine;
  }
  // Add the last paragraph
  reconstructedLines.push(currentParagraph);

  const result = reconstructedLines.join('\n\n').replace(/\n\n\s*\n\n/g, '\n\n'); // Clean up excess newlines
  debugLog('Formatted result:', result);
  return result;
}
