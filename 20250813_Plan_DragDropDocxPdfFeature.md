# Drag and Drop Support for .docx and .pdf Files - Feature Plan

## Executive Summary

This feature plan outlines the implementation of drag-and-drop support for .docx and .pdf files in the RdLn application, building upon the existing PNG drag-and-drop and OCR infrastructure. The implementation will handle three distinct PDF scenarios: text-based PDFs, scanned OCR'd PDFs, and scanned non-OCR'd PDFs.

## Current State Analysis

### Existing Capabilities
- **PNG Drag & Drop**: Fully functional in both web and Tauri builds
- **OCR Infrastructure**: Robust OCR service with Tauri integration, language detection, and caching
- **File Processing**: Existing file reading capabilities via Tauri FS API
- **Document Export**: DOCX export functionality already implemented
- **Text Processing**: Advanced paste detection and formatting preservation

### Key Components Available
- `OCRService.ts` - Comprehensive OCR with Tauri support
- `TextInputPanel.tsx` - Drag-and-drop UI foundation
- `pastePDFdetection.ts` - PDF content analysis utilities
- `docxExport.ts` - DOCX processing capabilities

## Feature Scope

### Supported File Types
1. **DOCX Files** - Microsoft Word documents
2. **PDF Files** - Three distinct handling scenarios:
   - Text-based PDFs (extract text directly)
   - Scanned OCR'd PDFs (extract existing OCR text)
   - Scanned non-OCR'd PDFs (perform OCR on images)

### Target Platforms
- **Web Build**: Browser-based file handling
- **Tauri Build**: Native file system integration

## Technical Architecture

### 1. File Detection and Validation

#### File Type Detection
```typescript
interface FileTypeDetector {
  isDocx(file: File): boolean;
  isPdf(file: File): boolean;
  getFileCategory(file: File): 'docx' | 'pdf-text' | 'pdf-scanned' | 'unknown';
}
```

#### MIME Type Validation
- DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- PDF: `application/pdf`
- Fallback: File extension checking

### 2. PDF Processing Pipeline

#### Scenario 1: Text-based PDFs
- **Method**: Direct text extraction using PDF.js
- **Output**: Clean text with formatting preservation
- **Performance**: Fastest (no OCR required)
- **Indicators**: Presence of text layers, selectable text

#### Scenario 2: Scanned OCR'd PDFs
- **Method**: Extract existing OCR text from PDF metadata
- **Output**: Existing OCR text with confidence scores
- **Performance**: Fast (text already available)
- **Indicators**: OCR metadata, text layers with confidence values

#### Scenario 3: Scanned non-OCR'd PDFs
- **Method**: Image extraction + OCR processing
- **Output**: New OCR text with layout analysis
- **Performance**: Slowest (full OCR pipeline)
- **Indicators**: Image-only pages, no text layers

### 3. DOCX Processing Pipeline

#### Text Extraction
- **Method**: Direct XML parsing of document.xml
- **Formatting**: Preserve paragraph structure, basic formatting
- **Track Changes**: Optional handling of revision marks
- **Images**: Extract and process embedded images via OCR if needed

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

#### File Processing Service
```typescript
class FileProcessingService {
  async processFile(file: File): Promise<ProcessingResult>;
  detectFileType(file: File): FileType;
  validateFile(file: File): ValidationResult;
}
```

#### PDF Processing Engine
```typescript
class PdfProcessor {
  async extractText(pdfFile: File): Promise<PdfTextResult>;
  detectPdfType(pdfFile: File): PdfType;
  extractImages(pdfFile: File): Promise<ImageData[]>;
  performOcr(images: ImageData[]): Promise<OcrResult[]>;
}
```

#### DOCX Processing Engine
```typescript
class DocxProcessor {
  async extractText(docxFile: File): Promise<DocxTextResult>;
  extractImages(docxFile: File): Promise<ImageData[]>;
  processTrackChanges(content: string): ProcessedContent;
}
```

### Phase 2: UI Integration (Week 2)

#### Enhanced Drop Zone
- Visual indicators for file types
- Progress tracking for processing
- Error handling with user feedback
- Drag-over effects for different file types

#### Processing Status UI
- Real-time progress updates
- File type detection feedback
- OCR progress for scanned documents
- Error messages with recovery options

### Phase 3: Advanced Features (Week 3)

#### Multi-file Processing
- Batch file processing
- Queue management
- Priority handling for text-based files

#### Content Enhancement
- Automatic language detection
- Formatting preservation options
- Content cleanup and normalization

## Detailed Implementation

### 1. File Type Detection System

