# OCR Worker Benchmark: 1 vs 2 Prewarmed Workers

This prototype benchmarks the performance difference between processing 2 concurrent OCR operations using:
1. **Single Worker (Sequential)**: Process 2 OCR operations one after another using 1 prewarmed worker
2. **Dual Worker (Concurrent)**: Process 2 OCR operations simultaneously using 2 prewarmed workers

## Purpose

This test demonstrates the performance benefits of using multiple prewarmed OCR workers for concurrent operations. It helps answer the question: "Does using multiple workers provide a performance benefit for concurrent OCR tasks?"

## How It Works

### Single Worker Test (Sequential)
- Processes 2 OCR operations one after another
- Uses 1 prewarmed worker that is reused for both operations
- Measures the total time for sequential processing

### Dual Worker Test (Concurrent)
- Processes 2 OCR operations simultaneously using `Promise.all()`
- Uses 2 prewarmed workers (one per operation)
- Measures the total time for concurrent processing

## Setup Instructions

1. Ensure all project dependencies are installed: `npm install`
2. Download Tesseract.js assets: `npm run download:tesseract`
3. Start the development server: `npm run dev`
4. Navigate to: http://localhost:5173/Prototypes/OCR%20-%202%20workers%20benchmark/ocr-2-workers-benchmark.html
5. Click "Prewarm OCR Workers" to initialize the OCR workers
6. Select two image files for each test panel
7. Run both tests and compare results

## Expected Results

With 2 prewarmed workers, the concurrent processing should be significantly faster than sequential processing, especially for larger images. The performance gain will depend on:
- Image size and complexity
- System capabilities
- Worker initialization overhead

## Technical Details

This prototype uses the RdLn™ Document Comparison Tool's actual OCR service infrastructure:
- `SimpleOCRCache` for worker management
- `extractTextWithPrewarmedWorker` for OCR processing
- Tesseract.js as the underlying OCR engine

The test makes real calls to the OCR pipeline and provides actual performance measurements with real image files.

## Testing
See [TESTING_PLAN.md](TESTING_PLAN.md) for detailed instructions on how to test this prototype and verify it works with the actual OCR pipeline.