import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FilePairSnapshot, TOO_MANY_FILES_MESSAGE, useFilePairImport } from '@/hooks/useFilePairImport';

const { processFile, validateFile } = vi.hoisted(() => ({ processFile: vi.fn(), validateFile: vi.fn() }));
vi.mock('@/services/FileProcessingService', () => ({
  FileProcessingService: class {
    processFile = processFile;
    validateFile = validateFile;
  }
}));

const snapshot: FilePairSnapshot = {
  originalText: 'Existing original', revisedText: 'Existing revised',
  originalFileSource: { filePath: 'C:/old.docx', fileName: 'old.docx', fileType: 'docx', importedText: 'Existing original' },
  revisedFileSource: null,
  originalDisconnectedFileSource: null, revisedDisconnectedFileSource: null,
  originalFileName: 'old.docx', revisedFileName: null
};
const file = (name: string, lastModified: number) => Object.assign(new File(['text'], name), { lastModified });
const deferred = () => {
  let resolve!: (value: { content: string }) => void;
  const promise = new Promise<{ content: string }>(done => { resolve = done; });
  return { promise, resolve };
};

function setup(busy = false) {
  const commit = vi.fn();
  const pending = vi.fn();
  const hook = renderHook(({ current, isBusy }) => useFilePairImport(current, commit, isBusy, pending), {
    initialProps: { current: snapshot, isBusy: busy }
  });
  return { ...hook, commit, pending };
}

