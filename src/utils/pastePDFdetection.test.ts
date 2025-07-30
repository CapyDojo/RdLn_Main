import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { test } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { test } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { test } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { test } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { test } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { test } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { test } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { test } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { test } from 'vitest';
import { describe } from 'vitest';
import { describe } from 'vitest';
import { analyzePasteContext, getFormattingLevel, getSourceDescription, FormatLevel } from './pastePDFdetection';

// Mock DataTransferItem for testing
class MockDataTransferItem implements DataTransferItem {
  kind: string = 'string';
  type: string;

  constructor(type: string) {
    this.type = type;
  }

  getAsFile(): File | null {
    return null;
  }

  getAsString(callback: FunctionStringCallback | null): void {
    if (callback) callback('test content');
  }

  webkitGetAsEntry(): FileSystemEntry | null {
    return null;
  }
}

describe('Paste PDF Detection', () => {
  describe('analyzePasteContext', () => {
    test('detects Word/Google Docs (HTML + Plain)', () => {
      const items = [
        new MockDataTransferItem('text/html'),
        new MockDataTransferItem('text/plain')
      ];

      const context = analyzePasteContext(items);

      expect(context.sourceType).toBe('formatted');
      expect(context.hasHtml).toBe(true);
      expect(context.hasPlainOnly).toBe(false);
      expect(context.formatLevel).toBe('RTF_HTML_Paste_Format');
      expect(context.detectedSource).toContain('Rich text application');
    });

    test('detects RTF source (RTF + Plain)', () => {
      const items = [
        new MockDataTransferItem('text/rtf'),
        new MockDataTransferItem('text/plain')
      ];

      const context = analyzePasteContext(items, 'Regular RTF content without PDF indicators');

      expect(context.sourceType).toBe('formatted');
      expect(context.hasRtf).toBe(true);
      expect(context.formatLevel).toBe('RTF_HTML_Paste_Format');
      expect(context.detectedSource).toContain('RTF application');
    });

    test('detects PDF-like RTF content via non-punctuation ratio', () => {
      const items = [
        new MockDataTransferItem('text/rtf'),
        new MockDataTransferItem('text/plain')
      ];

      // Simulate PDF content: lines ending without punctuation (typical PDF artificial breaks)
      const pdfLikeContent = `This Agreement dated July 25, 2025, is entered into by Maiora Securities Limited
a company incorporated in the British Virgin Islands with registration number
BVI-123456 and having its registered office at Road Harbour Financial Centre
Road Town, Tortola, British Virgin Islands VG1110 and its principal place
of business at 1234 Financial District, Hong Kong and hereinafter referred`;

      const context = analyzePasteContext(items, pdfLikeContent);

      expect(context.sourceType).toBe('plain');
      expect(context.hasRtf).toBe(true);
      expect(context.formatLevel).toBe('PDF_Paste_Format');
      expect(context.detectedSource).toContain('PDF viewer');
    });

    test('detects plain text source (Plain only)', () => {
      const items = [
        new MockDataTransferItem('text/plain')
      ];

      const context = analyzePasteContext(items);

      expect(context.sourceType).toBe('plain');
      expect(context.hasPlainOnly).toBe(true);
      expect(context.formatLevel).toBe('PDF_Paste_Format');
      expect(context.detectedSource).toContain('Plain text source');
    });

    test('detects Word document (HTML + RTF + Plain)', () => {
      const items = [
        new MockDataTransferItem('text/html'),
        new MockDataTransferItem('text/rtf'),
        new MockDataTransferItem('text/plain')
      ];

      const context = analyzePasteContext(items);

      expect(context.sourceType).toBe('formatted');
      expect(context.formatCount).toBe(3);
      expect(context.formatLevel).toBe('RTF_HTML_Paste_Format');
      expect(context.detectedSource).toContain('Word document');
    });

    test('detects truly complex formats (4+ formats)', () => {
      const items = [
        new MockDataTransferItem('text/html'),
        new MockDataTransferItem('text/plain'),
        new MockDataTransferItem('text/rtf'),
        new MockDataTransferItem('application/x-custom')
      ];

      const context = analyzePasteContext(items);

      expect(context.sourceType).toBe('mixed');
      expect(context.formatCount).toBe(4);
      expect(context.formatLevel).toBe('None');
    });
  });

  describe('getFormattingLevel', () => {
    test('respects user override', () => {
      const plainContext = analyzePasteContext([new MockDataTransferItem('text/plain')]);

      // User forces no formatting despite plain text
      expect(getFormattingLevel(plainContext, true, false)).toBe('None');

      // User forces formatting despite formatted text
      const htmlContext = analyzePasteContext([
        new MockDataTransferItem('text/html'),
        new MockDataTransferItem('text/plain')
      ]);
      expect(getFormattingLevel(htmlContext, true, true)).toBe('PDF_Paste_Format');
    });

    test('respects user auto-format preference when no override', () => {
      const plainContext = analyzePasteContext([new MockDataTransferItem('text/plain')]);

      // User has auto-format disabled
      expect(getFormattingLevel(plainContext, false)).toBe('None');

      // User has auto-format enabled
      expect(getFormattingLevel(plainContext, true)).toBe('PDF_Paste_Format');
    });

    test('uses intelligent detection when user has auto-format enabled', () => {
      // Plain text should get full formatting
      const plainContext = analyzePasteContext([new MockDataTransferItem('text/plain')]);
      expect(getFormattingLevel(plainContext, true)).toBe('PDF_Paste_Format');

      // HTML content should get minimal formatting
      const htmlContext = analyzePasteContext([
        new MockDataTransferItem('text/html'),
        new MockDataTransferItem('text/plain')
      ]);
      expect(getFormattingLevel(htmlContext, true)).toBe('RTF_HTML_Paste_Format');
    });
  });

  describe('getSourceDescription', () => {
    test('returns appropriate descriptions', () => {
      const plainContext = analyzePasteContext([new MockDataTransferItem('text/plain')]);
      expect(getSourceDescription(plainContext)).toBe('Plain text');

      const htmlContext = analyzePasteContext([
        new MockDataTransferItem('text/html'),
        new MockDataTransferItem('text/plain')
      ]);
      expect(getSourceDescription(htmlContext)).toBe('Formatted document');

      const rtfContext = analyzePasteContext([
        new MockDataTransferItem('text/rtf'),
        new MockDataTransferItem('text/plain')
      ]);
      expect(getSourceDescription(rtfContext)).toBe('RTF document');
    });
  });
});