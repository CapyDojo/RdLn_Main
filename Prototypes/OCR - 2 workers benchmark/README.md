# OCR Worker Benchmark Prototypes

This directory contains multiple versions of OCR Worker Benchmarks, demonstrating different approaches to parallel OCR processing.

## Versions

### [v2 - Fixed Version](ocr-2-workers-benchmark-v2.html) (`ocr-2-workers-benchmark-v2.html`)
A corrected version of the original benchmark with:
- Fixed CSS variables and styling issues
- Proper event handling with programmatic listeners
- Corrected string escaping in JavaScript
- Two test modes:
  - **Single Worker Test**: Sequential processing with one worker
  - **Dual Worker Test**: Concurrent processing using Promise.all (may or may not be truly parallel)

### [v3 - True Parallel Processing](v3-Q3C.html) (`v3-Q3C.html`) - NEW
An enhanced version with true parallel processing capabilities:
- Three test modes:
  - **Single Worker Test**: Sequential processing with one worker
  - **Dual Worker Test**: Concurrent processing using Promise.all
  - **True Parallel Test**: Parallel processing with separate worker instances
- Uses the same tesseract.js configuration as the main application
- Proper error handling for worker creation and termination
- Detailed comparison of all three approaches

## Supported Languages

All versions use the same 10 languages as the main OCR engine:
- `eng` - English 🇪🇳
- `chi_sim` - Chinese (Simplified) 🇨🇳
- `chi_tra` - Chinese (Traditional) 🇹🇼
- `spa` - Spanish 🇪🇸
- `fra` - French 🇫🇷
- `deu` - German 🇩🇪
- `jpn` - Japanese 🇯🇵
- `kor` - Korean 🇰🇷
- `ara` - Arabic 🇸🇦
- `rus` - Russian 🇷🇺

## How to Use

1. Start the development server:
   ```
   npm run dev
   ```

2. Access the files through the Vite development server:
   - v2: `http://localhost:5173/Prototypes/OCR%20-%202%20workers%20benchmark/ocr-2-workers-benchmark-v2.html`
   - v3: `http://localhost:5173/Prototypes/OCR%20-%202%20workers%20benchmark/v3-Q3C.html`

3. Prewarm workers using the "Prewarm 10-Language OCR Workers" button

4. Select test images and run the benchmarks

## Expected Performance Differences

- **v2**: May show minimal improvement in the dual test over single test, depending on the OCR service implementation
- **v3**: Should show significant performance improvements in the true parallel test due to dedicated worker instances

For detailed information about each version, see:
- [v2 README](README-v2.md)
- [v3 README](README-v3.md)
- [Summary of all versions](SUMMARY.md)