import { useCallback, useEffect, useRef, useState } from 'react';
import { FileProcessingService } from '../services/FileProcessingService';
import { FileTypeDetector } from '../services/FileTypeDetector';
import { LocalInputFileSource } from '../types/components';

export interface FilePairSnapshot {
  originalText: string;
  revisedText: string;
  originalFileSource: LocalInputFileSource | null;
  revisedFileSource: LocalInputFileSource | null;
  originalDisconnectedFileSource: LocalInputFileSource | null;
  revisedDisconnectedFileSource: LocalInputFileSource | null;
  originalFileName: string | null;
  revisedFileName: string | null;
}

export const TOO_MANY_FILES_MESSAGE = 'Oops, you dropped more than two files! Drop files individually into your preferred panels, or drop two together and RdLn will place the newer file in Revised.';

export function useFilePairImport(
  snapshot: FilePairSnapshot,
  onCommit: (next: FilePairSnapshot) => void,
  isBusy: boolean,
  onPendingChange: (pending: boolean) => void
) {
  const latest = useRef({ snapshot, onCommit, isBusy, onPendingChange });
  latest.current = { snapshot, onCommit, isBusy, onPendingChange };
  const generation = useRef(0);
  const service = useRef<FileProcessingService | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<FilePairSnapshot | null>(null);

  // Also invalidated synchronously by edits, clears, session loads and new drops.
  const invalidate = useCallback(() => {
    generation.current++;
    latest.current.onPendingChange(false);
    setIsImporting(false);
    setFeedback(null);
    setUndoSnapshot(null);
  }, []);

  useEffect(() => () => { generation.current++; }, []);

  const importFiles = useCallback(async (files: File[]) => {
    const operation = ++generation.current;
    latest.current.onPendingChange(false);
    setIsImporting(false);
    if (files.length > 2) {
      setFeedback({ error: true, message: TOO_MANY_FILES_MESSAGE });
      return;
    }
    if (files.length !== 2) return;
    if (latest.current.isBusy) {
      setFeedback({ error: true, message: 'Please wait for the current comparison to finish before importing two files.' });
      return;
    }

    try {
      service.current ??= new FileProcessingService();
      for (const file of files) {
        if (FileTypeDetector.getFileCategory(file) === 'unknown') {
          throw new Error(`${file.name}: Two-file imports support DOCX, PDF and TXT files. Drop images individually for OCR.`);
        }
        const validation = service.current.validateFile(file);
        if (!validation.valid) throw new Error(`${file.name}: ${validation.message}`);
      }

      const datesUsable = files.every(file => Number.isFinite(file.lastModified) && file.lastModified > 0);
      const orderedByDate = datesUsable && files[0].lastModified !== files[1].lastModified;
      const [original, revised] = orderedByDate && files[0].lastModified > files[1].lastModified
        ? [files[1], files[0]] : files;
      setIsImporting(true);
      latest.current.onPendingChange(true);
      setFeedback({ error: false, message: 'Reading both files…' });

      // Sequential extraction avoids doubling peak document-processing memory.
      const read = async (file: File) => {
        try {
          const result = await service.current!.processFile(file);
          if (!result.content.trim()) throw new Error('No extractable text found.');
          return result.content;
        } catch (error) {
          const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error);
          throw new Error(`${file.name}: ${message}`);
        }
      };
      const originalText = await read(original);
      if (operation !== generation.current) return;
      const revisedText = await read(revised);
      if (operation !== generation.current) return;

      const source = (file: File, importedText: string): LocalInputFileSource | null => {
        if (!window.isElectron) return null;
        const filePath = window.electronAPI?.getPathForFile?.(file) || (file as File & { path?: string }).path;
        if (!filePath) return null;
        const category = FileTypeDetector.getFileCategory(file);
        const fileType = category === 'pdf-text' ? 'pdf' : category === 'docx' ? 'docx' : 'txt';
        return { filePath, fileName: file.name, fileType, importedText };
      };
      const previous = latest.current.snapshot;
      latest.current.onCommit({
        originalText, revisedText,
        originalFileSource: source(original, originalText),
        revisedFileSource: source(revised, revisedText),
        originalDisconnectedFileSource: null,
        revisedDisconnectedFileSource: null,
        originalFileName: original.name,
        revisedFileName: revised.name
      });
      setUndoSnapshot(previous);
      setFeedback({ error: false, message: orderedByDate
        ? 'Ordered by modification date. The newer file is in Revised.'
        : 'Modification dates match or are unavailable. Files were assigned in drop order; check the order and use Swap if needed.' });
    } catch (error) {
      if (operation === generation.current) {
        setFeedback({ error: true, message: `${error instanceof Error ? error.message : String(error)} Both panels were left unchanged.` });
      }
    } finally {
      if (operation === generation.current) {
        latest.current.onPendingChange(false);
        setIsImporting(false);
      }
    }
  }, []);

  const undoImport = useCallback(() => {
    if (!undoSnapshot || latest.current.isBusy) return;
    invalidate();
    latest.current.onCommit(undoSnapshot);
    setFeedback({ error: false, message: 'Import undone.' });
  }, [undoSnapshot, invalidate]);

  return { importFiles, invalidate, isImporting, feedback, canUndoImport: !!undoSnapshot, undoImport };
}
