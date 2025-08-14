# Litera-Docx-GPT5L

A standalone mini web app that converts a Litera Compare redline PDF into a native Microsoft Word `.docx` with Track Changes.

- Input: Litera redline PDF (underline = insertion, strikethrough = deletion)
- Output: `.docx` using real Word revisions (`w:ins` and `w:del`)
- No server; runs locally in the browser

## Files

- `index.html` — UI and script includes (PDF.js, JSZip, xmlbuilder2)
- `script.js` — PDF analysis + HTML diff → DOCX Track Changes exporter
- `README.md` — this guide

## How it works (high level)

1. Parse PDF with PDF.js to extract text items and drawing ops.
2. Heuristically detect underlines (insertions) and strikethroughs (deletions) by matching thin horizontal lines near text baselines/midlines.
3. Reconstruct reading order; build a simple HTML diff (`<span style=...>` for ins/del).
4. Convert HTML diff to `.docx` with Track Changes using XML parts zipped via JSZip (no third-party docx library needed).

## Usage

1. Open `Litera-Docx-GPT5L/index.html` in a modern browser (Chrome/Edge).
2. Click "Choose File" and pick the Litera redline PDF.
3. Click "Convert to DOCX".
4. A `.docx` download will start upon success.

No build step or dev server required.

## Notes & Limitations

- Heuristics: Works best on clean Litera exports that render underlines/strikethroughs as thin horizontal lines. Complex layouts, scanned PDFs, or non-standard renderers may need tuning.
- Layout: Paragraph breaks and spacing are reconstructed from y-positions with simple thresholds and `<br>`; formatting is intentionally minimal.
- Author/Date: The exporter sets Track Changes author to "Converter" and timestamps with the current time. Adjust in `script.js` if needed.

## Tuning

Key functions in `script.js` to adjust if your PDFs vary:

- `parseLinesFromOps(opList, viewport)` — identify horizontal lines; tweak thresholds.
- `checkStyle(textItem, lines)` — decide if a text item is `ins` or `del` based on line proximity.
- `generateHtmlDiff(styledText)` — reading order, line breaks, and space insertion.

## Zero coupling guarantee

This mini app is fully contained in `Litera-Docx-GPT5L/` and does not modify any other files in the repository.
