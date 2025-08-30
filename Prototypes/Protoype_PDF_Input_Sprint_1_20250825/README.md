# Prototype: PDF Input Sprint 1 (2025-08-25)

Self-contained prototype to import PDFs, classify pages (text vs image), extract text via `pdfjs-dist`, and OCR image-only pages using `tesseract.js`.

No production code is modified.

## Files

- `index.html` — UI and wiring; loads libraries from CDN.
- `app.js` — Core logic: load, classify, extract, selective OCR, progress.
- `sample-pdf.js` — Embedded 1-page "Hello PDF" sample as base64.

## Usage

1. Open `index.html` in a browser.
2. Drag & drop a `.pdf` onto the drop zone, or click `Load Text Sample`, or use the file picker.
3. Optionally toggle `Enable OCR`, choose OCR Language (eng, chi_sim, or both), and DPI (200–300).
4. Click `Start` to process. Use `Cancel` to stop after current page.

## Notes

- Libraries are loaded from CDN; page requires internet to load `pdfjs-dist` and (if OCR) `tesseract.js` + language data (including `chi_sim`).
- First-time OCR for `chi_sim` downloads a larger model (~20–25MB); subsequent runs are cached by the browser.
- Page classification: if `getTextContent().items.length > 5` => treated as text; else rendered and OCR’d if enabled.
- Text reconstruction is minimal (line grouping and spacing only).
- Password-protected PDFs prompt via a simple password dialog.

## Roadmap (Next Sprints)

- Better paragraph/column reconstruction and dehyphenation.
- Per-page OCR progress and hard-cancel support.
- Optional local bundling to enable offline runs without CDNs.
- Add a second sample (image-only page) to exercise OCR path.

## Screenshots

Add screenshots here after manual validation (prototype intentionally excludes them to keep repo small).