describe('two-file import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.isElectron = false;
    validateFile.mockReturnValue({ valid: true });
    processFile.mockImplementation(async (input: File) => ({ content: `Text of ${input.name}` }));
  });

  it.each([false, true])('assigns newer to Revised regardless of file-list order (reverse=%s)', async reverse => {
    const { result, commit } = setup();
    const files = [file('old.txt', 100), file('new.txt', 200)];
    await act(async () => { await result.current.importFiles(reverse ? files.reverse() : files); });
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith(expect.objectContaining({
      originalText: 'Text of old.txt', revisedText: 'Text of new.txt',
      originalFileName: 'old.txt', revisedFileName: 'new.txt',
      originalFileSource: null, revisedFileSource: null,
      originalDisconnectedFileSource: null, revisedDisconnectedFileSource: null
    }));
    expect(result.current.feedback?.message).toContain('newer file is in Revised');
  });

  it.each([[100, 100], [0, 200], [NaN, 200]])('uses drop order with feedback for ambiguous dates (%s, %s)', async (first, second) => {
    const { result, commit } = setup();
    await act(async () => { await result.current.importFiles([file('first.txt', first), file('second.txt', second)]); });
    expect(commit.mock.calls[0][0].originalFileName).toBe('first.txt');
    expect(result.current.feedback?.message).toContain('check the order');
  });

  it('accepts mixed document types without preferring DOCX over an older PDF', async () => {
    const { result, commit } = setup();
    await act(async () => { await result.current.importFiles([file('new.docx', 200), file('old.pdf', 100)]); });
    expect(commit.mock.calls[0][0].originalFileName).toBe('old.pdf');
  });

  it('rejects more than two files before validation or extraction', async () => {
    const { result, commit } = setup();
    await act(async () => { await result.current.importFiles([file('a.txt', 1), file('b.txt', 2), file('c.txt', 3)]); });
    expect(result.current.feedback).toEqual({ error: true, message: TOO_MANY_FILES_MESSAGE });
    expect(validateFile).not.toHaveBeenCalled();
    expect(processFile).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
  });

  it('leaves single-file processing to the panel', async () => {
    const { result, commit } = setup();
    await act(async () => { await result.current.importFiles([file('one.txt', 1)]); });
    expect(processFile).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
  });

  it.each(['image.png', 'legacy.doc'])('rejects an unsupported pair containing %s without a partial import', async name => {
    const { result, commit } = setup();
    await act(async () => { await result.current.importFiles([file('a.txt', 1), file(name, 2)]); });
    expect(result.current.feedback?.message).toContain(name);
    expect(processFile).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
  });

  it('validates both files before starting extraction', async () => {
    validateFile.mockReturnValueOnce({ valid: true }).mockReturnValueOnce({ valid: false, message: 'File too large' });
    const { result, commit } = setup();
    await act(async () => { await result.current.importFiles([file('a.txt', 1), file('large.txt', 2)]); });
    expect(processFile).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
    expect(result.current.feedback?.message).toContain('large.txt: File too large');
  });

  it.each(['failure', 'empty'])('preserves both panels if the second extraction returns %s', async kind => {
    processFile.mockResolvedValueOnce({ content: 'First read succeeds' });
    if (kind === 'failure') processFile.mockRejectedValueOnce({ message: 'Corrupt document' });
    else processFile.mockResolvedValueOnce({ content: '  ' });
    const { result, commit, pending } = setup();
    await act(async () => { await result.current.importFiles([file('a.txt', 1), file('bad.pdf', 2)]); });
    expect(commit).not.toHaveBeenCalled();
    expect(result.current.feedback?.message).toContain('bad.pdf:');
    expect(result.current.feedback?.message).toContain('Both panels were left unchanged');
    expect(result.current.isImporting).toBe(false);
    expect(pending).toHaveBeenLastCalledWith(false);
  });

  it('restores texts, filenames and linked sources with one Undo import', async () => {
    const { result, commit, rerender } = setup();
    await act(async () => { await result.current.importFiles([file('a.txt', 1), file('b.txt', 2)]); });
    rerender({ current: commit.mock.calls[0][0], isBusy: false });
    act(() => result.current.undoImport());
    expect(commit).toHaveBeenLastCalledWith(snapshot);
    expect(result.current.canUndoImport).toBe(false);
  });

  it('preserves native Word source paths and text provenance in Electron', async () => {
    window.isElectron = true;
    const a = Object.assign(file('a.docx', 1), { path: 'C:/a.docx' });
    const b = Object.assign(file('b.pdf', 2), { path: 'C:/b.pdf' });
    const { result, commit } = setup();
    await act(async () => { await result.current.importFiles([a, b]); });
    expect(commit.mock.calls[0][0].originalFileSource).toEqual({
      filePath: 'C:/a.docx', fileName: 'a.docx', fileType: 'docx', importedText: 'Text of a.docx'
    });
    expect(commit.mock.calls[0][0].revisedFileSource.fileType).toBe('pdf');
  });

  it('does not commit until both files finish', async () => {
    const second = deferred();
    processFile.mockResolvedValueOnce({ content: 'First text' }).mockReturnValueOnce(second.promise);
    const { result, commit, pending } = setup();
    let operation!: Promise<void>;
    await act(async () => { operation = result.current.importFiles([file('a.txt', 1), file('b.txt', 2)]); });
    expect(commit).not.toHaveBeenCalled();
    expect(result.current.isImporting).toBe(true);
    expect(pending).toHaveBeenLastCalledWith(true);
    await act(async () => { second.resolve({ content: 'Second text' }); await operation; });
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('ignores a pending import after an edit, clear or session load invalidates it', async () => {
    const first = deferred();
    processFile.mockReturnValueOnce(first.promise);
    const { result, commit } = setup();
    let operation!: Promise<void>;
    act(() => { operation = result.current.importFiles([file('a.txt', 1), file('b.txt', 2)]); });
    act(() => result.current.invalidate());
    await act(async () => { first.resolve({ content: 'Stale text' }); await operation; });
    expect(processFile).toHaveBeenCalledTimes(1);
    expect(commit).not.toHaveBeenCalled();
    expect(result.current.feedback).toBeNull();
  });

  it('lets the latest drop win even if an earlier extraction finishes later', async () => {
    const first = deferred();
    processFile.mockReturnValueOnce(first.promise);
    const { result, commit } = setup();
    let oldOperation!: Promise<void>;
    act(() => { oldOperation = result.current.importFiles([file('a.txt', 1), file('b.txt', 2)]); });
    await act(async () => { await result.current.importFiles([file('c.txt', 3), file('d.txt', 4)]); });
    await act(async () => { first.resolve({ content: 'Stale text' }); await oldOperation; });
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit.mock.calls[0][0].originalFileName).toBe('c.txt');
  });

  it('rejects pair imports while a comparison is running', async () => {
    const { result, commit } = setup(true);
    await act(async () => { await result.current.importFiles([file('a.txt', 1), file('b.txt', 2)]); });
    expect(processFile).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
    expect(result.current.feedback?.message).toContain('wait');
  });

  it('discards a late extraction after unmount', async () => {
    const first = deferred();
    processFile.mockReturnValueOnce(first.promise);
    const { result, commit, unmount } = setup();
    let operation!: Promise<void>;
    act(() => { operation = result.current.importFiles([file('a.txt', 1), file('b.txt', 2)]); });
    unmount();
    await act(async () => { first.resolve({ content: 'Stale text' }); await operation; });
    expect(commit).not.toHaveBeenCalled();
  });
});
