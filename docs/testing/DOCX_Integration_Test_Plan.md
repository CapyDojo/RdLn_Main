# DOCX Integration Test Plan

## Overview
This document outlines the steps to test the DOCX input support integration in the RdLn application.

## Prerequisites
1. Development server running (`npm run dev`)
2. Test DOCX file available (`src/assets/test-document.docx`)
3. Browser with developer tools access

## Test Cases

### 1. File Type Detection
- [ ] Verify DOCX files are correctly identified
- [ ] Verify DOC files are correctly rejected with appropriate message
- [ ] Verify other file types are correctly rejected

### 2. Drag-and-Drop Functionality
- [ ] Drag DOCX file onto text input panel
- [ ] Verify file is processed and content is extracted
- [ ] Verify content appears in text area
- [ ] Verify cursor is positioned correctly after insertion

### 3. Paste Functionality
- [ ] Copy DOCX file to clipboard
- [ ] Paste into text input panel
- [ ] Verify file is processed and content is extracted
- [ ] Verify content appears in text area

### 4. Tauri File Drop (Desktop Builds)
- [ ] Drag DOCX file onto text input panel in Tauri build
- [ ] Verify file is processed and content is extracted
- [ ] Verify content appears in text area

### 5. Error Handling
- [ ] Attempt to upload DOC file
- [ ] Verify appropriate error message is displayed
- [ ] Attempt to upload file larger than 10MB
- [ ] Verify appropriate error message is displayed
- [ ] Attempt to upload non-DOCX file
- [ ] Verify appropriate error message is displayed

### 6. Performance
- [ ] Process small DOCX file (< 100KB)
- [ ] Verify processing is fast (< 1 second)
- [ ] Process medium DOCX file (100KB - 1MB)
- [ ] Verify processing is acceptable (< 5 seconds)
- [ ] Process large DOCX file (> 1MB)
- [ ] Verify processing is reasonable (< 10 seconds)

## Testing URLs
1. Main application: http://localhost:5173/
2. Test page: http://localhost:5173/docx-test

## Expected Results
- DOCX files should be processed successfully with text content extracted
- DOC files should be rejected with clear error message
- Other file types should be rejected with appropriate messages
- All file processing should happen client-side
- User interface should provide clear feedback during processing
- Error messages should be user-friendly and actionable

## Manual Testing Steps

### Test 1: Basic DOCX Processing
1. Navigate to http://localhost:5173/
2. Open developer tools console
3. Drag `src/assets/test-document.docx` onto a text input panel
4. Observe:
   - File processing starts (check console)
   - Content is extracted and inserted into text area
   - No errors in console

### Test 2: DOC File Rejection
1. Create a simple DOC file or rename a TXT file to .doc
2. Drag the DOC file onto a text input panel
3. Observe:
   - Appropriate error message is displayed
   - File is not processed
   - Clear guidance to use DOCX format

### Test 3: Paste Operation
1. Copy `src/assets/test-document.docx` to clipboard
2. Paste into a text input panel
3. Observe:
   - File processing starts
   - Content is extracted and inserted into text area
   - No errors in console

### Test 4: Large File Handling
1. Attempt to upload a file larger than 10MB
2. Observe:
   - Appropriate error message is displayed
   - File is not processed

## Automated Testing
Run the following commands to execute automated tests:

```bash
# Run unit tests
npm test src/services/__tests__/FileTypeDetector.test.ts
npm test src/services/__tests__/DocxProcessor.test.ts

# Run integration tests
npm test src/services/__tests__/FileProcessingService.integration.test.ts
```

## Success Criteria
- [ ] All manual test cases pass
- [ ] All automated tests pass
- [ ] No console errors during testing
- [ ] Performance is acceptable for typical DOCX files
- [ ] Error handling is clear and user-friendly
- [ ] Integration with existing functionality is seamless