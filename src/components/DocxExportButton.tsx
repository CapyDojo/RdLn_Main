import React, { useState } from 'react';
import { Download, Check } from 'lucide-react';
import { CustomTooltip } from './CustomTooltip';
import { DiffChange } from '../types';
import { exportHtmlDiffToDocx } from '../lib/docxExport';
import { usePerformanceAwareHandler, useComponentPerformance } from '../utils/performanceUtils.tsx';
import { FEATURE_FLAGS } from '../config/appConfig';

interface DocxExportButtonProps {
  changes: DiffChange[];
  chunks?: Array<{ id: string; changes: DiffChange[]; html: string; }>;
  className?: string;
  disabled?: boolean;
  // Optional metadata to improve export filenames
  documentTitle?: string;
  originalTitle?: string;
  revisedTitle?: string;
  originalText?: string;
  revisedText?: string;
}

/**
 * DocxExportButton - Export comparison results to DOCX with Track Changes
 * 
 * Handles exporting document comparison results as native Word DOCX files
 * with Track Changes support. Includes success microinteraction and 
 * smart filename generation.
 */
export const DocxExportButton: React.FC<DocxExportButtonProps> = ({
  changes,
  chunks,
  className = '',
  disabled = false,
  documentTitle,
  originalTitle,
  revisedTitle,
  originalText,
  revisedText
}) => {
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  
  // Performance monitoring setup
  const performanceTracker = useComponentPerformance({}, 'DocxExportButton', {
    category: 'export',
    autoTrackRender: true
  });

  // Smart DOCX filename helpers
  const sanitizeFilename = (name: string) =>
    name
      .replace(/[<>:"/\\|?*]+/g, ' ') // illegal filename chars
      .replace(/\s+/g, ' ') // collapse whitespace
      .trim()
      .slice(0, 120); // keep it reasonable

  const firstLineFrom = (text?: string): string | undefined => {
    if (!text) return undefined;
    // remove basic HTML tags if any and split into lines
    const plain = text.replace(/<[^>]+>/g, ' ').replace(/\r\n/g, '\n');
    const firstNonEmpty = plain
      .split('\n')
      .map(s => s.trim())
      .find(s => s.length > 0);
    return firstNonEmpty;
  };

  const timestamp = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}${mm}${dd}_${hh}${mi}`;
  };

  const suggestDocxName = () => {
    // Prefer explicit document title
    const docTitle = documentTitle && sanitizeFilename(documentTitle);
    // Titles from props if provided
    const origTitle = originalTitle || firstLineFrom(originalText);
    const revTitle = revisedTitle || firstLineFrom(revisedText);

    const ts = timestamp();

    if (docTitle && docTitle.length > 0) {
      return `${docTitle} - RdLn - ${ts}.docx`;
    }

    if (origTitle && revTitle) {
      const a = sanitizeFilename(origTitle);
      const b = sanitizeFilename(revTitle);
      if (a && b) return `${a} → ${b} - RdLn - ${ts}.docx`;
    }

    if (origTitle) {
      const a = sanitizeFilename(origTitle);
      if (a) return `${a} - RdLn - ${ts}.docx`;
    }

    if (revTitle) {
      const b = sanitizeFilename(revTitle);
      if (b) return `${b} - RdLn - ${ts}.docx`;
    }

    return `RdLn_${ts}.docx`;
  };

  const exportDocx = usePerformanceAwareHandler(async () => {
    if (!changes || !Array.isArray(changes) || changes.length === 0 || disabled) return;
    
    try {
      setExportingDocx(true);
      
      // Combine chunk HTML into a single container div to match our exporter expectations
      const combinedHtml = `\n<div style="font-family: serif;  white-space: pre-wrap;">${
        (chunks || []).map(c => c.html).join('')
      }</div>`;
      
      const bytes = await exportHtmlDiffToDocx(combinedHtml, { author: 'RdLn' });

      const mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const blob = new Blob([bytes], { type: mime });
      const filename = suggestDocxName();

      // Quick validity check: DOCX (ZIP) should start with 'PK' (0x50, 0x4B)
      if (!(bytes && bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4B)) {
        console.error('Generated file is not a ZIP (PK) header. Size:', bytes?.byteLength);
      }

      // Prefer browser download UI (anchor + download) for consistent user feedback.
      // Keep native File System Access picker available behind a flag if needed later.
      const w = window as any;
      const useNativePicker = FEATURE_FLAGS.ENABLE_NATIVE_SAVE_PICKER;

      if (useNativePicker && w && typeof w.showSaveFilePicker === 'function') {
        try {
          const handle = await w.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'Word Document (.docx)',
              accept: { [mime]: ['.docx'] },
            }],
          });
          const stream = await handle.createWritable();
          await stream.write(blob);
          await stream.close();
        } catch (pickerErr: any) {
          // If user cancels (AbortError), do nothing.
          const name = pickerErr?.name || pickerErr?.constructor?.name;
          if (name === 'AbortError') {
            return; // user cancelled save dialog
          }
          // For other failures, fall back to anchor method
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.setAttribute('href', url);
          a.setAttribute('download', filename);
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            a.remove();
            URL.revokeObjectURL(url);
          }, 1000);
        }
      } else {
        // Blob URL + download attribute triggers browser's download UI
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', filename);
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          a.remove();
          URL.revokeObjectURL(url);
        }, 1000);
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 1500);
      performanceTracker.trackMetric('docx_export_success', { bytes: bytes.byteLength });
      
    } catch (err) {
      console.error('DOCX export failed:', err);
      performanceTracker.trackMetric('docx_export_failure', { error: err instanceof Error ? err.message : String(err) });
    } finally {
      setExportingDocx(false);
    }
  }, 'export_docx', performanceTracker);

  const hasResults = changes && changes.length > 0;
  const isDisabled = disabled || exportingDocx || !hasResults;

  if (!hasResults) return null;

  return (
    <div className="relative segmented-control">
      <CustomTooltip 
        content="Export RdLn as native Word .DOCX with Track Changes" 
        placement="bottom-left"
      >
        <button
          onClick={exportDocx}
          disabled={isDisabled}
          className={`flex items-center justify-center rounded-lg transition-all duration-300 shrink-0 relative group segment ${
            exportSuccess ? 'bg-green-100 border-green-300' : ''
          } ${isDisabled ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
          style={{
            width: '48px',
            height: '48px',
            aspectRatio: '1/1',
            transform: exportSuccess ? 'scale(1.05)' : 'scale(1)',
          }}
          aria-label="Export comparison results as Word DOCX file"
        >
          <div className="flex flex-col items-center justify-center">
            {exportSuccess ? (
              <Check className={`w-6 h-6 text-green-600 transition-all duration-300`} aria-hidden="true" />
            ) : (
              <Download className="w-6 h-6 transition-all duration-300" aria-hidden="true" />
            )}
            <span className={`text-xs mt-0.5 hidden sm:block transition-all duration-300 ${
              exportSuccess ? 'text-green-600' : ''
            }`}>
              {exportSuccess ? 'Saved!' : 'DOCX'}
            </span>
          </div>
        </button>
      </CustomTooltip>
    </div>
  );
};