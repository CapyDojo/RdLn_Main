import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  generateClipboardHTML, 
  generateClipboardPlainText,
  generateWordCompatibleHTML,
  copyToClipboardMultiFormat,
  isMultiFormatClipboardSupported
} from '@/utils/clipboardUtils';
import { DiffChange } from '@/types';
import { createMockChanges } from '@/testing/test-utils';

describe('clipboardUtils', () => {
  beforeEach(() => {
    // Reset clipboard API mocks
    vi.clearAllMocks();
  });

  describe('generateClipboardHTML', () => {
    it('generates HTML for added content', () => {
      const changes: DiffChange[] = [
        { type: 'added', content: 'New text' }
      ];

      const html = generateClipboardHTML(changes);

      expect(html).toContain('<div style="font-family: serif');
      expect(html).toContain('New text');
      expect(html).toContain('background: linear-gradient(135deg, #f0fdf4');
      expect(html).toContain('text-decoration: underline');
    });

    it('generates HTML for removed content', () => {
      const changes: DiffChange[] = [
        { type: 'removed', content: 'Deleted text' }
      ];

      const html = generateClipboardHTML(changes);

      expect(html).toContain('Deleted text');
      expect(html).toContain('background: linear-gradient(135deg, #fef7f7');
      expect(html).toContain('text-decoration: line-through');
    });

    it('generates HTML for changed content', () => {
      const changes: DiffChange[] = [
        { 
          type: 'changed', 
          originalContent: 'Old text',
          revisedContent: 'New text'
        }
      ];

      const html = generateClipboardHTML(changes);

      expect(html).toContain('Old text');
      expect(html).toContain('New text');
      expect(html).toContain('line-through'); // For original
      expect(html).toContain('underline'); // For revised
    });

    it('escapes HTML special characters', () => {
      const changes: DiffChange[] = [
        { type: 'added', content: '<script>alert("test")</script>' }
      ];

      const html = generateClipboardHTML(changes);

      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&quot;test&quot;');
      expect(html).not.toContain('<script>');
    });

    it('converts newlines to <br> tags', () => {
      const changes: DiffChange[] = [
        { type: 'added', content: 'Line 1\nLine 2' }
      ];

      const html = generateClipboardHTML(changes);

      expect(html).toContain('Line 1<br>Line 2');
    });

    it('handles empty changes array', () => {
      const html = generateClipboardHTML([]);

      expect(html).toBe('<div style="font-family: serif; line-height: 1.5; white-space: pre-wrap;"></div>');
    });

    it('handles null/undefined input', () => {
      expect(generateClipboardHTML(null as any)).toBe('');
      expect(generateClipboardHTML(undefined as any)).toBe('');
    });
  });

  describe('generateClipboardPlainText', () => {
    it('extracts plain text from changes', () => {
      const changes: DiffChange[] = [
        { type: 'unchanged', content: 'Keep ' },
        { type: 'added', content: 'this ' },
        { type: 'removed', content: 'old ' },
        { type: 'unchanged', content: 'text' }
      ];

      const plainText = generateClipboardPlainText(changes);

      expect(plainText).toBe('Keep this text');
    });

    it('uses revised content for changed items', () => {
      const changes: DiffChange[] = [
        { 
          type: 'changed', 
          originalContent: 'old',
          revisedContent: 'new'
        }
      ];

      const plainText = generateClipboardPlainText(changes);

      expect(plainText).toBe('new');
    });

    it('skips removed content', () => {
      const changes: DiffChange[] = [
        { type: 'unchanged', content: 'Hello ' },
        { type: 'removed', content: 'deleted ' },
        { type: 'unchanged', content: 'World' }
      ];

      const plainText = generateClipboardPlainText(changes);

      expect(plainText).toBe('Hello World');
    });

    it('handles empty content gracefully', () => {
      const changes: DiffChange[] = [
        { type: 'added', content: undefined },
        { type: 'removed', content: null }
      ];

      const plainText = generateClipboardPlainText(changes);

      expect(plainText).toBe('');
    });
  });

  describe('generateWordCompatibleHTML', () => {
    it('uses solid colors instead of gradients', () => {
      const changes: DiffChange[] = [
        { type: 'added', content: 'New text' }
      ];

      const html = generateWordCompatibleHTML(changes);

      expect(html).toContain('background-color: #f0fdf4');
      expect(html).not.toContain('linear-gradient');
    });

    it('uses simplified styling for Word compatibility', () => {
      const changes: DiffChange[] = [
        { type: 'removed', content: 'Old text' }
      ];

      const html = generateWordCompatibleHTML(changes);

      expect(html).toContain('border: 2px solid #dc2626');
      expect(html).not.toContain('border-radius');
    });
  });

  describe('isMultiFormatClipboardSupported', () => {
    it('returns true when ClipboardItem is available', () => {
      // Mock ClipboardItem availability
      (global as any).ClipboardItem = class ClipboardItem {};
      Object.defineProperty(navigator, 'clipboard', {
        value: { write: vi.fn() },
        writable: true
      });

      expect(isMultiFormatClipboardSupported()).toBe(true);
    });

    it('returns false when ClipboardItem is not available', () => {
      delete (global as any).ClipboardItem;
      
      expect(isMultiFormatClipboardSupported()).toBe(false);
    });
  });

  describe('copyToClipboardMultiFormat', () => {
    const mockChanges: DiffChange[] = [
      { type: 'added', content: 'Test content' }
    ];

    beforeEach(() => {
      // Reset navigator.clipboard
      delete (navigator as any).clipboard;
    });

    it('uses ClipboardItem for multi-format copy when supported', async () => {
      const mockWrite = vi.fn().mockResolvedValue(undefined);
      const mockClipboardItem = vi.fn();
      
      (global as any).ClipboardItem = mockClipboardItem;
      Object.defineProperty(navigator, 'clipboard', {
        value: { write: mockWrite },
        writable: true
      });

      await copyToClipboardMultiFormat(mockChanges);

      expect(mockClipboardItem).toHaveBeenCalledWith({
        'text/html': expect.any(Blob),
        'text/plain': expect.any(Blob)
      });
      expect(mockWrite).toHaveBeenCalledWith([expect.any(Object)]);
    });

    it('falls back to plain text when ClipboardItem is not supported', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true
      });

      await copyToClipboardMultiFormat(mockChanges);

      expect(mockWriteText).toHaveBeenCalledWith('Test content');
    });

    it('handles clipboard API not being available', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await copyToClipboardMultiFormat(mockChanges);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Clipboard API not available, simulating copy operation'
      );
    });

    it('handles clipboard write failures gracefully', async () => {
      const mockWrite = vi.fn().mockRejectedValue(new Error('Write failed'));
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      (global as any).ClipboardItem = vi.fn();
      Object.defineProperty(navigator, 'clipboard', {
        value: { write: mockWrite, writeText: mockWriteText },
        writable: true
      });

      await copyToClipboardMultiFormat(mockChanges);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Multi-format clipboard failed, falling back to plain text:',
        expect.any(Error)
      );
      expect(mockWriteText).toHaveBeenCalled();
    });

    it('throws error when no clipboard API is available and write fails', async () => {
      const mockWrite = vi.fn().mockRejectedValue(new Error('Write failed'));
      
      (global as any).ClipboardItem = vi.fn();
      Object.defineProperty(navigator, 'clipboard', {
        value: { write: mockWrite },
        writable: true
      });

      await expect(copyToClipboardMultiFormat(mockChanges)).rejects.toThrow(
        'Clipboard access not available'
      );
    });
  });

  describe('integration tests', () => {
    it('generates consistent output between HTML and plain text', () => {
      const changes = createMockChanges(3);
      
      const html = generateClipboardHTML(changes);
      const plainText = generateClipboardPlainText(changes);
      
      // HTML should contain all the plain text content
      expect(html.length).toBeGreaterThan(plainText.length);
      
      // Plain text should not contain HTML tags
      expect(plainText).not.toContain('<');
      expect(plainText).not.toContain('>');
    });

    it('handles complex change sequences', () => {
      const changes: DiffChange[] = [
        { type: 'unchanged', content: 'The ' },
        { type: 'removed', content: 'quick' },
        { type: 'added', content: 'slow' },
        { type: 'unchanged', content: ' brown fox' },
        { type: 'changed', originalContent: 'jumps', revisedContent: 'walks' }
      ];

      const html = generateClipboardHTML(changes);
      const plainText = generateClipboardPlainText(changes);

      expect(plainText).toBe('The slow brown foxwalks');
      expect(html).toContain('The ');
      expect(html).toContain('slow');
      expect(html).toContain('jumps');
      expect(html).toContain('walks');
      expect(html).not.toContain('quick'); // Removed content should still appear in HTML for review
    });
  });
});