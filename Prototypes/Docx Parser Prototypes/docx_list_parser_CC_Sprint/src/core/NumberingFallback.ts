/**
 * NumberingFallback - Provides default numbering when library fails
 *
 * This module patches the @omer-go library's NumberingConverter to provide
 * graceful fallback when numbering definitions are missing.
 */

interface NumberingState {
  counters: { [numId: string]: number[] };
}

export class NumberingFallback {
  private static state: NumberingState = {
    counters: {}
  };

  /**
   * Reset all numbering counters
   */
  static reset(): void {
    this.state.counters = {};
  }

  /**
   * Generate default numbering when library fails
   *
   * @param numId - Numbering instance ID
   * @param ilvl - Indentation level (0-8)
   * @returns Formatted number string (e.g., "1", "1.1", "1.1.1")
   */
  static getDefaultNumbering(numId: number, ilvl: number): string {
    // Initialize counter array for this numId if not exists
    if (!this.state.counters[numId]) {
      this.state.counters[numId] = new Array(9).fill(0);
    }

    // Increment counter at current level
    this.state.counters[numId][ilvl]++;

    // Reset all deeper levels
    for (let i = ilvl + 1; i < 9; i++) {
      this.state.counters[numId][i] = 0;
    }

    // Build number string from all levels up to current
    const numbers: number[] = [];
    for (let i = 0; i <= ilvl; i++) {
      numbers.push(this.state.counters[numId][i]);
    }

    // Format based on nesting level
    if (ilvl === 0) {
      // Top level: "1.", "2.", "3."
      return numbers[0] + '.';
    } else {
      // Nested: "1.1.", "1.2.1.", etc.
      return numbers.join('.') + '.';
    }
  }

  /**
   * Patch the library's conversion to add fallback
   *
   * This monkey-patches the library at runtime to intercept errors
   * and provide default numbering instead of bullets.
   */
  static patchLibrary(): void {
    // Save original console.warn
    const originalWarn = console.warn;

    // Track when we're in a conversion
    let inConversion = false;
    let lastNumId: number | null = null;
    let lastIlvl: number | null = null;

    // Intercept console.warn to detect numbering failures
    console.warn = (...args: any[]) => {
      if (inConversion && typeof args[0] === 'string' && args[0].includes('Numbering level not found')) {
        // Extract numId and ilvl from error message
        const match = args[0].match(/numId: (\d+), ilvl: (\d+)/);
        if (match) {
          lastNumId = parseInt(match[1]);
          lastIlvl = parseInt(match[2]);
        }
      }
      // Still log the warning for debugging
      originalWarn(...args);
    };

    // Mark when we're in conversion (set by DocxListExtractor)
    (window as any).__DOCX_CONVERSION_ACTIVE__ = () => {
      inConversion = true;
    };

    (window as any).__DOCX_CONVERSION_COMPLETE__ = () => {
      inConversion = false;
      lastNumId = null;
      lastIlvl = null;
    };

    // Provide access to fallback numbering
    (window as any).__GET_FALLBACK_NUMBERING__ = () => {
      if (lastNumId !== null && lastIlvl !== null) {
        return this.getDefaultNumbering(lastNumId, lastIlvl);
      }
      return null;
    };
  }

  /**
   * Post-process text to replace bullets with calculated numbers
   *
   * This is a simpler approach that fixes the output after conversion.
   * IMPROVED: Now detects multiple bullet types and preserves bullets when appropriate.
   *
   * @param text - Converted text with bullets
   * @param hasNumberingErrors - Whether numbering errors occurred
   * @returns Text with bullets replaced by numbers where appropriate
   */
  static postProcessText(text: string, hasNumberingErrors: boolean): string {
    if (!hasNumberingErrors) {
      return text; // No errors, return as-is
    }

    // Reset counters for this document
    this.reset();

    const lines = text.split('\n');
    const processedLines: string[] = [];

    // Multiple bullet patterns to detect
    const bulletPatterns = [
      { regex: /^(\s*)•\s+(.*)$/, char: '•' },      // Standard bullet
      { regex: /^(\s*)◦\s+(.*)$/, char: '◦' },      // Circle bullet
      { regex: /^(\s*)▪\s+(.*)$/, char: '▪' },      // Square bullet
      { regex: /^(\s*)○\s+(.*)$/, char: '○' },      // Hollow circle
      { regex: /^(\s*)▫\s+(.*)$/, char: '▫' },      // Hollow square
      { regex: /^(\s*)-\s+(.*)$/, char: '-' },       // Hyphen bullet
      { regex: /^(\s*)·\s+(.*)$/, char: '·' },       // Middle dot
      { regex: /^(\s*)➢\s+(.*)$/, char: '➢' },      // Arrow bullet
    ];

    for (const line of lines) {
      let matched = false;

      // Try each bullet pattern
      for (const pattern of bulletPatterns) {
        const match = line.match(pattern.regex);
        if (match) {
          const indent = match[1];
          const content = match[2];

          // Calculate indentation level (4 spaces = 1 level)
          const level = Math.floor(indent.length / 4);

          // STRATEGY: Only convert standard bullet (•) to numbers
          // Preserve other bullet types as they may be intentional
          if (pattern.char === '•') {
            // This is likely a failed numbered list - convert to number
            const number = this.getDefaultNumbering(0, level);
            processedLines.push(`${indent}${number} ${content}`);
          } else {
            // Preserve other bullet types (user likely intended bullets)
            processedLines.push(line);
          }

          matched = true;
          break;
        }
      }

      if (!matched) {
        // Not a list item, keep as-is
        processedLines.push(line);
      }
    }

    return processedLines.join('\n');
  }

  /**
   * Analyze text to detect list patterns
   * IMPROVED: Now detects all bullet types
   *
   * @param text - Text to analyze
   * @returns Statistics about list items found
   */
  static analyzeListItems(text: string): {
    totalLines: number;
    bulletLines: number;
    indentationLevels: number[];
  } {
    const lines = text.split('\n');
    let bulletCount = 0;
    const levels = new Set<number>();

    // Detect all bullet types
    const bulletPattern = /^(\s*)([•◦▪○▫\-·➢])\s+/;

    for (const line of lines) {
      const bulletMatch = line.match(bulletPattern);
      if (bulletMatch) {
        bulletCount++;
        const level = Math.floor(bulletMatch[1].length / 4);
        levels.add(level);
      }
    }

    return {
      totalLines: lines.length,
      bulletLines: bulletCount,
      indentationLevels: Array.from(levels).sort((a, b) => a - b)
    };
  }
}

// Initialize patch on module load
NumberingFallback.patchLibrary();
