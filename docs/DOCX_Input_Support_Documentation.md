# DOCX Input Support Documentation

## Overview
This document describes the implementation of DOCX input support in the RdLn application. The feature allows users to import DOCX files directly into the text input panels for comparison.

## Architecture
The implementation follows the infrastructure approach outlined in the 20250813 plan:

1. **FileProcessingService**: Central orchestrator for file processing
2. **FileTypeDetector**: Handles file type detection
3. **DocxProcessor**: Specialized processor for DOCX files
4. **TextInputPanel**: Updated to handle DOCX files through drag-and-drop and paste
5. **Tauri File Drop Handler**: Updated to support DOCX files in desktop builds

## Components

### FileProcessingService
The central service that routes files to appropriate processors based on their type.

```typescript
class FileProcessingService {
  async processFile(file: File): Promise<ProcessingResult>;
  validateFile(file: File): FileValidationResult;
}
```

### FileTypeDetector
Handles detection of file types and categorization.

```typescript
class FileTypeDetector {
  static isDocx(file: File): boolean;
  static isDoc(file: File): boolean;
  static getFileCategory(file: File): FileType;
}
```

### DocxProcessor
Specialized processor for DOCX files using the mammoth.js library.

```typescript
class DocxProcessor {
  async extractText(docxFile: File): Promise<ProcessingResult>;
}
```

## File Type Support

### Supported Formats
- **DOCX**: Microsoft Word Open XML Document Format (.docx)
  - MIME type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### Unsupported Formats
- **DOC**: Legacy Microsoft Word Binary Format (.doc)
  - Users are informed to convert to DOCX format
- **Other formats**: Rejected with appropriate error messages

## Integration Points

### TextInputPanel
Updated to handle DOCX files in both drag-and-drop and paste operations:

1. **Drag-and-drop**: Detects DOCX files and processes them using FileProcessingService
2. **Paste**: Detects DOCX files from clipboard and processes them
3. **Error Handling**: Displays user-friendly error messages for unsupported files

### Tauri File Drop Handler
Updated to support DOCX files in desktop builds:

1. **File Detection**: Identifies DOCX files in drag-and-drop operations
2. **Processing**: Uses FileProcessingService to extract text content
3. **Event Handling**: Dispatches custom events to TextInputPanel components

## Error Handling

### Error Codes
- `DOC_FORMAT_NOT_SUPPORTED`: Legacy DOC files are not supported
- `UNSUPPORTED_TYPE`: Unsupported file type
- `DOCX_PROCESSING_FAILED`: Failed to process DOCX file
- `FILE_TOO_LARGE`: File exceeds size limit (10MB)
- `NETWORK_ERROR`: Failed to load processing library

### User Experience
- Clear error messages for unsupported file types
- Guidance to convert DOC files to DOCX format
- File size limitations with appropriate messaging

## Performance Considerations

### File Size Limit
- Maximum file size: 10MB
- Larger files are rejected with a clear error message

### Client-Side Processing
- All processing happens in the browser
- No server dependencies
- Privacy-first approach

## Testing

### Unit Tests
- FileTypeDetector functionality
- DocxProcessor error handling
- FileProcessingService integration

### Integration Tests
- Complete file processing workflow
- Error handling scenarios
- File size validation

## Future Enhancements

### PDF Support
The architecture is designed to easily accommodate PDF processing in the future by adding:
- PdfProcessor class
- PDF type detection in FileTypeDetector
- Routing in FileProcessingService

### Advanced Features
- Progress indicators for large files
- Batch processing of multiple files
- Enhanced error recovery