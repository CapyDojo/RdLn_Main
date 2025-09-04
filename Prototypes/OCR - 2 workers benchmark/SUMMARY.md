# OCR Worker Benchmark - Summary

This directory contains multiple versions of the OCR Worker Benchmark, each demonstrating different approaches to OCR processing:

## Files

### 1. `ocr-2-workers-benchmark-v2-original.html`
- The original version with issues
- Contains CSS variables that were commented out
- Has inline event handlers that caused ReferenceError
- Has string escaping issues in JavaScript

### 2. `ocr-2-workers-benchmark-v2.html` 
- Fixed version of v2
- Corrected CSS variables and styling
- Replaced inline event handlers with programmatic event listeners
- Fixed string escaping issues
- Two test modes:
  - Single Worker Test: Sequential processing with one worker
  - Dual Worker Test: Concurrent processing using Promise.all (may or may not be truly parallel)

### 3. `v3-Q3C.html` (NEW)
- True parallel processing implementation
- Three test modes:
  - Single Worker Test: Sequential processing with one worker
  - Dual Worker Test: Concurrent processing using Promise.all
  - True Parallel Test: Parallel processing with separate worker instances
- Uses the same tesseract.js configuration as the main application
- Proper error handling for worker creation and termination
- Detailed comparison of all three approaches

## Key Differences

### v2 vs v3

1. **Worker Creation**:
   - v2: Uses cached workers from SimpleOCRCache
   - v3: Creates separate worker instances for true parallel processing

2. **Parallel Processing**:
   - v2: May not achieve true parallelism (depends on OCR service implementation)
   - v3: Guarantees true parallel processing with dedicated workers

3. **Performance**:
   - v2: Dual test may show minimal improvement over single test
   - v3: True parallel test should show significant performance improvements

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

## Expected Results

With v3's True Parallel Test, you should see significant performance improvements when processing two images simultaneously, as each image gets its own dedicated worker rather than queuing operations or sharing a single worker.