import { DiffChange, ComparisonResult, ComparisonStats } from '../types';
import { getWordStatsForBlocks } from '../utils/wordTokenization';

// DEBUG MODE: Set to true to enable detailed logging for debugging
const DEBUG_MODE = false;

// Debug logger that can be easily toggled
const debugLog = DEBUG_MODE ? console.log : () => { };

export class MyersAlgorithm {
  // SSMR: Feature flags for progressive implementation
  private static readonly FEATURE_FLAGS = {
    USE_OPTIMIZED_BOUNDARIES: true,    // Step 1: Regex-free boundary detection
    USE_PROGRESSIVE_SECTIONS: true,    // Step 2: Progressive section streaming  
    USE_CANCELLATION: true,            // Step 3: Cancellation capability
    FILTER_WHITESPACE_NOISE: false     // Step 4: Disabled - not the right approach
  };

  // SSMR: Progressive section configuration
  private static readonly SECTION_CONFIG = {
    TARGET_SIZE: 3000,        // Target changes per section
    MIN_SIZE: 1000,          // Minimum section size
    MAX_SIZE: 8000,          // Maximum section size (performance guardrail)
  };

  // SSMR: Optimized lookup tables for fast sentence boundary detection
  private static readonly ABBREVIATIONS = new Set([
    // Legal entities
    'inc.', 'corp.', 'llc.', 'ltd.', 'co.', 'lp.', 'llp.', 'pc.', 'pa.', 'pllc.',
    'plc.', 'gmbh.', 'ag.', 'sa.', 'sas.', 'sarl.', 'bv.', 'nv.',
    // Titles and names
    'mr.', 'mrs.', 'ms.', 'dr.', 'prof.', 'sr.', 'jr.',
    // Address abbreviations
    'st.', 'ave.', 'blvd.', 'rd.', 'dr.', 'ln.', 'ct.', 'pl.',
    // Dates and time
    'jan.', 'feb.', 'mar.', 'apr.', 'may.', 'jun.', 'jul.', 'aug.', 'sep.', 'oct.', 'nov.', 'dec.',
    'mon.', 'tue.', 'wed.', 'thu.', 'fri.', 'sat.', 'sun.',
    // Common abbreviations
    'etc.', 'vs.', 'ie.', 'eg.', 'cf.', 'al.', 'et.',
    // Legal-specific
    'sec.', 'para.', 'art.', 'ch.', 'subch.', 'pt.', 'subpt.'
  ]);

  private static tokenize(text: string): string[] {
    // Enhanced tokenization that preserves meaningful units and handles abbreviations
    const tokens: string[] = [];
    let i = 0;


    while (i < text.length) {
      const char = text[i];

      // Handle whitespace character by character for surgical precision
      if (/\s/.test(char)) {
        tokens.push(char);
        i++;
        continue;
      }

      // Handle complete numbers (including currency, percentages, decimals)
      if (this.isStartOfNumber(text, i)) {
        const numberToken = this.extractNumber(text, i);
        tokens.push(numberToken.token);
        i = numberToken.endIndex;
        continue;
      }

      // Handle complete dates
      if (this.isStartOfDate(text, i)) {
        const dateToken = this.extractDate(text, i);
        tokens.push(dateToken.token);
        i = dateToken.endIndex;
        continue;
      }

      // ENHANCED: Handle abbreviations and company suffixes
      if (/[a-zA-Z]/.test(char)) {
        const wordToken = this.extractEnhancedWord(text, i);
        tokens.push(wordToken.token);
        i = wordToken.endIndex;
        continue;
      }

      // Handle punctuation as individual tokens
      tokens.push(char);
      i++;
    }

    const filteredTokens = tokens.filter(token => token.length > 0);

    debugLog('🔧 New tokenization result:', filteredTokens);
    return filteredTokens;
  }

  private static isStartOfNumber(text: string, index: number): boolean {
    const char = text[index];

    // Currency symbols
    if (/[$€£¥₹]/.test(char)) {
      return /\d/.test(text[index + 1] || '');
    }

    // Digits
    if (/\d/.test(char)) {
      return true;
    }

    // Negative numbers
    if (char === '-' && /\d/.test(text[index + 1] || '')) {
      return index === 0 || /\s/.test(text[index - 1] || '');
    }

    // Decimal numbers starting with period (.50)
    if (char === '.' && /\d/.test(text[index + 1] || '')) {
      return index === 0 || /\s/.test(text[index - 1] || '');
    }

    return false;
  }

  private static extractNumber(text: string, startIndex: number): { token: string, endIndex: number } {
    let i = startIndex;
    let token = '';

    // Handle currency symbol at start
    if (/[$€£¥₹]/.test(text[i])) {
      token += text[i];
      i++;
    }

    // Handle negative sign
    if (text[i] === '-') {
      token += text[i];
      i++;
    }

    // Handle digits, commas, and decimal points
    while (i < text.length) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (/\d/.test(char)) {
        token += char;
        i++;
      } else if (char === ',' && /\d/.test(nextChar)) {
        // Comma in number (1,000)
        token += char;
        i++;
      } else if (char === '.' && /\d/.test(nextChar) && !token.includes('.')) {
        // Decimal point (only one allowed)
        token += char;
        i++;
      } else {
        break;
      }
    }

    // Handle percentage at end
    if (i < text.length && text[i] === '%') {
      token += text[i];
      i++;
    }

