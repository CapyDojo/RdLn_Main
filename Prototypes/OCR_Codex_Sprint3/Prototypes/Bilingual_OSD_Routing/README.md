# Bilingual OSD Routing Prototype

Standalone HTML demo that performs:
- Page-level OSD (orientation + script) with rotation correction.
- Region segmentation (per-line or per-paragraph).
- Script-based routing to appropriate OCR language(s).
- Chinese dual-model merge (chi_sim vs chi_tra) with confidence-only selection and optional 5% bias toward Simplified.

## Files
- `tesseract-osd-per-line-routing.html` — main prototype (self-contained UI + logic)

## Open (Windows)
- Double-click the HTML file, or run:

```
start "" "C:\\temp\\RdLn_MVP_Stream\\Prototypes\\Bilingual_OSD_Routing\\tesseract-osd-per-line-routing.html"
```

Adjust the path to your local checkout if different.

## Usage
- Drag-and-drop an image or click the drop area to choose a file.
- Click "Detect (OSD)" to run orientation + script detection. The preview rotates accordingly.
- Choose routing mode: Per-Line (default) or Per-Paragraph.
- Optional: enable "Bias toward Simplified (5%)" for Chinese symbol selection.
- Click "OCR" to run segmentation, per-region routing, and recognition.
- Review panes:
  - OSD JSON (script, angle, confidences)
  - Final OCR Text
  - Per-Region Analysis (bbox, routed script/lang, confidence summary)
  - Chinese Merge table (first 30 symbol decisions: Simplified/Traditional/Identical)

## Notes
- Languages mapping used:
  - Latin → eng (kept light for prototype)
  - Han/HanS/HanT → chi_sim + chi_tra (dual-run + merge)
  - Other scripts map to reasonable defaults, with fallback to `eng` if the traineddata is not available.
- The prototype loads `tesseract.js@5` from a CDN. Internet is required on first use (models are cached by the browser). For offline, you can swap the `<script>` source to a local `tesseract.min.js`, provided you also host traineddata assets — keep large binaries out of the repo.
- Performance target: a ~1500×2000 image with ~20 lines should complete in ~8–12s on a typical dev laptop once models are cached.
- Concurrency is limited to keep memory usage stable.

## Troubleshooting
- If the CDN is blocked, open the HTML and adjust the loader script to point to a local `tesseract.min.js`.
- If OCR seems incorrect for a region with mixed script, try switching modes (Per-Line vs Per-Paragraph) and/or rerun with OSD enabled.
- Rotated images: ensure you run Detect to apply rotation before OCR.

## Dev Rules
- Changes live under `Prototypes/**` only; no `src-tauri/**` edits.
- Prefer native Windows commands in docs (see open command above).
- No large binaries committed; rely on CDN or local copies outside the repo.
