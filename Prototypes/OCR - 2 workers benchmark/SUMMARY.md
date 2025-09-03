# OCR - 2 Workers Benchmark Prototype

## Overview
This prototype tests the performance difference between processing 2 concurrent OCR operations using:
1. **Single Worker (Sequential)**: Process 2 OCR operations one after another using 1 prewarmed worker
2. **Dual Worker (Concurrent)**: Process 2 OCR operations simultaneously using 2 prewarmed workers

## Files Included
1. `ocr-2-workers-benchmark.html` - Main HTML prototype with UI for testing
2. `README.md` - Documentation for the prototype
3. `core-logic-test.js` - Core logic demonstration
4. `test-image-generator.js` - Utility for generating test images

## How to Use
1. Open `ocr-2-workers-benchmark.html` in a browser
2. Click "Prewarm OCR Workers" to initialize the OCR workers
3. Select two image files for each test panel
4. Run both tests and compare results

## Expected Results
With 2 prewarmed workers, the concurrent processing should be significantly faster than sequential processing, especially for larger images. The performance gain will depend on image size, system capabilities, and worker initialization overhead.

## Technical Implementation
This prototype leverages the RdLn™ Document Comparison Tool's existing OCR infrastructure and makes real calls to the actual OCR pipeline:
- Uses `SimpleOCRCache` for worker management
- Leverages `extractTextWithPrewarmedWorker` for actual OCR processing
- Integrates with Tesseract.js as the underlying OCR engine
- Provides real-world performance measurements with actual image files