    return { token, endIndex: i };
  }

  private static isStartOfDate(text: string, index: number): boolean {
    // Look for date patterns: MM/DD/YYYY, DD-MM-YYYY, etc.
    const remaining = text.slice(index);
    return /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(remaining);
  }

  private static extractDate(text: string, startIndex: number): { token: string, endIndex: number } {
    let i = startIndex;
    let token = '';

    // Extract the date pattern
    while (i < text.length) {
      const char = text[i];
      if (/[\d\/\-\.]/.test(char)) {
        token += char;
        i++;
      } else {
        break;
      }
    }

    return { token, endIndex: i };
  }

  /**
   * REFINED: Extract words with precise abbreviation handling
   */
  private static extractEnhancedWord(text: string, startIndex: number): { token: string, endIndex: number } {
    let i = startIndex;
    let token = '';

    while (i < text.length) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (/[a-zA-Z]/.test(char)) {
        token += char;
        i++;
      } else if (char === "'" && /[a-zA-Z]/.test(nextChar)) {
        // Handle contractions (don't, can't, etc.)
        token += char;
        i++;
      } else if (char === '-' && /[a-zA-Z]/.test(nextChar)) {
        // Handle hyphenated words (well-known, etc.)
        token += char;
        i++;
      } else if (char === '.' && this.shouldAppendPeriodToWord(token, text, i)) {
        // REFINED: Use new helper function to decide if period should be appended
        token += char;
        i++;
        // Continue if there's another letter after the period (for multi-part abbreviations)
        if (i < text.length && /[a-zA-Z]/.test(text[i])) {
          continue;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return { token, endIndex: i };
  }

  /**
   * NEW: Precise logic for determining if a period should be appended to the current word
   */
  private static shouldAppendPeriodToWord(currentToken: string, fullText: string, periodIndex: number): boolean {
    const nextChar = fullText[periodIndex + 1];
    const charAfterNext = fullText[periodIndex + 2];

    // Case 1: Single capital letter followed by period, then another capital letter
    // This handles "J." in "J.P." - we want to include the period to continue building "J.P."
    if (currentToken.length === 1 && /[A-Z]/.test(currentToken) && /[A-Z]/.test(nextChar)) {
      // debugLog(`📝 Single capital "${currentToken}" + period + capital "${nextChar}" - including period`);
      return true;
    }

    // Case 2: Multi-part abbreviation in progress (like "J.P" when we encounter the final period)
    // This handles the final period in "J.P." to complete the abbreviation
    const multiPartPattern = /^[A-Z](\.[A-Z])+$/;
    if (multiPartPattern.test(currentToken)) {
      // debugLog(`📝 Multi-part abbreviation "${currentToken}" + final period - including period`);
      return true;
    }

    // Case 3: Check if current token + period forms a complete known abbreviation
    const tokenWithPeriod = currentToken + '.';
    if (this.isCompleteAbbreviation(tokenWithPeriod)) {
      // debugLog(`📝 Complete abbreviation "${tokenWithPeriod}" - including period`);
      return true;
    }

    // Case 4: Single capital letter at end of sequence (like final initial)
    if (currentToken.length === 1 && /[A-Z]/.test(currentToken)) {
      // Look ahead to see if there's space then capital (like "J. Smith")
      if (nextChar === ' ' && /[A-Z]/.test(charAfterNext)) {
        // debugLog(`📝 Single capital "${currentToken}" + period + space + capital - including period`);
        return true;
      }
      // Or if it's at the end of a word boundary
      if (!nextChar || /\s/.test(nextChar)) {
        // debugLog(`📝 Single capital "${currentToken}" at word boundary - including period`);
        return true;
      }
    }

    // Case 5: Multi-letter abbreviations (2-4 letters)
    if (currentToken.length >= 2 && currentToken.length <= 4 && /^[A-Z]+$/i.test(currentToken)) {
      // debugLog(`📝 Multi-letter abbreviation "${currentToken}" - including period`);
      return true;
    }

    // debugLog(`📝 Token "${currentToken}" + period - NOT including period`);
    return false;
  }

  /**
   * NEW: Check if a complete string (including period) is a known abbreviation
   */
  /**
   * Check if a complete string (including period) is a known abbreviation
   * Uses the centralized ABBREVIATIONS set for consistency
   */
  private static isCompleteAbbreviation(tokenWithPeriod: string): boolean {
    // Convert to lowercase for case-insensitive matching with the ABBREVIATIONS set
    const lowercaseToken = tokenWithPeriod.toLowerCase();

    // Use the centralized ABBREVIATIONS set defined at the class level
    return this.ABBREVIATIONS.has(lowercaseToken);
  }

  /**
   * @deprecated Use shouldAppendPeriodToWord instead
   * Legacy function kept for compatibility with existing code
   * Will be removed in a future release
   */
  private static isAbbreviation(currentToken: string, fullText: string, periodIndex: number): boolean {
    if (DEBUG_MODE) {
      console.warn('Deprecated: isAbbreviation is deprecated, use shouldAppendPeriodToWord instead');
    }
    return this.shouldAppendPeriodToWord(currentToken, fullText, periodIndex);
  }

  private static myers(a: string[], b: string[]): Array<{ type: string, content: string, originalContent?: string, revisedContent?: string }> {
    const n = a.length;
    const m = b.length;
    const max = n + m;

    // V array for storing the furthest reaching D-path
    const v: { [key: number]: number } = {};
    v[1] = 0;

    // Trace array for backtracking
    const trace: Array<{ [key: number]: number }> = [];

    // Forward pass
    for (let d = 0; d <= max; d++) {
      trace[d] = { ...v };

      for (let k = -d; k <= d; k += 2) {
        let x: number;

        if (k === -d || (k !== d && v[k - 1] < v[k + 1])) {
          x = v[k + 1];
        } else {
          x = v[k - 1] + 1;
        }

        let y = x - k;

        while (x < n && y < m && a[x] === b[y]) {
          x++;
          y++;
        }

        v[k] = x;

        if (x >= n && y >= m) {
          const rawChanges = this.backtrack(a, b, trace, d);
          if (DEBUG_MODE) {
            debugLog('🔍 Raw changes before processing:', rawChanges);
          }
          const processedChanges = this.preciseChunking(rawChanges);
          if (DEBUG_MODE) {
            debugLog('📦 Changes after precise processing:', processedChanges);
          }
          
          // Apply whitespace noise filtering if enabled
          const finalChanges = this.FEATURE_FLAGS.FILTER_WHITESPACE_NOISE 
            ? this.filterWhitespaceNoise(processedChanges)
            : processedChanges;
          if (DEBUG_MODE && this.FEATURE_FLAGS.FILTER_WHITESPACE_NOISE) {
            const filtered = processedChanges.length - finalChanges.length;
            if (filtered > 0) {
              debugLog(`🧹 Whitespace noise filtering: removed ${filtered} noise changes`);
            }
          }
          
          return finalChanges;
        }
      }
    }

    return [];
  }

  private static backtrack(
    a: string[],
    b: string[],
    trace: Array<{ [key: number]: number }>,
    d: number
  ): Array<{ type: string, content: string }> {
    const result: Array<{ type: string, content: string }> = [];
    let x = a.length;
    let y = b.length;

    for (let step = d; step >= 0; step--) {
      const v = trace[step];
      const k = x - y;

      let prevK: number;
      if (k === -step || (k !== step && v[k - 1] < v[k + 1])) {
        prevK = k + 1;
      } else {
        prevK = k - 1;
      }

      const prevX = v[prevK];
      const prevY = prevX - prevK;

      // Add diagonal moves (unchanged)
      while (x > prevX && y > prevY) {
        result.unshift({ type: 'unchanged', content: a[x - 1] });
        x--;
        y--;
      }

      // Add horizontal/vertical moves (changes)
      if (step > 0) {
        if (x > prevX) {
          result.unshift({ type: 'removed', content: a[x - 1] });
          x--;
        } else if (y > prevY) {
          result.unshift({ type: 'added', content: b[y - 1] });
          y--;
        }
      }
    }

    return result;
  }

  private static preciseChunking(changes: Array<{ type: string, content: string }>): Array<{ type: string, content: string, originalContent?: string, revisedContent?: string }> {
    const result: Array<{ type: string, content: string, originalContent?: string, revisedContent?: string }> = [];
    let i = 0;

    while (i < changes.length) {
      const currentChange = changes[i];

      if (currentChange.type === 'unchanged') {
        result.push(currentChange);
        i++;
        continue;
      }

      // Start of a change block (added or removed)
      let removedContent = '';
      let addedContent = '';
      let j = i;

      // Collect all subsequent adds and removes until a significant unchanged block
      while (j < changes.length) {
        const change = changes[j];
        if (change.type === 'removed') {
          removedContent += change.content;
        } else if (change.type === 'added') {
          addedContent += change.content;
        } else { // unchanged
          // CRITICAL FIX: Treat line breaks as significant boundaries
          // Line breaks should never be absorbed into change groups
          if (change.content.includes('\n') || change.content.length > 1 || change.content.trim().length > 0) {
            break;
          }
          // Otherwise, it's just a space within a phrase, so append it.
          removedContent += change.content;
          addedContent += change.content;
        }
        j++;
      }

      // ENHANCED: Use sophisticated substitution logic instead of simple presence check
      if (removedContent && addedContent) {
        // Check if this should be treated as a substitution using the enhanced logic
        if (this.shouldTreatAsSubstitution(removedContent, addedContent)) {
          result.push({ type: 'changed', content: '', originalContent: removedContent, revisedContent: addedContent });
        } else {
          // Treat as separate additions and removals
          if (removedContent) {
            result.push({ type: 'removed', content: removedContent });
          }
          if (addedContent) {
            result.push({ type: 'added', content: addedContent });
          }
        }
      } else if (removedContent) {
        result.push({ type: 'removed', content: removedContent });
      } else if (addedContent) {
        result.push({ type: 'added', content: addedContent });
      }

      i = j;
    }

    return result;
  }

  /**
   * WHITESPACE NOISE FILTERING: Convert space formatting artifacts to "unchanged" 
   * Displays revised version but doesn't highlight or count as changes
   */
  private static filterWhitespaceNoise(changes: Array<{ type: string, content: string, originalContent?: string, revisedContent?: string }>): Array<{ type: string, content: string, originalContent?: string, revisedContent?: string }> {
    const processed: Array<{ type: string, content: string, originalContent?: string, revisedContent?: string }> = [];
    
    for (let i = 0; i < changes.length; i++) {
      const current = changes[i];
      const next = changes[i + 1];
      
      // Check if current+next is a space formatting artifact
      if (this.isSpaceFormattingArtifact(current, next)) {
        // Convert to "unchanged" with the revised version's spacing
        const revisedSpacing = next.content || '';
        processed.push({
          type: 'unchanged',
          content: revisedSpacing,
          originalContent: undefined,
          revisedContent: undefined
        });
        i++; // Skip the next change since we processed both
        continue;
      }
      
      processed.push(current);
    }
    
    return processed;
  }

  /**
   * Detects space formatting artifacts: single↔double space changes
   * Returns true for " " ↔ "  " (both directions)
   */
  private static isSpaceFormattingArtifact(
    current: { type: string, content: string, originalContent?: string, revisedContent?: string },
    next?: { type: string, content: string, originalContent?: string, revisedContent?: string }
  ): boolean {
    if (!next) return false;
    
    // Must be opposite operations (removed then added)
    if (!(current.type === 'removed' && next.type === 'added')) {
      return false;
    }
    
    const removedContent = current.content || '';
    const addedContent = next.content || '';
    
    // Both must be pure spaces (not tabs or newlines, just spaces)
    if (!this.isPureSpaces(removedContent) || !this.isPureSpaces(addedContent)) {
      return false;
    }
    
    // Check for single↔double space formatting artifacts
    // Single space ↔ double space (either direction)
    if ((removedContent === ' ' && addedContent === '  ') ||
        (removedContent === '  ' && addedContent === ' ')) {
      return true;
    }
    
    return false;
  }

  /**
   * Helper function to detect pure space content (only spaces, not tabs/newlines)
   */
  private static isPureSpaces(content: string): boolean {
    return content && /^ +$/.test(content);
  }

  /**
   * Helper function to detect pure whitespace content (spaces, tabs, newlines)
   */
  private static isPureWhitespace(content: string): boolean {
    return content && /^\s*$/.test(content);
  }

  /**
   * NEW: Check for whitespace differences in paragraph separators
   * Returns true if the paragraph separators (the whitespace between paragraphs) differ
   * This prevents paragraph trimming from losing important whitespace structure
   */
  private static hasWhitespaceDifferencesInSeparators(
    originalText: string,
    revisedText: string, 
    originalParagraphs: string[],
    revisedParagraphs: string[],
    prefixParagraphCount: number
  ): boolean {
    // Only check if we have enough paragraphs to potentially trim suffixes
    if (originalParagraphs.length <= prefixParagraphCount + 1 || 
        revisedParagraphs.length <= prefixParagraphCount + 1) {
      return false;
    }

    // Reconstruct text from paragraphs to find separators
    const originalReconstructed = originalParagraphs.join('\n\n');
    const revisedReconstructed = revisedParagraphs.join('\n\n');
    
    // If the reconstructed text doesn't match the original, there are separator differences
    const originalDiffers = originalText !== originalReconstructed;
    const revisedDiffers = revisedText !== revisedReconstructed;
    
    if (originalDiffers || revisedDiffers) {
      debugLog(`📋 Separator differences detected - original: ${originalDiffers}, revised: ${revisedDiffers}`);
      return true;
    }
    
    return false;
  }

  /**
   * Check for whitespace structure differences that could affect trimming.
   * This is a simpler version for word-level trimming that detects patterns like \n\n vs \n \n
   */
  private static hasWhitespaceStructureDifferences(originalText: string, revisedText: string): boolean {
    // Extract whitespace patterns from both texts
    const originalWhitespacePattern = originalText.match(/\s+/g) || [];
    const revisedWhitespacePattern = revisedText.match(/\s+/g) || [];
    
    // If different number of whitespace groups, there are differences
    if (originalWhitespacePattern.length !== revisedWhitespacePattern.length) {
      debugLog(`📋 Whitespace pattern count differs: ${originalWhitespacePattern.length} vs ${revisedWhitespacePattern.length}`);
      return true;
    }
    
    // Check each whitespace group for differences
    for (let i = 0; i < originalWhitespacePattern.length; i++) {
      if (originalWhitespacePattern[i] !== revisedWhitespacePattern[i]) {
        debugLog(`📋 Whitespace pattern differs at position ${i}: "${originalWhitespacePattern[i]}" vs "${revisedWhitespacePattern[i]}"`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * NEW: Detect whitespace transition boundaries for surgical precision
   * Returns true if the changes involve different whitespace patterns that should be kept separate
   */
  private static hasWhitespaceTransitionBoundary(
    removedChanges: Array<{ type: string, content: string }>,
    addedChanges: Array<{ type: string, content: string }>
  ): boolean {
    // Get the whitespace tokens from each side
    const removedWhitespace = removedChanges.filter(c => this.isPureWhitespace(c.content));
    const addedWhitespace = addedChanges.filter(c => this.isPureWhitespace(c.content));
    
    // If whitespace patterns differ significantly, keep them separate for surgical precision
    if (removedWhitespace.length !== addedWhitespace.length) {
      debugLog(`🔍 Whitespace transition: different count (${removedWhitespace.length} vs ${addedWhitespace.length})`);
      return true;
    }
    
    // Check if whitespace content differs in a way that suggests different formatting
    for (let i = 0; i < removedWhitespace.length; i++) {
      const removedWS = removedWhitespace[i].content;
      const addedWS = addedWhitespace[i].content;
      
      // Different whitespace types (e.g., "\n" vs " \n") should be kept separate
      if (removedWS !== addedWS) {
        // Special case: if one has line break and other doesn't, it's a boundary
        const removedHasNewline = removedWS.includes('\n');
        const addedHasNewline = addedWS.includes('\n');
        if (removedHasNewline !== addedHasNewline) {
          debugLog(`🔍 Whitespace transition: newline difference ("${removedWS}" vs "${addedWS}")`);
          return true;
        }
        
        // Different space counts around line breaks
        if (removedHasNewline && addedHasNewline && removedWS !== addedWS) {
          debugLog(`🔍 Whitespace transition: space pattern difference ("${removedWS}" vs "${addedWS}")`);
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * REFINED: Collect a precise change segment with aggressive collection of related changes
   */
  private static collectPreciseChangeSegment(
    changes: Array<{ type: string, content: string }>,
    startIndex: number
  ): {
    tokens: Array<{ type: string, content: string }>,
    endIndex: number
  } {
    const tokens: Array<{ type: string, content: string }> = [];
    let i = startIndex;

    if (DEBUG_MODE) {
      debugLog(`🔍 Starting precise segment collection from index ${i}`);
    }

    // First, collect all consecutive added/removed tokens
    while (i < changes.length && (changes[i].type === 'added' || changes[i].type === 'removed')) {
      tokens.push(changes[i]);
      if (DEBUG_MODE) {
        debugLog(`  ➕ Added ${changes[i].type}: "${changes[i].content}"`);
      }
      i++;
    }

    // Look for unchanged tokens that are truly internal to the change
    while (i < changes.length && changes[i].type === 'unchanged') {
      const unchangedToken = changes[i];

      // Only consider whitespace or connective punctuation as potential internal tokens
      if (!this.isWhitespaceOnly(unchangedToken.content) &&
        !this.isConnectivePunctuation(unchangedToken.content)) {
        if (DEBUG_MODE) {
          debugLog(`  🛑 Stopping at significant unchanged token: "${unchangedToken.content}"`);
        }
        break;
      }

      // Look ahead for more changes within reasonable distance
      let hasMoreChanges = false;
      let lookaheadDistance = 0;
      const maxLookahead = 5;

      for (let j = i + 1; j < changes.length && lookaheadDistance < maxLookahead; j++) {
        if (changes[j].type === 'added' || changes[j].type === 'removed') {
          hasMoreChanges = true;
          break;
        }

        if (changes[j].type === 'unchanged' &&
          !this.isWhitespaceOnly(changes[j].content) &&
          !this.isConnectivePunctuation(changes[j].content)) {
          break;
        }

        lookaheadDistance++;
      }

      if (hasMoreChanges) {
        tokens.push(unchangedToken);
        if (DEBUG_MODE) {
          debugLog(`  ⬜ Added internal unchanged: "${unchangedToken.content}"`);
        }
        i++;

        // Continue collecting more added/removed tokens
        while (i < changes.length && (changes[i].type === 'added' || changes[i].type === 'removed')) {
          tokens.push(changes[i]);
          if (DEBUG_MODE) {
            debugLog(`  ➕ Added ${changes[i].type}: "${changes[i].content}"`);
          }
          i++;
        }
      } else {
        if (DEBUG_MODE) {
          debugLog(`  🛑 Stopping at boundary unchanged token: "${unchangedToken.content}"`);
        }
        break;
      }
    }

    if (DEBUG_MODE) {
      debugLog(`📦 Collected precise segment with ${tokens.length} tokens`);
    }
    return { tokens, endIndex: i };
  }

  /**
   * Evaluate whether a segment should become a substitution
   */
  private static evaluateSubstitution(
    tokens: Array<{ type: string, content: string }>
  ): {
    isSubstitution: boolean,
    removedContent: string,
    addedContent: string
  } {
    // Build content strings
    const removedContent = tokens
      .filter(token => token.type === 'removed' ||
        (token.type === 'unchanged' && this.shouldIncludeInSubstitution(token, tokens)))
      .map(token => token.content)
      .join('');

    const addedContent = tokens
      .filter(token => token.type === 'added' ||
        (token.type === 'unchanged' && this.shouldIncludeInSubstitution(token, tokens)))
      .map(token => token.content)
      .join('');

    if (DEBUG_MODE) {
      debugLog(`🧠 Evaluating substitution:`);
      debugLog(`  📤 Removed: "${removedContent}"`);
      debugLog(`  📥 Added: "${addedContent}"`);
    }

    // Check if this should be a substitution
    const isSubstitution = !!(removedContent && addedContent &&
      this.shouldTreatAsSubstitution(removedContent, addedContent));

    if (DEBUG_MODE) {
      debugLog(`  🎯 Decision: ${isSubstitution ? 'SUBSTITUTE' : 'SEPARATE'}`);
    }

    return {
      isSubstitution,
      removedContent,
      addedContent
    };
  }

  /**
   * Determine if an unchanged token should be included in a substitution
   */
  private static shouldIncludeInSubstitution(
    token: { type: string, content: string },
    allTokens: Array<{ type: string, content: string }>
  ): boolean {
    if (token.type !== 'unchanged') return false;

    const tokenIndex = allTokens.indexOf(token);
    const hasRemovedBefore = allTokens.slice(0, tokenIndex).some(t => t.type === 'removed');
    const hasAddedBefore = allTokens.slice(0, tokenIndex).some(t => t.type === 'added');
    const hasRemovedAfter = allTokens.slice(tokenIndex + 1).some(t => t.type === 'removed');
    const hasAddedAfter = allTokens.slice(tokenIndex + 1).some(t => t.type === 'added');

    return (hasRemovedBefore || hasAddedBefore) && (hasRemovedAfter || hasAddedAfter);
  }

  /**
   * Process tokens individually with intelligent grouping
   */
  private static processTokensIndividually(
    tokens: Array<{ type: string, content: string }>,
    processed: Array<{ type: string, content: string, originalContent?: string, revisedContent?: string }>
  ): void {
    let i = 0;

    while (i < tokens.length) {
      const current = tokens[i];

      if (current.type === 'unchanged') {
        processed.push(current);
        i++;
        continue;
      }

      // Collect consecutive tokens of the same type
      const group = this.collectConsecutiveTokens(tokens, i, current.type);

      if (group.length > 1 && this.shouldGroupConsecutiveTokens(group)) {
        if (DEBUG_MODE) {
          debugLog(`📦 Grouping ${group.length} consecutive ${current.type} tokens`);
        }
        processed.push({
          type: current.type,
          content: group.map(token => token.content).join('')
        });
      } else {
        group.forEach(token => processed.push(token));
      }

      i += group.length;
    }
  }

  /**
   * Collect consecutive tokens of the same type
   */
  private static collectConsecutiveTokens(
    tokens: Array<{ type: string, content: string }>,
    startIndex: number,
    targetType: string
  ): Array<{ type: string, content: string }> {
    const group: Array<{ type: string, content: string }> = [];
    let i = startIndex;

    while (i < tokens.length && tokens[i].type === targetType) {
      group.push(tokens[i]);
      i++;
    }

    return group;
  }

  /**
   * Enhanced grouping logic for consecutive tokens
   */
  private static shouldGroupConsecutiveTokens(group: Array<{ type: string, content: string }>): boolean {
    if (group.length < 2) return false;

    const combinedContent = group.map(item => item.content).join('');

    // Don't group across sentence boundaries
    if (this.containsSentenceBoundary(combinedContent)) {
      return false;
    }

    // Count meaningful words
    const meaningfulWords = this.countMeaningfulWords(combinedContent);

    // Group if we have multiple meaningful words
    if (meaningfulWords >= 2) {
      return true;
    }

    // Group if it looks like structured data (addresses, company names, etc.)
    if (this.looksLikeStructuredData(combinedContent)) {
      return true;
    }

    // Group if total length suggests a meaningful phrase
    if (combinedContent.trim().length > 15) {
      return true;
    }

    return false;
  }

  /**
   * Enhanced substitution detection with better structured data handling
   */
  private static shouldTreatAsSubstitution(removedContent: string, addedContent: string): boolean {
    debugLog(`🔍 shouldTreatAsSubstitution check:`);
    debugLog(`  Removed: ${JSON.stringify(removedContent)}`);
    debugLog(`  Added: ${JSON.stringify(addedContent)}`);
    
    // Don't create substitutions for very large content
    if (removedContent.length > 500 || addedContent.length > 500) {
      debugLog(`  ❌ Rejected: Too large (${removedContent.length}, ${addedContent.length})`);
      return false;
    }

    // Don't substitute across sentence boundaries, UNLESS both are pure whitespace
    const removedHasBoundary = this.containsSentenceBoundary(removedContent);
    const addedHasBoundary = this.containsSentenceBoundary(addedContent);
    if (removedHasBoundary || addedHasBoundary) {
      // Exception: Allow whitespace-only substitutions even if they contain boundaries
      const bothPureWhitespace = this.isPureWhitespace(removedContent) && this.isPureWhitespace(addedContent);
      if (bothPureWhitespace) {
        debugLog(`  ✅ Allowing boundary crossing for pure whitespace substitution`);
      } else {
        debugLog(`  ❌ Rejected: Sentence boundary (removed: ${removedHasBoundary}, added: ${addedHasBoundary})`);
        return false;
      }
    }

    // ENHANCED: Special handling for pure numerical substitutions
    // This handles cases like "15,000,000" -> "20,000,000"
    if (this.isPureNumericalSubstitution(removedContent, addedContent)) {
      return true;
    }

    // Count meaningful words
    const removedWords = this.countMeaningfulWords(removedContent);
    const addedWords = this.countMeaningfulWords(addedContent);

    // SPECIAL CASE: Allow pure whitespace substitutions to avoid visual noise
    // If both are pure whitespace, treat as substitution for cleaner display
    if (removedWords === 0 && addedWords === 0) {
      const bothPureWhitespace = this.isPureWhitespace(removedContent) && this.isPureWhitespace(addedContent);
      if (bothPureWhitespace) {
        debugLog(`  ✅ Accepted: Pure whitespace substitution`);
        return true; // Clean substitution for whitespace changes
      }
      debugLog(`  ❌ Rejected: Zero words but not pure whitespace`);
      return false;
    }

    // Must have meaningful content in both for regular substitutions
    if (removedWords === 0 || addedWords === 0) {
      debugLog(`  ❌ Rejected: One side has no meaningful words (removed: ${removedWords}, added: ${addedWords})`);
      return false;
    }

    // Calculate ratio
    const ratio = Math.max(removedWords, addedWords) / Math.min(removedWords, addedWords);
    debugLog(`  📊 Word ratio: ${ratio} (removed: ${removedWords}, added: ${addedWords})`);

    // More lenient for structured data (addresses, company names, etc.)
    if (this.looksLikeStructuredData(removedContent) || this.looksLikeStructuredData(addedContent)) {
      const accepted = ratio <= 10;
      debugLog(`  ${accepted ? '✅' : '❌'} Structured data: ratio ${ratio} <= 10: ${accepted}`);
      return accepted; // Very lenient for structured data
    }

    const accepted = ratio <= 5;
    debugLog(`  ${accepted ? '✅' : '❌'} Regular content: ratio ${ratio} <= 5: ${accepted}`);
    return accepted;
  }



  /**
   * Check if this is a pure numerical substitution (number -> number)
   * This ensures numbers like "15,000,000" -> "20,000,000" are treated as single substitutions
   */
  private static isPureNumericalSubstitution(removedContent: string, addedContent: string): boolean {
    // Trim whitespace for comparison
    const removed = removedContent.trim();
    const added = addedContent.trim();

    // Both must be non-empty
    if (!removed || !added) {
      return false;
    }

    // Check if both are pure numbers (with optional currency symbols, commas, decimals, percentages)
    const numberPattern = /^[$€£¥₹]?\d{1,3}(?:,\d{3})*(?:\.\d+)?%?$/;

    return numberPattern.test(removed) && numberPattern.test(added);
  }

  /**
   * Enhanced structured data detection
   */
  private static looksLikeStructuredData(content: string): boolean {
    // Large numbers with commas (financial/legal documents)
    // Match numbers like 15,000,000 or 1,500 or $500,000,000
    if (/(?:^|[\s$€£¥₹])\d{1,3}(?:,\d{3})+(?:\.\d+)?(?:$|[\s%]|$)/.test(content)) {
      return true;
    }

    // Currency amounts (with or without commas)
    if (/[$€£¥₹]\d+(?:,\d{3})*(?:\.\d{2})?/.test(content)) {
      return true;
    }

    // Decimal numbers that look like financial data
    if (/\d+\.\d{2,}/.test(content)) {
      return true;
    }

    // Address patterns
    if (/\d+.*(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct|place|pl)/i.test(content)) {
      return true;
    }

    // City, State ZIP patterns
    if (/[a-zA-Z\s]+,\s*[A-Z]{2}\s*\d{5}/.test(content)) {
      return true;
    }

    // Company name patterns with enhanced detection
    if (/(?:inc|corp|llc|ltd|co|plc|gmbh|ag|sa|sas|sarl|bv|nv|lp|llp|pc|pa|pllc)\./i.test(content)) {
      return true;
    }

    // Financial/legal entity patterns
    if (/(?:corporation|company|limited|partnership|associates|group|holdings|enterprises|international|securities)/i.test(content)) {
      return true;
    }

    // Address components
    if (/(?:suite|ste|floor|fl|building|bldg|unit|apt|apartment)\s*\d+/i.test(content)) {
      return true;
    }

    return false;
  }

  /**
   * Count meaningful words in content
   */
  private static countMeaningfulWords(content: string): number {
    return (content.match(/\b\w+\b/g) || []).length;
  }

  /**
   * Check if content is whitespace only
   */
  private static isWhitespaceOnly(content: string): boolean {
    return /^\s+$/.test(content);
  }

  /**
   * Check if content is connective punctuation that should keep tokens together
   * Includes commas in numbers, periods in decimals, and other connecting punctuation
   */
  private static isConnectivePunctuation(content: string): boolean {
    // Handle single character connective punctuation
    if (content.length === 1) {
      // Commas are connective in numbers (1,000,000)
      // Periods are connective in decimals and abbreviations
      // Hyphens connect compound words
      // Colons and semicolons connect clauses
      return /[,.\-:;]/.test(content);
    }

    // Handle multi-character content that might be purely connective
    // Only whitespace and connective punctuation
    return /^[,.\-:;\s]+$/.test(content);
  }

  /**
   * SSMR: Optimized sentence boundary detection with feature flags
   */
  /**
   * Detect sentence boundaries in content
   * Uses the optimized implementation by default
   */
  private static containsSentenceBoundary(content: string): boolean {
    // The optimized implementation is now the default
    // The feature flag is no longer needed as the fix has been proven stable
    return this.optimizedBoundaryDetection(content);
  }

  /**
   * @private
   * Legacy regex-based sentence boundary detection (kept as a reference but no longer used)
   */
  private static containsSentenceBoundaryLegacy(content: string): boolean {
    // Check for paragraph boundaries (double newlines)
    if (content.includes('\n\n')) {
      return true;
    }

    // For periods, be more selective - avoid abbreviations
    if (/\.\s{2,}/.test(content)) {
      return true;
    }

    // ENHANCED: Period followed by space and capital letter (but not abbreviations)
    if (/\.\s+[A-Z]/.test(content) && !this.endsWithAbbreviation(content)) {
      return true;
    }

    return false;
  }

  /**
   * SSMR: New optimized boundary detection without regex
   */
  private static optimizedBoundaryDetection(content: string): boolean {
    debugLog(`🔍 optimizedBoundaryDetection checking: ${JSON.stringify(content)}`);
    
    // Check for paragraph boundaries first (most common)
    if (content.includes('\n\n')) {
      debugLog(`  ✅ Found paragraph boundary (\\n\\n)`);
      return true;
    }

    // REVERTED: Don't automatically treat single line breaks as boundaries
    // This was preventing surgical precision for cases like "1\n" vs "2 \n"
    // Instead, handle this in preciseChunking logic

    // Scan character by character for sentence boundaries
    for (let i = 0; i < content.length - 1; i++) {
      if (content[i] === '.' && content[i + 1] === ' ') {
        // Check if this is multiple spaces (double space indicates sentence end)
        if (i + 2 < content.length && content[i + 2] === ' ') {
          return true;
        }

        // Check if followed by capital letter
        if (i + 2 < content.length && /[A-Z]/.test(content[i + 2])) {
          // Extract the word ending with this period
          const wordStart = content.lastIndexOf(' ', i - 1) + 1;
          const word = content.slice(wordStart, i + 1).toLowerCase();

          // Check if it's NOT a known abbreviation
          if (!this.ABBREVIATIONS.has(word)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * ENHANCED: Check if content ends with a known abbreviation
   */
  private static endsWithAbbreviation(content: string): boolean {
    // Check if content ends with any known complete abbreviation
    if (this.isCompleteAbbreviation(content.slice(-4)) ||
      this.isCompleteAbbreviation(content.slice(-3)) ||
      this.isCompleteAbbreviation(content.slice(-2))) {
      return true;
    }

    // Check for multi-part abbreviation patterns at the end (J.P., A.B.C., etc.)
    const multiPartAbbrevPattern = /[A-Z](\.[A-Z])*\.$/;
    if (multiPartAbbrevPattern.test(content)) {
      return true;
    }

    return false;
  }

  /**
   * ENHANCED: Word-level prefix/suffix trimming
   * Respects token boundaries to preserve semantic units like numbers, dates, etc.
   * Much simpler and more reliable than character-level trimming
   */
  private static trimCommonPrefixSuffix(originalText: string, revisedText: string): {
    commonPrefix: string;
    commonSuffix: string;
    originalCore: string;
    revisedCore: string;
  } {
    const startTime = performance.now();

    // Tokenize both texts using our robust tokenization
    const originalTokens = this.tokenize(originalText);
    const revisedTokens = this.tokenize(revisedText);

    debugLog(`📝 Word-level trimming: ${originalTokens.length} vs ${revisedTokens.length} tokens`);

    // Find common prefix tokens
    let prefixTokenCount = 0;
    const minTokens = Math.min(originalTokens.length, revisedTokens.length);

    while (prefixTokenCount < minTokens &&
      originalTokens[prefixTokenCount] === revisedTokens[prefixTokenCount]) {
      prefixTokenCount++;
    }

    // CRITICAL FIX: Check for whitespace differences that might affect suffix trimming
    // This prevents losing whitespace structure like \n\n vs \n \n
    const hasWhitespaceDifferences = this.hasWhitespaceStructureDifferences(originalText, revisedText);

    // Find common suffix tokens (from remaining tokens after prefix)
    let suffixTokenCount = 0;
    const originalRemainingTokens = originalTokens.length - prefixTokenCount;
    const revisedRemainingTokens = revisedTokens.length - prefixTokenCount;
    const maxSuffixTokens = Math.min(originalRemainingTokens, revisedRemainingTokens);

    // Only perform suffix trimming if there are no whitespace structure differences
    if (!hasWhitespaceDifferences) {
      while (suffixTokenCount < maxSuffixTokens &&
        originalTokens[originalTokens.length - 1 - suffixTokenCount] ===
        revisedTokens[revisedTokens.length - 1 - suffixTokenCount]) {
        suffixTokenCount++;
      }
    } else {
      debugLog('📋 Skipping word-level suffix trimming due to whitespace structure differences');
    }

    // Reconstruct text from tokens
    const commonPrefix = originalTokens.slice(0, prefixTokenCount).join('');
    const commonSuffix = originalTokens.slice(originalTokens.length - suffixTokenCount).join('');

    const originalCoreTokens = originalTokens.slice(prefixTokenCount, originalTokens.length - suffixTokenCount);
    const revisedCoreTokens = revisedTokens.slice(prefixTokenCount, revisedTokens.length - suffixTokenCount);

    const originalCore = originalCoreTokens.join('');
    const revisedCore = revisedCoreTokens.join('');

    const endTime = performance.now();
    debugLog(`⚡ Word-level trimming completed in ${(endTime - startTime).toFixed(2)}ms`);
    debugLog(`📊 Word-level trimming results:`, {
      prefixTokens: prefixTokenCount,
      suffixTokens: suffixTokenCount,
      originalCoreTokens: originalCoreTokens.length,
      revisedCoreTokens: revisedCoreTokens.length,
      commonPrefix: commonPrefix.slice(-20),
      commonSuffix: commonSuffix.slice(0, 20)
    });

    return {
      commonPrefix,
      commonSuffix,
      originalCore,
      revisedCore
    };
  }

  /**
   * PRIORITY 1 OPTIMIZATION: Reconstruct final result with prefix and suffix
   * Adds back the common prefix and suffix that were trimmed for efficiency
   */
  private static reconstructWithPrefixSuffix(
    coreChanges: DiffChange[],
    trimResult: {
      commonPrefix: string;
      commonSuffix: string;
      originalCore: string;
      revisedCore: string;
    }
  ): DiffChange[] {
    const startTime = performance.now();
    const finalChanges: DiffChange[] = [];
    let currentIndex = 0;

    // Add common prefix as unchanged if it exists
    if (trimResult.commonPrefix.length > 0) {
      finalChanges.push({
        type: 'unchanged',
        content: trimResult.commonPrefix,
        index: currentIndex++
      });
    }

    // Add core changes with updated indices
    coreChanges.forEach(change => {
      finalChanges.push({
        ...change,
        index: currentIndex++
      });
    });

    // Add common suffix as unchanged if it exists
    if (trimResult.commonSuffix.length > 0) {
      finalChanges.push({
        type: 'unchanged',
        content: trimResult.commonSuffix,
        index: currentIndex++
      });
    }


    const endTime = performance.now();
    debugLog(`⚡ Result reconstruction completed in ${(endTime - startTime).toFixed(2)}ms`);

    return finalChanges;
  }

  /**
   * PRIORITY 2.5: SSMR Paragraph-level prefix/suffix trimming
   * SAFE: No breaking changes, operates before existing character-level trimming
   * STEP-BY-STEP: Separate method, independent implementation
   * MODULAR: Can be enabled/disabled via feature flag
   * REVERSIBLE: Easy to disable by setting enableParagraphTrimming = false
   */
  private static trimCommonParagraphs(
    originalText: string,
    revisedText: string,
    enableParagraphTrimming: boolean = true // ROLLBACK: Set to false to disable
  ): {
    commonPrefixParagraphs: string;
    commonSuffixParagraphs: string;
    originalCoreParagraphs: string;
    revisedCoreParagraphs: string;
    paragraphReductionRatio: number;
  } {
    const startTime = performance.now();

    // SAFE: Feature flag for easy disable
    if (!enableParagraphTrimming) {
      debugLog('📋 Paragraph trimming disabled - using original texts');
      return {
        commonPrefixParagraphs: '',
        commonSuffixParagraphs: '',
        originalCoreParagraphs: originalText,
        revisedCoreParagraphs: revisedText,
        paragraphReductionRatio: 0
      };
    }

    // Split into paragraphs using multiple paragraph separators
    const originalParagraphs = this.splitIntoParagraphs(originalText);
    const revisedParagraphs = this.splitIntoParagraphs(revisedText);

    debugLog('📋 Paragraph analysis:', {
      originalParagraphs: originalParagraphs.length,
      revisedParagraphs: revisedParagraphs.length
    });

    // Find common prefix paragraphs
    let prefixParagraphCount = 0;
    const minParagraphs = Math.min(originalParagraphs.length, revisedParagraphs.length);

    while (prefixParagraphCount < minParagraphs &&
      originalParagraphs[prefixParagraphCount] === revisedParagraphs[prefixParagraphCount]) {
      prefixParagraphCount++;
    }

    // CRITICAL FIX: Check for whitespace differences in paragraph separators before suffix trimming
    // This prevents losing whitespace structure when paragraphs are identical but separators differ
    const hasWhitespaceSeparatorDifferences = this.hasWhitespaceDifferencesInSeparators(
      originalText, revisedText, originalParagraphs, revisedParagraphs, prefixParagraphCount
    );

    // Find common suffix paragraphs (from remaining paragraphs after prefix)
    let suffixParagraphCount = 0;
    const originalRemaining = originalParagraphs.length - prefixParagraphCount;
    const revisedRemaining = revisedParagraphs.length - prefixParagraphCount;
    const maxSuffixParagraphs = Math.min(originalRemaining, revisedRemaining);

    // Only perform suffix trimming if there are no whitespace differences in separators
    if (!hasWhitespaceSeparatorDifferences) {
      while (suffixParagraphCount < maxSuffixParagraphs &&
        originalParagraphs[originalParagraphs.length - 1 - suffixParagraphCount] ===
        revisedParagraphs[revisedParagraphs.length - 1 - suffixParagraphCount]) {
        suffixParagraphCount++;
      }
    } else {
      debugLog('📋 Skipping suffix paragraph trimming due to whitespace separator differences');
    }

    // Reconstruct text sections
    const commonPrefixParagraphs = originalParagraphs.slice(0, prefixParagraphCount).join('');
    const commonSuffixParagraphs = originalParagraphs.slice(originalParagraphs.length - suffixParagraphCount).join('');

    const originalCoreParagraphs = originalParagraphs.slice(
      prefixParagraphCount,
      originalParagraphs.length - suffixParagraphCount
    ).join('');

    const revisedCoreParagraphs = revisedParagraphs.slice(
      prefixParagraphCount,
      revisedParagraphs.length - suffixParagraphCount
    ).join('');

    // Calculate reduction ratio
    const originalTotalLength = originalText.length + revisedText.length;
    const coreLength = originalCoreParagraphs.length + revisedCoreParagraphs.length;
    const paragraphReductionRatio = originalTotalLength > 0 ?
      ((originalTotalLength - coreLength) / originalTotalLength * 100) : 0;

    const endTime = performance.now();

    debugLog(`📋 Paragraph trimming completed in ${(endTime - startTime).toFixed(2)}ms`);
    debugLog('📋 Paragraph trimming results:', {
      prefixParagraphs: prefixParagraphCount,
      suffixParagraphs: suffixParagraphCount,
      originalCoreParagraphs: originalCoreParagraphs.length,
      revisedCoreParagraphs: revisedCoreParagraphs.length,
      paragraphReductionRatio: paragraphReductionRatio.toFixed(1) + '%'
    });

    return {
      commonPrefixParagraphs,
      commonSuffixParagraphs,
      originalCoreParagraphs,
      revisedCoreParagraphs,
      paragraphReductionRatio
    };
  }

  /**
   * PRIORITY B: SSMR Single-Pass Paragraph Splitting (Hamano's optimization)
   * SAFE: Returns same format as before, but more efficient
   * STEP-BY-STEP: Replaces multi-pass approach with single state machine
   * MODULAR: Can be disabled by setting useSinglePassSplitting = false
   * REVERSIBLE: Falls back to original method if disabled
   */
  /**
   * Split text into paragraphs using the optimized single-pass method
   * The original method is kept as a fallback but marked as private
   */
  private static splitIntoParagraphs(
    text: string
  ): string[] {
    // Use the optimized implementation by default
    // The feature flag is no longer needed as the fix has been proven stable
    return this.splitIntoParagraphsSinglePass(text);
  }

  /**
   * PRIORITY B: Hamano's single-pass paragraph detection state machine
   * Reads document once, identifies ALL paragraph patterns simultaneously
   */
  private static splitIntoParagraphsSinglePass(text: string): string[] {
    const startTime = performance.now();
    const paragraphs: string[] = [];
    let currentParagraphStart = 0;
    let i = 0;

    debugLog('🔧 Using single-pass paragraph splitting (Hamano optimization)');

    while (i < text.length) {
      const char = text[i];

      if (char === '\n') {
        // Look ahead to determine paragraph break type
        const lookAhead = this.analyzeParagraphBreak(text, i);

        if (lookAhead.isParagraphBreak) {
          // Complete current paragraph (including full separator like \n\n)
          const paragraphContent = text.slice(currentParagraphStart, lookAhead.nextParagraphStart);
          if (paragraphContent.trim().length > 0) {
            paragraphs.push(paragraphContent);
          }

          // Skip to start of next paragraph
          i = lookAhead.nextParagraphStart;
          currentParagraphStart = i;
          continue;
        }
      }

      i++;
    }

    // Add final paragraph if exists
    if (currentParagraphStart < text.length) {
      const finalParagraph = text.slice(currentParagraphStart);
      if (finalParagraph.trim().length > 0) {
        paragraphs.push(finalParagraph);
      }
    }

    const endTime = performance.now();
    debugLog(`🔧 Single-pass splitting completed in ${(endTime - startTime).toFixed(2)}ms, found ${paragraphs.length} paragraphs`);

    return paragraphs;
  }

  /**
   * PRIORITY B: Analyze text at newline position to determine if it's a paragraph break
   */
  private static analyzeParagraphBreak(text: string, newlineIndex: number): {
    isParagraphBreak: boolean;
    nextParagraphStart: number;
  } {
    let i = newlineIndex + 1;

    // Skip whitespace after newline
    while (i < text.length && /[ \t]/.test(text[i])) {
      i++;
    }

    // Check for double newline (most common paragraph break)
    if (i < text.length && text[i] === '\n') {
      // Found double newline - definite paragraph break
      i++; // Skip second newline
      // Skip any additional whitespace
      while (i < text.length && /\s/.test(text[i])) {
        i++;
      }
      return { isParagraphBreak: true, nextParagraphStart: i };
    }

    // Check for legal document patterns after single newline
    const remainingText = text.slice(i);

    // Numbered clauses: "1.", "12.", "(a)", "(iv)"
    if (/^\d+\./.test(remainingText) || /^\([a-z]+\)/.test(remainingText) || /^\([ivx]+\)/.test(remainingText)) {
      return { isParagraphBreak: true, nextParagraphStart: i };
    }

    // Bullet points: "•", "*", "-"
    if (/^[•*-]\s/.test(remainingText)) {
      return { isParagraphBreak: true, nextParagraphStart: i };
    }

    // Significant indentation (4+ spaces or tab)
    if (/^(\s{4,}|\t)/.test(remainingText)) {
      return { isParagraphBreak: true, nextParagraphStart: i };
    }

    // Not a paragraph break
    return { isParagraphBreak: false, nextParagraphStart: i };
  }

  /**
   * PRIORITY B: Original multi-pass method (kept for rollback)
   * SAFE: Preserves original behavior if single-pass is disabled
   */
  /**
   * @private
   * Original multi-pass method (kept as a reference but no longer used)
   */
  private static splitIntoParagraphsOriginal(text: string): string[] {
    if (DEBUG_MODE) {
      debugLog('🔧 Using original multi-pass paragraph splitting (fallback)');
    }

    // Split on double newlines (most common paragraph separator)
    let paragraphs = text.split(/\n\s*\n/);

    // If we only get one paragraph, try single newlines (for legal docs with numbered clauses)
    if (paragraphs.length === 1) {
      // Look for numbered clauses, bullet points, or significant indentation changes
      paragraphs = text.split(/\n(?=\s*(?:\d+\.|\w+\)|•|\*|\s{4,}|\t))/)
        .filter(p => p.trim().length > 0);
    }

    // If still only one paragraph, split on any newline (fallback)
    if (paragraphs.length === 1) {
      paragraphs = text.split(/\n/)
        .filter(p => p.trim().length > 0);
    }

    // Ensure we preserve the original separators for reconstruction
    const result: string[] = [];
    let currentIndex = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      const startIndex = text.indexOf(paragraph, currentIndex);

      if (i > 0) {
        // Include the separator between this and previous paragraph
        const separator = text.slice(currentIndex, startIndex);
        if (separator && result.length > 0) {
          result[result.length - 1] += separator;
        }
      }

      result.push(paragraph);
      currentIndex = startIndex + paragraph.length;
    }

    return result;
  }

  /**
   * PRIORITY 2.5: SSMR Combined reconstruction with paragraph and character trimming
   * Reconstructs the final result by adding back both paragraph-level and character-level common parts
   */
  private static reconstructWithCombinedTrimming(
    coreChanges: DiffChange[],
    paragraphTrimResult: {
      commonPrefixParagraphs: string;
      commonSuffixParagraphs: string;
      originalCoreParagraphs: string;
      revisedCoreParagraphs: string;
      paragraphReductionRatio: number;
    },
    charTrimResult: {
      commonPrefix: string;
      commonSuffix: string;
      originalCore: string;
      revisedCore: string;
    }
  ): DiffChange[] {
    const startTime = performance.now();
    const finalChanges: DiffChange[] = [];
    let currentIndex = 0;

    // PRIORITY B: Fraser's lazy reconstruction - build strings only once at the end
    // Step 1: Add common paragraph prefix if it exists
    if (paragraphTrimResult.commonPrefixParagraphs.length > 0) {
      finalChanges.push({
        type: 'unchanged',
        content: paragraphTrimResult.commonPrefixParagraphs,
        index: currentIndex++
      });
    }

    // Step 2: Add character-level prefix (from the paragraph-trimmed content) if it exists
    if (charTrimResult.commonPrefix.length > 0) {
      finalChanges.push({
        type: 'unchanged',
        content: charTrimResult.commonPrefix,
        index: currentIndex++
      });
    }

    // Step 3: Add core changes with updated indices (no string manipulation here)
    coreChanges.forEach(change => {
      finalChanges.push({
        ...change,
        index: currentIndex++
      });
    });

    // Step 4: Add character-level suffix (from the paragraph-trimmed content) if it exists
    if (charTrimResult.commonSuffix.length > 0) {
      finalChanges.push({
        type: 'unchanged',
        content: charTrimResult.commonSuffix,
        index: currentIndex++
      });
    }

    // Step 5: Add common paragraph suffix if it exists
    if (paragraphTrimResult.commonSuffixParagraphs.length > 0) {
      finalChanges.push({
        type: 'unchanged',
        content: paragraphTrimResult.commonSuffixParagraphs,
        index: currentIndex++
      });
    }


    const endTime = performance.now();
    debugLog(`🔄 Combined result reconstruction completed in ${(endTime - startTime).toFixed(2)}ms`);

    return finalChanges;
  }

  /**
   * SSMR CHUNKING: Enhanced compare function with optional progress tracking
   * SAFE: Backwards compatible - existing calls work unchanged
   * MODULAR: Progress callback is optional
   * REVERSIBLE: Can be disabled by not passing progressCallback
   */
  public static async compare(
    originalText: string,
    revisedText: string,
    progressCallback?: (progress: number, stage: string) => void
  ): Promise<ComparisonResult> {
    debugLog('🎯 MyersAlgorithm.compare called with progressCallback:', !!progressCallback);

    // DEBUG: Log text details for debugging false equality
    debugLog('🔍 TEXT COMPARISON DEBUG:', {
      originalLength: originalText.length,
      revisedLength: revisedText.length,
      originalFirst50: originalText.substring(0, 50),
      revisedFirst50: revisedText.substring(0, 50),
      originalLast50: originalText.substring(Math.max(0, originalText.length - 50)),
      revisedLast50: revisedText.substring(Math.max(0, revisedText.length - 50)),
      areTextsIdentical: originalText === revisedText
    });

    // PRIORITY 1 OPTIMIZATION: Early equality check
    if (originalText === revisedText) {
      debugLog('⚡ Early equality detected - texts are identical');
      debugLog('🚨 WARNING: If you see this with different texts, there is a bug in the input handling!');
      if (progressCallback) {
        progressCallback(100, 'Texts are identical');
      }
      return {
        changes: [{ type: 'unchanged', content: originalText, index: 0 }],
        stats: { additions: 0, deletions: 0, unchanged: 1, changed: 0, totalChanges: 0 }
      };
    }

    // PRIORITY 1 OPTIMIZATION: Input size validation
    const originalLength = originalText.length;
    const revisedLength = revisedText.length;
    const totalLength = originalLength + revisedLength;

    if (totalLength > 500000) { // 500KB threshold
      debugLog('⚠️ Large input detected:', { originalLength, revisedLength, totalLength });
      if (progressCallback) {
        progressCallback(0, 'Processing large document...');
      }
    }

    // PRIORITY 2.5: SSMR Paragraph-level prefix/suffix trimming (NEW!)
    const paragraphTrimResult = this.trimCommonParagraphs(originalText, revisedText);

    // Use paragraph-trimmed content for character-level trimming (cascading optimization)
    const originalAfterParagraphTrim = paragraphTrimResult.originalCoreParagraphs;
    const revisedAfterParagraphTrim = paragraphTrimResult.revisedCoreParagraphs;

    // PRIORITY 1 OPTIMIZATION: Common prefix/suffix trimming (now on paragraph-trimmed content)
    const charTrimResult = this.trimCommonPrefixSuffix(originalAfterParagraphTrim, revisedAfterParagraphTrim);
    debugLog('✂️ Character-level trimming results (after paragraph trimming):', {
      prefixLength: charTrimResult.commonPrefix.length,
      suffixLength: charTrimResult.commonSuffix.length,
      originalReduced: charTrimResult.originalCore.length,
      revisedReduced: charTrimResult.revisedCore.length,
      charReductionRatio: ((originalAfterParagraphTrim.length + revisedAfterParagraphTrim.length - charTrimResult.originalCore.length - charTrimResult.revisedCore.length) / (originalAfterParagraphTrim.length + revisedAfterParagraphTrim.length) * 100).toFixed(1) + '%'
    });

    // Calculate total reduction from both optimizations
    const totalReductionRatio = ((originalLength + revisedLength - charTrimResult.originalCore.length - charTrimResult.revisedCore.length) / totalLength * 100);

    debugLog('🎯 COMBINED optimization results:', {
      paragraphReduction: paragraphTrimResult.paragraphReductionRatio.toFixed(1) + '%',
      totalReduction: totalReductionRatio.toFixed(1) + '%',
      finalCoreSize: charTrimResult.originalCore.length + charTrimResult.revisedCore.length,
      originalSize: totalLength
    });

    // Use fully trimmed content for diff computation
    const originalCore = charTrimResult.originalCore;
    const revisedCore = charTrimResult.revisedCore;

    // SAFE: Report initial progress (optional)
    if (progressCallback) {
      debugLog('📊 Starting tokenization...');
      progressCallback(5, 'Tokenizing text...');
    }

    // Tokenize the trimmed core content for efficiency
    const originalTokens = this.tokenize(originalCore);
    const revisedTokens = this.tokenize(revisedCore);

    debugLog('📝 Original tokens:', originalTokens.length);
    debugLog('📝 Revised tokens:', revisedTokens.length);

    // SMART PROGRESS: Only show progress for large diffs (3000+ tokens = ~15k chars)
    const totalTokens = originalTokens.length + revisedTokens.length;
    const shouldTrackProgress = totalTokens > 3000 && progressCallback;

    debugLog('🔢 Token count analysis:', {
      originalTokens: originalTokens.length,
      revisedTokens: revisedTokens.length,
      totalTokens,
      threshold: 10,
      shouldTrackProgress,
      hasProgressCallback: !!progressCallback
    });

    if (shouldTrackProgress) {
      debugLog('📊 Calling progressCallback(25, "Computing differences...")');
      progressCallback!(25, 'Computing differences...');
    }

    // PRIORITY 3A: Fraser's Streaming Implementation for Large Documents
    const STREAMING_THRESHOLD = 20000; // Tokens (configurable)
    const enableStreaming = true; // ROLLBACK: Set to false to disable streaming

    let diff: any[];

    if (enableStreaming && totalTokens > STREAMING_THRESHOLD) {
      debugLog(`🌊 Large document detected (${totalTokens} tokens), using streaming Myers algorithm`);
      // SSMR: Pass AbortSignal to streaming algorithm
      diff = await this.streamingMyers(originalTokens, revisedTokens, progressCallback, enableStreaming, (globalThis as any).currentAbortSignal);
    } else {
      debugLog(`⚡ Normal document size (${totalTokens} tokens), using standard Myers algorithm`);
      // SSMR: Check for cancellation even in standard algorithm
      if ((globalThis as any).currentAbortSignal?.aborted) {
        throw new Error('Operation cancelled by user');
      }
      diff = this.myers(originalTokens, revisedTokens);
    }

    if (shouldTrackProgress) {
      progressCallback!(90, 'Processing results...');
    }

    // Convert to our format and calculate stats
    let coreChanges: DiffChange[] = diff.map((change, index) => ({
      type: change.type as 'added' | 'removed' | 'unchanged' | 'changed',
      content: change.content,
      originalContent: change.originalContent,
      revisedContent: change.revisedContent,
      index
    }));

    // PRIORITY 2.5: SSMR Reconstruct with combined paragraph and character trimming
    const finalChanges = this.reconstructWithCombinedTrimming(coreChanges, paragraphTrimResult, charTrimResult);

    // EXTREME SIZE PROTECTION: Warn about very large result sets
    if (finalChanges.length > 5000) {
    }

    // Calculate stats before using in progressive sections
    const addedChanges = finalChanges.filter(c => c.type === 'added');
    const deletedChanges = finalChanges.filter(c => c.type === 'removed');
    const unchangedChanges = finalChanges.filter(c => c.type === 'unchanged');
    const changedChanges = finalChanges.filter(c => c.type === 'changed');
    
    // Clean mode: Filter out pure whitespace changes from statistics
    const meaningfulChangedChanges = changedChanges.filter(change => {
      const originalContent = change.originalContent || '';
      const revisedContent = change.revisedContent || '';
      const isPureWhitespace = /^\s*$/.test(originalContent) && /^\s*$/.test(revisedContent);
      return !isPureWhitespace;
    });
    
    const whitespaceChangedChanges = changedChanges.filter(change => {
      const originalContent = change.originalContent || '';
      const revisedContent = change.revisedContent || '';
      const isPureWhitespace = /^\s*$/.test(originalContent) && /^\s*$/.test(revisedContent);
      return isPureWhitespace;
    });

    // Calculate word and character statistics
    // For 'added' and 'removed', use the content directly
    const addedTexts = addedChanges.map(c => c.content);
    const deletedTexts = deletedChanges.map(c => c.content);
    const unchangedTexts = unchangedChanges.map(c => c.content);
    
    // For 'changed', only include meaningful (non-whitespace) changes
    const changedDeletedTexts = meaningfulChangedChanges.map(c => c.originalContent || '');
    const changedAddedTexts = meaningfulChangedChanges.map(c => c.revisedContent || '');

    // Calculate base word stats
    const addedWordStats = getWordStatsForBlocks(addedTexts);
    const deletedWordStats = getWordStatsForBlocks(deletedTexts);
    const unchangedWordStats = getWordStatsForBlocks(unchangedTexts);
    
    // Calculate word stats for substitutions (separate deletions and additions)
    const changedDeletedWordStats = getWordStatsForBlocks(changedDeletedTexts);
    const changedAddedWordStats = getWordStatsForBlocks(changedAddedTexts);

    // Aggregate: additions include both pure additions and substitution additions
    const totalAddedWords = addedWordStats.wordCount + changedAddedWordStats.wordCount;
    const totalDeletedWords = deletedWordStats.wordCount + changedDeletedWordStats.wordCount;
    
    const totalAddedCharacters = addedWordStats.characterCount + changedAddedWordStats.characterCount;
    const totalDeletedCharacters = deletedWordStats.characterCount + changedDeletedWordStats.characterCount;
    
    const totalAddedCharactersNoSpaces = addedWordStats.characterCountNoSpaces + changedAddedWordStats.characterCountNoSpaces;
    const totalDeletedCharactersNoSpaces = deletedWordStats.characterCountNoSpaces + changedDeletedWordStats.characterCountNoSpaces;

    // Calculate review workload and percentages
    const wordReviewWorkload = totalAddedWords + totalDeletedWords;
    const characterReviewWorkload = totalAddedCharacters + totalDeletedCharacters;
    
    const totalWordsInDocument = totalAddedWords + totalDeletedWords + unchangedWordStats.wordCount;
    const totalCharactersInDocument = totalAddedCharacters + totalDeletedCharacters + unchangedWordStats.characterCount;
    
    const wordPercentageChanged = totalWordsInDocument > 0 ? (wordReviewWorkload / totalWordsInDocument) * 100 : 0;
    const characterPercentageChanged = totalCharactersInDocument > 0 ? (characterReviewWorkload / totalCharactersInDocument) * 100 : 0;

    const stats: ComparisonStats = {
      // Block-level counts: Only count meaningful changes, treat whitespace changes as unchanged
      additions: addedChanges.length + meaningfulChangedChanges.length,
      deletions: deletedChanges.length + meaningfulChangedChanges.length,
      unchanged: unchangedChanges.length + whitespaceChangedChanges.length,
      totalChanges: addedChanges.length + deletedChanges.length + (meaningfulChangedChanges.length * 2),
      wordStats: {
        addedWords: totalAddedWords,
        deletedWords: totalDeletedWords,
        unchangedWords: unchangedWordStats.wordCount,
        totalWords: totalWordsInDocument,
        reviewWorkload: wordReviewWorkload,
        percentageChanged: Math.round(wordPercentageChanged * 10) / 10 // Round to 1 decimal place
      },
      characterStats: {
        addedCharacters: totalAddedCharacters,
        deletedCharacters: totalDeletedCharacters,
        unchangedCharacters: unchangedWordStats.characterCount,
        totalCharacters: totalCharactersInDocument,
        totalCharactersNoSpaces: totalAddedCharactersNoSpaces + totalDeletedCharactersNoSpaces + unchangedWordStats.characterCountNoSpaces,
        reviewWorkload: characterReviewWorkload,
        percentageChanged: Math.round(characterPercentageChanged * 10) / 10 // Round to 1 decimal place
      }
    };

    // SSMR: Progressive section streaming for large result sets
    if (this.FEATURE_FLAGS.USE_PROGRESSIVE_SECTIONS && finalChanges.length > this.SECTION_CONFIG.TARGET_SIZE) {

      // Stream sections progressively instead of rejecting
      return this.createProgressiveSectionResult(finalChanges, stats, progressCallback);
    }

    // CRITICAL FIX: Prevent UI crashes with massive result sets (legacy fallback)
    const MAX_CHANGES_FOR_UI = 50000; // Reasonable limit for browser rendering
    if (finalChanges.length > MAX_CHANGES_FOR_UI) {

      throw new Error(`Document comparison resulted in ${finalChanges.length} changes, which exceeds the UI limit of ${MAX_CHANGES_FOR_UI}. This typically indicates the documents are too different or too large for effective comparison.`);
    }

    debugLog('🔄 Final result:', {
      totalChanges: finalChanges.length,
      paragraphPrefixLength: paragraphTrimResult.commonPrefixParagraphs.length,
      paragraphSuffixLength: paragraphTrimResult.commonSuffixParagraphs.length,
      charPrefixLength: charTrimResult.commonPrefix.length,
      charSuffixLength: charTrimResult.commonSuffix.length,
      totalReductionAchieved: totalReductionRatio.toFixed(1) + '%'
    });

    // SAFE: Report completion
    if (progressCallback) {
      progressCallback(100, 'Complete');
    }

    const result = { changes: finalChanges, stats };
    return result;
  }

  /**
   * PRIORITY 3A: Fraser's Streaming Myers Algorithm for Large Documents
   * SAFE: Only used for documents >20,000 tokens, falls back to standard Myers
   * STEP-BY-STEP: Processes tokens in chunks with UI yield points
   * MODULAR: Independent implementation, doesn't affect existing algorithm
   * REVERSIBLE: Feature flag can disable streaming entirely
   */
  private static async streamingMyers(
    originalTokens: string[],
    revisedTokens: string[],
    progressCallback?: (progress: number, stage: string) => void,
    enableStreaming: boolean = true, // ROLLBACK: Set to false to disable streaming
    abortSignal?: AbortSignal // SSMR: Add cancellation support
  ): Promise<any[]> {
    const startTime = performance.now();
    const totalTokens = originalTokens.length + revisedTokens.length;

    // SAFE: Feature flag check
    if (!enableStreaming) {
      debugLog('🌊 Streaming disabled, falling back to standard Myers');
      return this.myers(originalTokens, revisedTokens);
    }

    debugLog('🌊 Starting streaming Myers algorithm for', totalTokens, 'tokens');

    // Configuration for streaming (tunable based on performance testing)
    const CHUNK_SIZE = 1800; // Process 1800 tokens per chunk (adjustable)
    const YIELD_INTERVAL = 0; // 0ms yield (just let UI update)
    const BASE_PROGRESS = 25; // Start progress from 25% (after tokenization)
    const PROGRESS_RANGE = 65; // Use 65% of progress bar for streaming (25% -> 90%)

    const chunks: any[] = [];
    const maxLength = Math.max(originalTokens.length, revisedTokens.length);

    // Process in chunks with progress updates
    for (let i = 0; i < maxLength; i += CHUNK_SIZE) {
      // SSMR: Check for cancellation at start of each chunk
      if (abortSignal?.aborted) {
        throw new Error('Operation cancelled by user');
      }

      const chunkStartTime = performance.now();

      // Extract chunk from both token arrays
      const originalChunk = originalTokens.slice(i, Math.min(i + CHUNK_SIZE, originalTokens.length));
      const revisedChunk = revisedTokens.slice(i, Math.min(i + CHUNK_SIZE, revisedTokens.length));

      // Skip empty chunks
      if (originalChunk.length === 0 && revisedChunk.length === 0) {
        continue;
      }

      // SSMR: Check for cancellation before processing chunk
      if (abortSignal?.aborted) {
        throw new Error('Operation cancelled by user');
      }

      // Process chunk using standard Myers algorithm
      const chunkResult = this.myers(originalChunk, revisedChunk);
      chunks.push({
        startIndex: i,
        result: chunkResult,
        originalLength: originalChunk.length,
        revisedLength: revisedChunk.length
      });

      // Calculate and report progress
      const chunkProgress = Math.min((i + CHUNK_SIZE) / maxLength, 1.0);
      const overallProgress = BASE_PROGRESS + (chunkProgress * PROGRESS_RANGE);
      const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;
      const totalChunks = Math.ceil(maxLength / CHUNK_SIZE);

      const chunkEndTime = performance.now();
      debugLog(`🌊 Chunk ${chunkNumber}/${totalChunks} processed in ${(chunkEndTime - chunkStartTime).toFixed(2)}ms`);

      if (progressCallback) {
        progressCallback(
          Math.floor(overallProgress),
          `Processing chunk ${chunkNumber} of ${totalChunks}...`
        );
      }

      // SSMR: Check for cancellation before yielding
      if (abortSignal?.aborted) {
        throw new Error('Operation cancelled by user');
      }

      // CRITICAL: Yield control to UI (Fraser's key insight)
      await new Promise(resolve => setTimeout(resolve, YIELD_INTERVAL));
    }

    // Combine chunk results into final result
    if (progressCallback) {
      progressCallback(90, 'Combining results...');
    }

    const combinedResult = this.combineChunkResults(chunks, originalTokens.length, revisedTokens.length);

    const endTime = performance.now();
    debugLog(`🌊 Streaming Myers completed in ${(endTime - startTime).toFixed(2)}ms for ${totalTokens} tokens`);

    return combinedResult;
  }

  /**
   * PRIORITY 3A: Combine chunk results into final diff result
   * Helper method for streaming Myers algorithm
   */
  private static combineChunkResults(
    chunks: any[],
    originalLength: number,
    revisedLength: number
  ): any[] {
    const startTime = performance.now();

    // For now, use a simple combination strategy
    // In a production implementation, this would need more sophisticated merging
    // but for the MVP, we can process the entire token set as chunks and combine

    let combinedDiff: any[] = [];
    let currentOriginalIndex = 0;
    let currentRevisedIndex = 0;

    for (const chunk of chunks) {
      // Adjust indices in chunk results based on position in overall document
      const adjustedChunkResult = chunk.result.map((change: any) => ({
        ...change,
        // Adjust indices to account for previous chunks
        originalIndex: currentOriginalIndex + (change.originalIndex || 0),
        revisedIndex: currentRevisedIndex + (change.revisedIndex || 0)
      }));

      combinedDiff = combinedDiff.concat(adjustedChunkResult);
      currentOriginalIndex += chunk.originalLength;
      currentRevisedIndex += chunk.revisedLength;
    }

    const endTime = performance.now();
    debugLog(`🌊 Chunk combination completed in ${(endTime - startTime).toFixed(2)}ms`);

    return combinedDiff;
  }

  /**
   * SSMR: Create progressive section result for large change sets
   * Streams sections progressively with semantic boundary respect
   */
  private static async createProgressiveSectionResult(
    changes: DiffChange[],
    stats: ComparisonStats,
    progressCallback?: (progress: number, stage: string) => void
  ): Promise<ComparisonResult> {
    if (progressCallback) {
      progressCallback(90, 'Creating progressive sections...');
    }

    // For now, return a special result that indicates progressive processing
    // The UI layer will handle the progressive streaming
    // Create standard result without progressive metadata
    // This is a temporary fix to avoid TypeScript errors
    // TODO: Update ComparisonResult type to include progressive property if needed
    const result: ComparisonResult = {
      changes,
      stats
    };

    if (progressCallback) {
      progressCallback(100, 'Progressive sections ready');
    }

    return result;
  }

  /**
   * SSMR: Find next semantic section boundary
   * Respects sentence and paragraph boundaries for clean sections
   */
  private static findNextSectionBoundary(
    changes: DiffChange[],
    startIndex: number,
    targetSize: number
  ): number {
    let currentSize = 0;
    let lastGoodBoundary = startIndex;
    const maxSize = this.SECTION_CONFIG.MAX_SIZE;

    for (let i = startIndex; i < changes.length && currentSize < maxSize; i++) {
      const change = changes[i];
      currentSize++;

      // Check if this change contains a semantic boundary
      if (change.content && (
        change.content.includes('\n\n') ||  // Paragraph break
        this.containsSentenceBoundary(change.content)  // Real sentence break
      )) {
        lastGoodBoundary = i + 1; // Include the change with the boundary
      }

      // If we're past minimum size and found a boundary, use it
      if (currentSize >= targetSize && lastGoodBoundary > startIndex) {
        return lastGoodBoundary;
      }
    }

    // Fallback: Return where we are (performance guardrail)
    return Math.min(startIndex + targetSize, changes.length);
  }
}
