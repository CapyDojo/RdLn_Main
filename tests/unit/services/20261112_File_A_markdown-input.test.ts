import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FileProcessingService } from '@/services/FileProcessingService';
import { FileTypeDetector } from '@/services/FileTypeDetector';

const { JSDOM } = await vi.importActual<{ JSDOM: new () => { window: Window & typeof globalThis } }>('jsdom');

describe('Markdown file input', () => {
  const { window } = new JSDOM();
  const service = new FileProcessingService();
  const source = '# Café\r\n\r\n- **bold** [link](https://example.com)  \r\n    code\r\n';

  beforeEach(() => {
    // The shared setup replaces FileReader with a mock that never fires load events.
    vi.stubGlobal('FileReader', window.FileReader);
  });
  afterAll(() => window.close());

  it.each([
    ['notes.md', 'text/markdown'],
    ['NOTES.MD', ''],
    ['notes.md', 'text/plain'],
    ['notes.md', 'application/octet-stream']
  ])('reads %s (%s) as literal text', async (name, type) => {
    const file = new window.File([source], name, { type });

    expect(FileTypeDetector.isMarkdown(file)).toBe(true);
    expect(FileTypeDetector.getFileCategory(file)).toBe('txt');
    await expect(service.processFile(file)).resolves.toMatchObject({ content: source, method: 'text-read' });
  });

  it('uses the text file size limit for Markdown', () => {
    const file = new window.File([new Uint8Array(10 * 1024 * 1024 + 1)], 'oversized.md');

    expect(service.validateFile(file)).toMatchObject({ valid: false, message: expect.stringContaining('too large') });
  });
});
