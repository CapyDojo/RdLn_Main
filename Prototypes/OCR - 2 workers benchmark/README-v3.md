# OCR Worker Benchmark v3 - True Parallel Processing

This is version 3 of the OCR Worker Benchmark that implements true parallel processing with separate worker instances.

## Key Features

### Three Different Test Types:

1. **Single Worker Test**: 
   - Processes 2 OCR operations sequentially using 1 prewarmed 10-language worker
   - Measures sequential processing time
   - Uses the cached worker from SimpleOCRCache

2. **Dual Worker Test**: 
   - Processes 2 OCR operations using Promise.all with the same OCR service
   - May or may not use multiple workers internally (depends on OCR service implementation)
   - Uses the same `extractTextWithPrewarmedWorker` function as the single test

3. **True Parallel Test** (NEW in v3):
   - Processes 2 OCR operations using separate, dedicated worker instances
   - Each operation gets its own worker created specifically for that task
   - Implements true parallel processing by creating workers directly with tesseract.js
   - Properly terminates workers after use to prevent memory leaks

## How It Works

The key difference in v3 is the True Parallel Test, which:

1. Imports tesseract.js as a module (same as the main application)
2. Creates separate worker instances for each OCR operation using the same configuration as the main app
3. Processes both images simultaneously with dedicated workers
4. Properly terminates workers after use to prevent memory leaks
5. Includes error handling for worker creation

## Expected Performance Improvements

With the True Parallel Test, you should see significant performance improvements when processing two images simultaneously, as each image gets its own dedicated worker rather than:
- Queuing operations (Single Worker Test)
- Potentially queuing operations (Dual Worker Test, depending on implementation)

## Usage

1. Make sure you have the development server running:
   ```
   npm run dev
   ```

2. Open this HTML file in your browser through the Vite development server:
   - The file should be accessible at `http://localhost:5173/Prototypes/OCR%20-%202%20workers%20benchmark/v3-Q3C.html`

3. Prewarm the workers using the "Prewarm 10-Language OCR Workers" button

4. Select two test images

5. Run each test to compare performance

## Technical Details

- Uses the same 10 languages as the main OCR engine: English, Chinese (Simplified), Chinese (Traditional), Spanish, French, German, Japanese, Korean, Arabic, and Russian
- All tests use the same image processing parameters for fair comparison
- Results are displayed in a comparison table for easy analysis