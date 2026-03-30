---
description: Verify PDF and DOCX Input Support
---
# Verify PDF and DOCX Input Support

This workflow verifies that PDF and DOCX files can be imported into the application.

## Prerequisites
- App running (`npm run dev` or `npm run electron:dev`)
- A sample .docx file
- A sample .pdf file (text-based)

## Steps

1. **Launch the Application**
   - Ensure the app is running.

2. **Verify DOCX Drop**
   - Drag and drop a .docx file into the "Left" or "Original" input panel.
   - **Expected**: The panel should display "Processing DOCX..." (if visible) or simply update with the text content of the file.

3. **Verify PDF Drop**
   - Drag and drop a .pdf file into the "Right" or "Revised" input panel.
   - **Expected**: The panel should display the extracted text from the PDF.

4. **Verify Paste Support**
   - Copy a .pdf or .docx file from your operating system's file explorer (Ctrl+C).
   - Click inside an input panel and Paste (Ctrl+V).
   - **Expected**: The file content should be extracted and inserted at the cursor position.

5. **Verify Error Handling**
   - Try dropping an invalid file (e.g., .exe or binary).
   - **Expected**: Error message "Unsupported file type" should appear (or console error).

## Troubleshooting
- If PDF extraction fails, check the console for `pdfjs-dist` worker errors.
- If DOCX extraction fails, check for `mammoth` import errors.
