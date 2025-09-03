import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  generateClipboardHTML, 
  generateClipboardPlainText, 
  copyToClipboardMultiFormat,
  isMultiFormatClipboardSupported 
} from '../clipboardUtils';
import { DiffChange } from '../../types';

// Mock clipboard API
const mockWriteText = vi.fn();
const mockWrite = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock navigator.clipboard
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: mockWriteText,
      write: mockWrite
    },
    writable: true
  });
  
  // Mock ClipboardItem
  global.ClipboardItem = vi.fn().mockImplementation((data) => ({ data }));
  global.Blob = vi.fn().mockImplementation((content, options) => ({ content, options }));
});

describe('clipboardUtils', () => {
  const mockChanges: DiffChange[] = [
    { type: 'unchanged', content: 'Normal text ', index: 0 },
    { type: 'added', content: 'added content', index: 1 },
    { type: 'removed', content: 'removed content', index: 2 },
    { type: 'changed', originalContent: 'old text', revisedContent: 'new text', content: '', index: 3 },
    { type: 'unchanged', content: ' end', index: 4 }
  ];

  describe('generateClipboardHTML', () => {
    it('should generate HTML with inline styles for all change types', () => {
      const html = generateClipboardHTML(mockChanges);
      
      expect(html).toContain('<div style="font-family: serif; line-height: 1.6; white-space: pre-wrap;">');
      expect(html).toContain('Normal text ');
      expect(html).toContain('background-color: #dcfce7'); // Added content styling
      expect(html).toContain('background-color: #fef2f2'); // Removed content styling
      expect(html).toContain('text-decoration: underline'); // Added content decoration
      expect(html).toContain('text-decoration: line-through'); // Removed content decoration
      expect(html).toContain('old text'); // Changed original content
      expect(html).toContain('new text'); // Changed revised content
      expect(html).toContain('</div>');
    });

    it('should escape HTML special characters', () => {
      const changesWithSpecialChars: DiffChange[] = [
        { type: 'added', content: '<script>alert("test")</script>', index: 0 },
        { type: 'unchanged', content: 'Line 1\nLine 2', index: 1 }
      ];
      
      const html = generateClipboardHTML(changesWithSpecialChars);
      
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&quot;test&quot;');
      expect(html).toContain('<br>'); // Newlines converted to <br>
      expect(html).not.toContain('<script>'); // Should not contain unescaped script tags
    });

    it('should handle empty or invalid input', () => {
      expect(generateClipboardHTML([])).toBe('<div style="font-family: serif; line-height: 1.6; white-space: pre-wrap;"></div>');
      expect(generateClipboardHTML(null as any)).toBe('');
      expect(generateClipboardHTML(undefined as any)).toBe('');
    });
  });

  describe('generateClipboardPlainText', () => {
    it('should extract plain text correctly', () => {
      const plainText = generateClipboardPlainText(mockChanges);
      
      // Should include: unchanged + added + revised (not removed or original)
      expect(plainText).toBe('Normal text added contentnew text end');
    });

    it('should handle changed content by using revised content', () => {
      const changedOnlyChanges: DiffChange[] = [
        { type: 'changed', originalContent: 'old', revisedContent: 'new', content: '', index: 0 }
      ];
      
      const plainText = generateClipboardPlainText(changedOnlyChanges);
      expect(plainText).toBe('new');
    });

    it('should handle empty or invalid input', () => {
      expect(generateClipboardPlainText([])).toBe('');
      expect(generateClipboardPlainText(null as any)).toBe('');
      expect(generateClipboardPlainText(undefined as any)).toBe('');
    });
  });

  describe('copyToClipboardMultiFormat', () => {
    it('should use multi-format clipboard when supported', async () => {
      await copyToClipboardMultiFormat(mockChanges);
      
      expect(global.ClipboardItem).toHaveBeenCalledWith({
        'text/html': expect.any(Object),
        'text/plain': expect.any(Object)
      });
      expect(mockWrite).toHaveBeenCalledWith([expect.any(Object)]);
    });

    it('should fallback to plain text when ClipboardItem is not supported', async () => {
      // Remove ClipboardItem support
      global.ClipboardItem = undefined as any;
      
      await copyToClipboardMultiFormat(mockChanges);
      
      expect(mockWriteText).toHaveBeenCalledWith('Normal text added contentnew text end');
      expect(mockWrite).not.toHaveBeenCalled();
    });

    it('should handle clipboard API failures gracefully', async () => {
      mockWrite.mockRejectedValueOnce(new Error('Clipboard access denied'));
      
      await copyToClipboardMultiFormat(mockChanges);
      
      // Should fallback to plain text
      expect(mockWriteText).toHaveBeenCalledWith('Normal text added contentnew text end');
    });

    it('should handle complete clipboard API unavailability', async () => {
      // Remove all clipboard support
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true
      });
      
      // Should not throw error
      await expect(copyToClipboardMultiFormat(mockChanges)).resolves.toBeUndefined();
    });
  });

  describe('isMultiFormatClipboardSupported', () => {
    it('should return true when both clipboard and ClipboardItem are supported', () => {
      expect(isMultiFormatClipboardSupported()).toBe(true);
    });

    it('should return false when ClipboardItem is not supported', () => {
      global.ClipboardItem = undefined as any;
      expect(isMultiFormatClipboardSupported()).toBe(false);
    });

    it('should return false when clipboard API is not supported', () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true
      });
      expect(isMultiFormatClipboardSupported()).toBe(false);
    });
  });
});