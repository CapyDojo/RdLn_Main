# Creating Test DOCX Files with Track Changes

## Overview
This guide explains how to create DOCX files with track changes for testing the prototype.

## Method 1: Using Microsoft Word

### Steps:
1. Open Microsoft Word
2. Create a new document with sample content:
   - Headings
   - Paragraphs with formatted text (bold, italic)
   - Lists (bulleted and numbered)
   - Tables
3. Enable Track Changes:
   - Go to the "Review" tab
   - Click "Track Changes" to turn it on
4. Make some changes to the document:
   - Insert some new text (it will appear underlined)
   - Delete some existing text (it will appear with a strikethrough)
   - Change some formatting
5. Save the document as "test-document-with-track-changes.docx"

### Sample Content to Add:
```
This is the original text.

[Insert new text here]

This text will be deleted.

[Change formatting of this text]
```

## Method 2: Using the Python Script

The provided Python script `create-test-docx.py` creates a basic DOCX file. However, since the python-docx library doesn't support adding track changes programmatically, you'll need to:

1. Run the script:
   ```bash
   python create-test-docx.py
   ```
2. Open the generated document in Microsoft Word
3. Follow the steps in Method 1 to add track changes

## Method 3: Download Sample Files

You can also download sample DOCX files with track changes from various online sources for testing with different content types and formatting.

## Testing Different Scenarios

Create test files with:

1. **Simple Track Changes**:
   - A few insertions and deletions
   - Single author

2. **Complex Track Changes**:
   - Multiple authors with different changes
   - Nested changes (changes to already changed text)
   - Formatting changes

3. **Large Documents**:
   - Multiple pages of content with track changes
   - Complex formatting and tables with changes

## File Naming Convention

For consistency, name your test files as follows:
- `simple-track-changes.docx`
- `complex-track-changes.docx`
- `large-document-track-changes.docx`

## Testing Checklist

When testing with each file, verify:
- [ ] Text extraction accuracy
- [ ] Track change detection
- [ ] Author information preservation
- [ ] Date/time information preservation
- [ ] Performance with file size
- [ ] Error handling for corrupted files