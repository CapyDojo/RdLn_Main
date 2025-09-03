# OCR - 2 Workers Benchmark: Testing Plan

## Overview
This document outlines how to test the OCR - 2 Workers Benchmark prototype to ensure it correctly uses the actual OCR pipeline and provides real-world results.

## Prerequisites
1. Node.js installed (version specified in package.json)
2. All project dependencies installed (`npm install`)
3. Tesseract.js assets downloaded (`npm run download:tesseract`)

## Testing Steps

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Navigate to the Prototype
Open your browser and go to:
http://localhost:5173/Prototypes/

### 3. Launch the OCR Benchmark
Click on the "OCR - 2 Workers Benchmark" link or navigate directly to:
http://localhost:5173/Prototypes/OCR%20-%202%20workers%20benchmark/ocr-2-workers-benchmark.html

### 4. Verify Imports Work
Open the browser's developer console and check for any import errors. You should see messages indicating successful imports.

### 5. Prewarm OCR Workers
Click the "🔥 Prewarm OCR Workers" button. You should see:
- Progress updates in the console
- An alert confirming both workers are prewarmed

### 6. Prepare Test Images
Select two image files for testing:
- For the Single Worker Test panel, select two images in the file inputs
- For the Dual Worker Test panel, select the same two images in the file inputs

### 7. Run Single Worker Test
Click "🚀 Run Single Worker Test" in the Single Worker Test panel:
- Watch the console for progress updates
- Observe the timing results in the results panel
- Verify that the test completes successfully

### 8. Run Dual Worker Test
Click "🚀 Run Dual Worker Test" in the Dual Worker Test panel:
- Watch the console for progress updates
- Observe the timing results in the results panel
- Verify that the test completes successfully

### 9. Compare Results
Check the comparison table that appears after both tests complete:
- Verify that text extraction results are identical
- Confirm the performance difference between sequential and concurrent processing

## Expected Results
1. Both tests should complete without errors
2. The dual worker test should complete faster than the single worker test
3. Text extraction results should be identical between both tests
4. Console should show detailed timing information

## Troubleshooting

### Import Errors
If you see import errors in the console:
1. Verify the path `../../src/services/SimpleOCRCache.ts` is correct
2. Check that the development server is running
3. Ensure all dependencies are installed

### OCR Processing Errors
If OCR processing fails:
1. Verify tesseract assets are downloaded (`npm run download:tesseract`)
2. Check that selected files are valid images
3. Look for specific error messages in the console

### Performance Results
If performance results are unexpected:
1. Try larger, more complex images
2. Run tests multiple times to account for system variability
3. Check browser developer tools for performance insights

## Validation Criteria
- [ ] Both tests complete without errors
- [ ] Dual worker test shows performance improvement
- [ ] Text extraction results are identical
- [ ] Detailed timing information is displayed
- [ ] Comparison table shows meaningful data