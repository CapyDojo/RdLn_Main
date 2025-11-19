/**
 * Cleans up pasted text, particularly from sources like PDFs, by intelligently
 * removing single line breaks within paragraphs while preserving intentional paragraph breaks.
 * 
 * @param text The raw text string to format.
 * @returns The formatted text with unwanted line breaks removed.
 */
export const reconstructParagraphs_A = (text: string): string => {
  if (!text) {
    return '';
  }

  // First, handle definitions globally, as they can be buried mid-paragraph after a paste.
  // This regex looks for a capitalized term followed by 'means' or 'has the meaning'.
  const definitionRegex = /([A-Z][A-Za-z\s]*\s(?:means|has the meaning))/g;
  const processedText = text.replace(definitionRegex, '\n\n$1');

  // Now, process line-by-line for structural markers and keywords.
  const markerRegex = /^(?:\d+(?:\.\d+)*\.?|\([a-zA-Z0-9]+\)|[\*\-•])\s+/;
  const indentRegex = /^(?:\s{3,}|\t)/;
  const signpostKeywords = [
    'WHEREAS',
    'NOW, THEREFORE,',
    'IN WITNESS WHEREOF',
    'FURTHERMORE',
    'PROVIDED THAT',
    'HENCEFORTH',
    'NOTWITHSTANDING',
    'BE IT RESOLVED',
  ];
  const signpostRegex = new RegExp(`^(${signpostKeywords.join('|')})`, 'i');

  const lines = processedText.split('\n');
  if (lines.length <= 1) {
    return processedText;
  }

  // Re-join lines that are not paragraph starts.
  // We start with the first line and decide whether to join subsequent lines to it.
  const reconstructedLines = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].trim();
    if (currentLine === '') {
        reconstructedLines.push(''); // Preserve empty lines
        continue;
    }

    if (
      markerRegex.test(currentLine) ||
      indentRegex.test(currentLine) ||
      signpostRegex.test(currentLine)
    ) {
      reconstructedLines.push(currentLine); // This is a new paragraph
    } else {
      // This is not a new paragraph, so join it to the previous line.
      const lastLine = reconstructedLines[reconstructedLines.length - 1];
      if (lastLine !== '') {
        reconstructedLines[reconstructedLines.length - 1] = lastLine + ' ' + currentLine;
      } else {
        reconstructedLines.push(currentLine);
      }
    }
  }

  return reconstructedLines.join('\n\n');
};

/**
 * Cleans up pasted text, particularly from sources like PDFs, by intelligently
 * removing single line breaks within paragraphs while preserving intentional paragraph breaks.
 * 
 * @param text The raw text string to format.
 * @returns The formatted text with unwanted line breaks removed.
 */
export function formatPastedText_A(text: string): string {
  if (!text) {
    return '';
  }

  // 1. Normalize all line endings to a single newline character.
  let processedText = text.replace(/\r\n|\r/g, '\n');

  // 2. Mark Hard Breaks: Find all lines that start with a list marker or numbered heading and protect them with a placeholder.
  // This is the most reliable signal for a structural break in the document.
  processedText = processedText.replace(/(\n)(?=\s*(\(\w+\)|\d+\s*\w+))/g, '%%HARD_BREAK%%');

  // 3. Clean Soft Breaks: Now that hard breaks are protected, replace all remaining single newlines with a space.
  // This safely joins lines within paragraphs and in the title block.
  processedText = processedText.replace(/\n/g, ' ');

  // 4. Restore Hard Breaks: Replace the placeholder with a proper newline character.
  processedText = processedText.replace(/%%HARD_BREAK%%/g, '\n');

  return processedText.trim();
}
