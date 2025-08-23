# DOCX Input Support Implementation Plan

**Created**: 2025-08-23  
**Author**: Qwen Code Assistant  
**Status**: Planned  
**Priority**: Medium  

## Overview

This document outlines the implementation plan for adding DOCX input support to the RdLn application. Currently, RdLn supports text input, image drag-and-drop with OCR processing, and DOCX export functionality. This enhancement will allow users to directly import DOCX files into the application for comparison.

## Current State Analysis

### Supported Input Types
1. **Text Input**: Direct typing in text areas
2. **Image Input**: Drag-and-drop or paste of image files with OCR processing
3. **DOCX Export**: Existing functionality to export results as DOCX with track changes

### Target Enhancement
Add support for importing DOCX files directly, extracting their text content, and inserting it into the text input panels.

## Implementation Approach

### Technology Selection
We'll use `mammoth.js`, a specialized library for converting DOCX documents to HTML or text. This library:
- Runs entirely in the browser (client-side processing)
- Has no external dependencies
- Is specifically designed for DOCX parsing
- Is actively maintained with good documentation

### Integration Points

1. **TextInputPanel Component**:
   - Modify drag-and-drop handling to recognize DOCX files
   - Modify paste handling to recognize DOCX files
   - Add DOCX processing functionality

2. **Tauri File Drop Handler**:
   - Update to recognize DOCX files
   - Route DOCX files to appropriate processing

3. **File Type Detection Utilities**:
   - Create utility functions for identifying DOCX files

## Detailed Implementation Steps

### Task 1: Install Required Dependency
- Install `mammoth.js` library using npm

### Task 2: Create DOCX Processing Service
- Create a new service file `src/services/DocxProcessingService.ts`
- Implement DOCX text extraction functionality
- Add error handling for corrupted or invalid DOCX files
- Implement proper file type detection

### Task 3: Modify TextInputPanel Component
- Update `handleDrop` function to process DOCX files
- Update `handlePaste` function to process DOCX files from clipboard
- Add loading states for DOCX processing
- Add error handling for DOCX processing failures

### Task 4: Update Tauri File Drop Handler
- Modify `tauriFileDrop.ts` to recognize DOCX files
- Add routing for DOCX files to appropriate processing functions

### Task 5: Add User Interface Indicators
- Update drag-and-drop UI to indicate DOCX support
- Add appropriate loading and error states

### Task 6: Testing and Validation
- Test with various DOCX files (simple, complex, with images, etc.)
- Validate text extraction accuracy
- Test error handling with corrupted files
- Verify integration with existing functionality

## Technical Specifications

### File Type Detection
- MIME type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- File extension: `.docx`

### Error Handling
- Corrupted DOCX files
- Password-protected DOCX files (not supported by mammoth.js)
- Empty or invalid DOCX files
- Large DOCX files (performance considerations)

### Performance Considerations
- Client-side processing (no server dependencies)
- Large DOCX files may take time to process
- Memory usage for large documents

## File Modifications

### New Files
1. `src/services/DocxProcessingService.ts` - Core DOCX processing logic

### Modified Files
1. `src/components/TextInputPanel.tsx` - Add DOCX handling to drag-and-drop and paste
2. `src/utils/tauriFileDrop.ts` - Add DOCX file recognition
3. Possibly update UI components to indicate DOCX support

## Implementation Sequence

1. Install dependency
2. Create DocxProcessingService
3. Update TextInputPanel component
4. Update Tauri file drop handler
5. Update UI indicators
6. Testing and validation
7. Documentation updates

## Success Criteria

- [ ] DOCX files can be imported via drag-and-drop
- [ ] DOCX files can be imported via paste
- [ ] Text content is accurately extracted from DOCX files
- [ ] Appropriate error handling for invalid files
- [ ] No regressions in existing functionality
- [ ] Performance acceptable for typical DOCX files
- [ ] Integration with Tauri file drop works correctly

## Testing Plan

### Test Cases

1. **Basic Functionality**
   - Simple DOCX file with plain text
   - DOCX with basic formatting (bold, italic)
   - DOCX with lists and tables (text only extraction)

2. **Edge Cases**
   - Empty DOCX file
   - Corrupted DOCX file
   - Very large DOCX file
   - DOCX with embedded images (should extract text only)

3. **Integration Tests**
   - DOCX import followed by comparison
   - Mixed input types (text, image OCR, DOCX)
   - Tauri drag-and-drop of DOCX files

4. **Error Handling**
   - Invalid file format (wrong extension)
   - Password-protected DOCX (not supported)
   - Network issues during processing (not applicable for client-side)

### Validation Metrics

- Text extraction accuracy (>95% of visible text)
- Processing time for various file sizes
- Memory usage during processing
- Error handling effectiveness

## Dependencies

- `mammoth.js` library
- Existing RdLn infrastructure (TextInputPanel, Tauri handlers)
- TypeScript type definitions

## Risks and Mitigations

### Risks
1. **Large DOCX Processing**: Large files may cause UI freezing
   - Mitigation: Implement progress indicators and async processing

2. **Complex Formatting Loss**: Mammoth.js extracts text, not formatting
   - Mitigation: Clearly communicate to users that only text is extracted

3. **Browser Compatibility**: Potential issues with different browser JavaScript engines
   - Mitigation: Test across supported browsers

4. **Memory Issues**: Very large DOCX files could cause memory problems
   - Mitigation: Implement file size limits and streaming if necessary

### Out of Scope
- Password-protected DOCX files (not supported by mammoth.js)
- DOCX formatting preservation (text-only extraction)
- RTF file support (different format entirely)
- DOC (legacy Word format) support (different format from DOCX)

## Timeline

### Estimated Implementation Time
- Dependency installation: 1 hour
- Service creation: 4 hours
- Component modifications: 6 hours
- Tauri integration: 2 hours
- UI updates: 2 hours
- Testing and validation: 6 hours
- Documentation: 2 hours

**Total Estimated Time**: 23 hours

## Approval

This plan requires approval before implementation begins.