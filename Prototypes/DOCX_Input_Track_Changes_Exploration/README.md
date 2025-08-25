# DOCX Input Track Changes Exploration Prototype

## Overview
This prototype compares three different approaches to processing DOCX files with track changes:

1. **Standard Mammoth.js** - Basic text extraction using `extractRawText()`
2. **Enhanced Mammoth.js** - HTML conversion with style mapping to detect track changes
3. **Custom XML Parsing** - Direct XML parsing of DOCX structure for full track change preservation

## Features
- Drag and drop support for DOCX files
- File selection through browser dialog
- Comparison of three processing methods
- Text extraction from DOCX documents
- Track changes detection and analysis
- File information display (name and size)
- Processing status indicator
- Error handling and display
- Copy results to clipboard
- **Graceful handling of legacy DOC files with helpful user messages**

## How to Use
1. Open `index.html` in a modern web browser
2. Select a processing method using the buttons at the top:
   - **Standard Mammoth.js**: Basic text extraction
   - **Enhanced Mammoth.js**: HTML conversion with track change detection
   - **Custom XML Parsing**: Full XML parsing for complete track change preservation
3. Either:
   - Drag and drop a DOCX file with track changes onto the drop zone
   - Click the "Select DOCX File" button to choose a file
4. The prototype will process the file and display:
   - Extracted text content
   - Track changes information
   - Comparison of all three methods
5. Use the "Copy Results" button to copy the extracted content and track change information to your clipboard

## Technology
- **mammoth.js**: Library for converting DOCX documents to HTML or text
- **JSZip**: Library for parsing DOCX files as ZIP archives
- **Vanilla JavaScript (ES6 modules)**: Modern JavaScript with module support
- **HTML5/CSS3**: Modern web standards for UI

## Processing Methods Comparison

| Method | Text Extraction | Track Changes Detection | Performance | Complexity |
|--------|----------------|-------------------------|-------------|------------|
| Standard Mammoth.js | ✅ High quality | ❌ None | ✅ Fast | ✅ Low |
| Enhanced Mammoth.js | ✅ High quality | 🔶 Limited | ✅ Fast | 🔶 Medium |
| Custom XML Parsing | ✅ High quality | ✅ Full support | 🔶 Slower | ❌ High |

## Testing Instructions
1. Create DOCX files with various content and track changes:
   - Simple text with insertions/deletions
   - Formatted text with track changes
   - Complex documents with multiple authors
2. Test with different file sizes:
   - Small files (< 100KB)
   - Medium files (100KB - 1MB)
   - Large files (> 1MB)
3. Verify:
   - Text extraction accuracy for each method
   - Track changes detection capabilities
   - Processing performance
   - Error handling for invalid files
   - Graceful handling of DOC files with clear user messaging

## Limitations
- Password-protected DOCX files are not supported
- Some track change information may be lost with simpler methods
- Client-side processing only (no server dependencies)
- **Legacy DOC files are not supported** - users are informed to convert to DOCX format

## Next Steps
After evaluating this prototype, the most suitable approach can be integrated into the main RdLn application based on requirements for track change preservation vs. performance and complexity.