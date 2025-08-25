# DOCX Input Track Changes Exploration Prototype - Overview

## Project Structure

```
DOCX_Input_Track_Changes_Exploration/
│
├── index.html                  # Main prototype application
├── README.md                   # Project documentation
├── run-prototype.bat           # Batch file to run the prototype
├── create-test-docx.py         # Python script to create test DOCX files
├── test-content.txt            # Sample text content
├── test-files-guide.md         # Guide for creating test files
├── test-plan.md                # Comprehensive test plan
├── test-results.md             # Test results template and summary
├── technical-details.md        # Technical implementation details
├── findings-and-recommendations.md  # Findings and recommendations
└── sample-document.docx        # Sample DOCX file (placeholder)
```

## How to Use This Prototype

1. **Run the Prototype**:
   - Double-click `run-prototype.bat` to open the prototype in your default browser
   - Or manually open `index.html` in a modern web browser

2. **Test the Methods**:
   - Use the buttons at the top to switch between the three processing methods
   - Drag and drop DOCX files onto the drop zone
   - Or click "Select DOCX File" to choose a file using the file dialog

3. **View Results**:
   - Extracted text content will appear in the left panel
   - Track changes information will appear in the right panel
   - Compare the results between different methods

4. **Copy Results**:
   - Use the "Copy Results" button to copy the extracted content and track change information to your clipboard

## Three Processing Methods

### 1. Standard Mammoth.js
- Uses `mammoth.extractRawText()` for basic text extraction
- Fast and reliable
- No track change preservation
- Current implementation in RdLn

### 2. Enhanced Mammoth.js
- Uses `mammoth.convertToHtml()` with custom style mapping
- Attempts to detect track changes through HTML conversion
- Moderate performance impact
- Limited track change detection

### 3. Custom XML Parsing
- Directly parses DOCX as ZIP archive
- Full track change preservation
- Higher complexity and resource usage
- Most comprehensive solution

## Key Features

- Drag and drop support for DOCX files
- File selection through browser dialog
- Real-time comparison of processing methods
- Track changes detection and analysis
- File information display
- Processing status indicators
- Error handling with user-friendly messages
- Results copying to clipboard
- Graceful handling of legacy DOC files

## Testing Instructions

1. **Prepare Test Files**:
   - Use `create-test-docx.py` to generate basic DOCX files
   - Manually add track changes in Microsoft Word for comprehensive testing
   - Refer to `test-files-guide.md` for detailed instructions

2. **Run Tests**:
   - Follow the test plan in `test-plan.md`
   - Record results in the format specified in `test-results.md`

3. **Evaluate Results**:
   - Compare findings using `findings-and-recommendations.md`
   - Review technical details in `technical-details.md`

## Next Steps

After evaluating this prototype, you can:

1. Integrate the most suitable method into the main RdLn application
2. Implement the hybrid approach recommended in `findings-and-recommendations.md`
3. Expand testing with more complex documents
4. Optimize performance based on the findings