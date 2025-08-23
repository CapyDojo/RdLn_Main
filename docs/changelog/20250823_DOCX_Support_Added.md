# Changelog

## [0.5.16] - 2025-08-23

### Added
- DOCX input support for importing Microsoft Word documents directly into text panels
- File type detection for DOCX and legacy DOC files
- Graceful handling of unsupported DOC files with user-friendly error messages
- Integration with drag-and-drop and paste functionality
- Support for DOCX files in Tauri desktop builds
- Comprehensive unit and integration tests
- Documentation for DOCX input support

### Changed
- Updated TextInputPanel to handle DOCX files through drag-and-drop and paste operations
- Enhanced Tauri file drop handler to support DOCX files
- Improved error handling and user feedback for file processing

### Technical Details
- Implemented using the mammoth.js library for DOCX text extraction
- Follows the infrastructure approach outlined in the 20250813 plan
- Client-side processing ensures data privacy
- File size limit of 10MB for performance and memory management
- Architecture designed for future PDF support