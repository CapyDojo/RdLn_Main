// src/services/PdfProcessor.ts

import { ProcessingResult, ProcessingError, ERROR_CODES } from '../types/file-processing.types';

// Use a dynamic import if needed, but for now we'll import top level to ensure worker setup
import * as pdfjsLib from 'pdfjs-dist';

// Try standard Vite worker import pattern
// Note: In some environments this might need adjustment, but ?worker is standard Vite
// We fallback to standard worker src if needed
let workerSrc: string;
try {
    // Use the standard worker from the installed package
    // The ?url suffix tells Vite to emit the worker script as a URL
    // This works best with `pdfjs-dist` in modern bundlers
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    import('pdfjs-dist/build/pdf.worker.mjs?url').then((module) => {
        workerSrc = module.default;
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    });
} catch (e) {
    console.warn('Failed to load PDF worker via import, falling back to CDN or distinct handling', e);
    // Fallback if local import fails (e.g. strict CSP or path issues)
    // But usually local import is best for Electron
}

export class PdfProcessor {
    /**
     * Extract text from PDF file
     */
    async extractTextDirectly(pdfFile: File): Promise<ProcessingResult> {
        const startTime = Date.now();

        try {
            // Validate file type
            if (pdfFile.type !== 'application/pdf' && !pdfFile.name.toLowerCase().endsWith('.pdf')) {
                throw {
                    message: 'Selected file is not a PDF file.',
                    code: ERROR_CODES.UNSUPPORTED_TYPE
                } as ProcessingError;
            }

            // Convert file to ArrayBuffer
            const arrayBuffer = await pdfFile.arrayBuffer();

            // Load the PDF document
            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer,
                cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.189/cmaps/', // Use CDNs for CMaps to reduce bundle size if needed, or local
                cMapPacked: true,
            });

            const pdf = await loadingTask.promise;
            const numPages = pdf.numPages;
            let fullText = '';
            let confidenceTotal = 0;

            // Iterate through pages
            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                // Extract strings and join with spaces (basic extraction)
                // More advanced: respect layout (y-coord sorting)
                const strings = textContent.items.map((item: any) => item.str);

                // Simple join strategy
                const pageText = strings.join(' ');

                // Append to full text with double newline for page break
                fullText += pageText + '\n\n';

                // Simple confidence metric (if text exists, high confidence)
                confidenceTotal += (strings.length > 0 ? 1.0 : 0.5);
            }

            const avgConfidence = numPages > 0 ? confidenceTotal / numPages : 0;

            return {
                type: 'pdf-text',
                content: fullText.trim(),
                processingTime: Date.now() - startTime,
                confidence: avgConfidence,
                method: 'pdf-text-extraction'
            };

        } catch (error: any) {
            // Handle known errors
            if (error.code) {
                throw error;
            }

            // Handle PDF specific errors
            let message = 'Failed to process PDF file.';
            if (error.name === 'PasswordException') {
                message = 'PDF is password protected.';
            } else if (error.name === 'InvalidPDFException') {
                message = 'Invalid or corrupted PDF file.';
            }

            throw {
                message: message,
                code: 'PDF_PROCESSING_FAILED',
                details: error
            } as ProcessingError;
        }
    }
}