```typescript
enum PdfContentType {
  TEXT_BASED = 'text-based',
  SCANNED_OCR = 'scanned-ocr',
  SCANNED_NON_OCR = 'scanned-non-ocr'
}

interface PdfAnalysisResult {
  type: PdfContentType;
  confidence: number;
  hasTextLayer: boolean;
  hasOcrMetadata: boolean;
  pageCount: number;
  imageCount: number;
}

class PdfTypeDetector {
  async analyzePdf(pdfFile: File): Promise<PdfAnalysisResult> {
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    
    let hasText = false;
    let hasOcr = false;
    let imageCount = 0;
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const operators = await page.getOperatorList();
      
      // Check for text content
      if (textContent.items.length > 0) {
        hasText = true;
        
        // Check for OCR indicators
        const hasLowConfidence = textContent.items.some(item => 
          (item as any).confidence && (item as any).confidence < 0.8
        );
        if (hasLowConfidence) hasOcr = true;
      }
      
      // Count images
      const imageOps = operators.fnArray.filter(fn => 
        fn === pdfjsLib.OPS.paintImageXObject
      );
      imageCount += imageOps.length;
    }
    
    return {
      type: this.determineType(hasText, hasOcr, imageCount),
      confidence: this.calculateConfidence(hasText, hasOcr, imageCount),
      hasTextLayer: hasText,
      hasOcrMetadata: hasOcr,
      pageCount: pdf.numPages,
      imageCount
    };
  }
  
  private determineType(hasText: boolean, hasOcr: boolean, imageCount: number): PdfContentType {
    if (hasText && !hasOcr) return PdfContentType.TEXT_BASED;
    if (hasText && hasOcr) return PdfContentType.SCANNED_OCR;
    return PdfContentType.SCANNED_NON_OCR;
  }
}
```

### 2. Processing Pipeline

```typescript
class DocumentProcessor {
  async processDocument(file: File): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: File validation
      const validation = await this.validateFile(file);
      if (!validation.valid) {
        throw new ProcessingError(validation.message);
      }
      
      // Step 2: File type detection
      const fileType = await this.detectFileType(file);
      
      // Step 3: Route to appropriate processor
      switch (fileType) {
        case 'docx':
          return await this.processDocx(file);
        case 'pdf-text':
          return await this.processPdfText(file);
        case 'pdf-scanned-ocr':
          return await this.processPdfScannedOcr(file);
        case 'pdf-scanned-non-ocr':
          return await this.processPdfScannedNonOcr(file);
        default:
          throw new ProcessingError('Unsupported file type');
      }
      
    } catch (error) {
      return this.handleProcessingError(error, startTime);
    }
  }
  
  private async processPdfText(file: File): Promise<ProcessingResult> {
    // Fast path: direct text extraction
    const text = await this.extractPdfText(file);
    return {
      type: 'pdf-text',
      content: text,
      processingTime: Date.now(),
      confidence: 1.0,
      method: 'direct-extraction'
    };
  }
  
  private async processPdfScannedNonOcr(file: File): Promise<ProcessingResult> {
    // Slow path: image extraction + OCR
    const images = await this.extractPdfImages(file);
    const ocrResults = await Promise.all(
      images.map(image => this.performOcr(image))
    );
    
    return {
      type: 'pdf-scanned',
      content: ocrResults.map(r => r.text).join('\n\n'),
      processingTime: Date.now(),
      confidence: ocrResults.reduce((sum, r) => sum + r.confidence, 0) / ocrResults.length,
      method: 'ocr-processing'
    };
  }
}
```

### 3. UI Components

#### Enhanced Drop Zone Component
```typescript
interface EnhancedDropZoneProps {
  onFileProcessed: (result: ProcessingResult) => void;
  acceptedTypes?: string[];
  maxFileSize?: number;
  allowMultiple?: boolean;
}

const EnhancedDropZone: React.FC<EnhancedDropZoneProps> = ({
  onFileProcessed,
  acceptedTypes = ['.docx', '.pdf'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowMultiple = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  
  const handleDrop = useCallback(async (files: File[]) => {
    const validFiles = files.filter(file => 
      file.size <= maxFileSize &&
      acceptedTypes.some(type => file.name.toLowerCase().endsWith(type))
    );
    
    if (validFiles.length === 0) return;
    
    const filesToProcess = allowMultiple ? validFiles : [validFiles[0]];
    
    for (const file of filesToProcess) {
      const processingFile: ProcessingFile = {
        id: generateId(),
        file,
        status: 'processing',
        progress: 0
      };
      
      setProcessingFiles(prev => [...prev, processingFile]);
      
      try {
        const result = await documentProcessor.processDocument(file);
        onFileProcessed(result);
        
        setProcessingFiles(prev => 
          prev.map(f => f.id === processingFile.id 
            ? { ...f, status: 'completed', progress: 100 }
            : f
          )
        );
      } catch (error) {
        setProcessingFiles(prev => 
          prev.map(f => f.id === processingFile.id 
            ? { ...f, status: 'error', error: error.message }
            : f
          )
        );
      }
    }
  }, [onFileProcessed, maxFileSize, acceptedTypes, allowMultiple]);
  
  return (
    <div className="enhanced-drop-zone">
      <DropZone onDrop={handleDrop}>
        <div className="drop-zone-content">
          <FileIcon className="drop-icon" />
          <h3>Drop DOCX or PDF files here</h3>
          <p>Supports text-based and scanned documents</p>
          
          <ProcessingStatus files={processingFiles} />
        </div>
      </DropZone>
    </div>
  );
};
```

### 4. Error Handling and Recovery

```typescript
class ProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ProcessingError';
  }
}

const ERROR_CODES = {
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
  OCR_FAILED: 'OCR_FAILED',
  PDF_CORRUPTED: 'PDF_CORRUPTED',
  DOCX_CORRUPTED: 'DOCX_CORRUPTED',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;

class ErrorHandler {
  static handle(error: ProcessingError): UserMessage {
    switch (error.code) {
      case ERROR_CODES.FILE_TOO_LARGE:
        return {
          type: 'error',
          title: 'File Too Large',
          message: 'Please select a file under 10MB',
          action: 'Try again with a smaller file'
        };
      
      case ERROR_CODES.OCR_FAILED:
        return {
          type: 'warning',
          title: 'OCR Processing Issue',
          message: 'Could not extract text from scanned document',
          action: 'Try with a higher quality scan'
        };
      
      default:
        return {
          type: 'error',
          title: 'Processing Error',
          message: error.message,
          action: 'Please try again or contact support'
        };
    }
  }
}
```

## Performance Considerations

### Optimization Strategies

1. **Progressive Processing**
   - Text-based files: Immediate processing
   - Scanned files: Background processing with progress updates
   - Large files: Chunked processing with cancellation support

2. **Caching System**
   - Cache processed results by file hash
   - Store OCR results for identical images
   - Memory management for large documents

3. **Resource Management**
   - Limit concurrent OCR operations
   - Progressive image quality reduction for large PDFs
   - Worker pool management for OCR tasks

### Memory Optimization

```typescript
class MemoryManager {
  private static instance: MemoryManager;
  private activeOperations = 0;
  private maxOperations = 3;
  
  async processWithMemoryLimit<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    if (this.activeOperations >= this.maxOperations) {
      throw new ProcessingError(
        'Too many concurrent operations',
        ERROR_CODES.TOO_MANY_REQUESTS
      );
    }
    
    this.activeOperations++;
    try {
      return await operation();
    } finally {
      this.activeOperations--;
    }
  }
}
```

## Testing Strategy

### Unit Tests
- File type detection accuracy
- PDF content analysis correctness
- OCR result validation
- Error handling scenarios

### Integration Tests
- End-to-end file processing
- UI component interactions
- Tauri-specific functionality
- Cross-platform compatibility

### Performance Tests
- Large file processing
- Memory usage monitoring
- Concurrent operation limits
- Error recovery scenarios

## Security Considerations

### File Validation
- MIME type verification
- File size limits
- Content sanitization
- Malicious file detection

### Privacy
- Local processing only (no cloud uploads)
- Temporary file cleanup
- Memory clearing after processing
- No persistent storage of processed content

## Deployment Plan

### Phase 1: Development Environment
- Complete feature implementation
- Comprehensive testing
- Performance optimization
- Error handling refinement

### Phase 2: Staging Environment
- User acceptance testing
- Performance benchmarking
- Cross-platform validation
- Security review

### Phase 3: Production Release
- Gradual rollout
- Monitoring and analytics
- User feedback collection
- Performance monitoring

## Success Metrics

### Performance Metrics
- Average processing time per file type
- Success rate for different PDF scenarios
- Memory usage during processing
- User satisfaction scores

### Usage Metrics
- Number of files processed daily
- File type distribution
- Error rates and types
- User engagement with new features

## Future Enhancements

### Advanced Features
- Multi-language OCR support
- Handwriting recognition
- Table extraction from PDFs
- Image quality enhancement
- Batch processing interface

### Integration Opportunities
- Cloud storage integration
- Collaborative editing features
- Advanced formatting preservation
- Export to additional formats

This comprehensive plan provides a solid foundation for implementing robust drag-and-drop support for .docx and .pdf files, with detailed handling for all three PDF scenarios while maintaining the high standards of the existing RdLn application.
