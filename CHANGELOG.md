
# Changelog

All notable changes to this project are documented here. This file follows the Keep a Changelog conventions. For full implementation write-ups and deep dives, see the docs/features directory.

## [Unreleased]

### Features

### Refactoring

### Chore

### Contents
- 0.6.5 - 2025-09-05
- 0.6.4 - 2025-09-05
- 0.6.3 - 2025-09-03
- 0.6.2 - 2025-09-02
- 0.6.1 - 2025-09-01
- 0.6.0 - 2025-08-30


## [0.6.5] - 2025-09-05

### UI: Beta Card Positioning & Spacing
- Status bar moved into main scroll container; now scrolls with content instead of staying fixed under the header.
- Added position prop to StatusBar ('fixed' | 'static') to control behavior; app now uses static in main.
- Adjusted z-order to align with input/output panels; no overlaying during scroll.
- Tightened spacing and made the card content-fit (inline-flex, whitespace-nowrap, max-w-full with safe horizontal overflow).
- Tuned top padding of main to sit the bar just below header (pt-[7.5rem]), with consistent bottom clearance.

### Notes
- No changes to comparison logic or OCR pipelines.
- Visual-only update; safe across themes and responsive breakpoints.

## [0.6.4] - 2025-09-05

### 🚀 Feature: Parallel OCR in Production (2‑Worker Pool)
- Enabled true parallel OCR using a dedicated 2‑worker pool for the 10‑language set (eng, chi_sim, chi_tra, spa, fra, deu, jpn, kor, ara, rus).
- Prewarms both workers on app start (when enabled) and records metrics for acquire wait and recognize durations.
- Falls back to existing single‑worker path automatically on pool errors.

### 🔧 Refactoring / Integration
- Engine: `OCR_Engine_New` now acquires from `OCRWorkerPool` when the feature flag is enabled; otherwise uses the existing cached worker path.
- App: Prewarms the pool during initialization; terminates both the pool and single‑worker caches on unmount.
- UI: Added a small pool status indicator (busy/total) in the StatusBar for development only; no production UI changes.
- Logging: Removed global console override; gated all `[OCR_DEBUG]` logs locally behind `appConfig.dev.LOGGING.ENABLED` for clean production consoles.
- Cleanup: Removed an unused variable in the pool prewarm effect and simplified cleanup.

### 🧪 Prototyping
- Added a parallel 2‑worker benchmark prototype: `Prototypes/OCR - 2 workers benchmark/ocr-2-workers-benchmark-v3-codex.html` (non‑production).

### 🧱 Safety & Compatibility
- No breaking changes to `OCRService` or hook APIs; multiworker is enabled via feature flag (now on in production) with automatic fallback.


## [0.6.3] - 2025-09-03

### 🐛 Critical Fix: OCR Progress Modal Issues
- **PROBLEM SOLVED**: OCR progress modal stuck at 0% and cross-contamination between concurrent OCR operations
- **ROOT CAUSE**: DataCloneError when updating prewarmed worker loggers + shared worker causing progress mixing between panels
- **BREAKTHROUGH**: Implemented job-specific progress tracking with global message dispatcher
- **RESULT**: Real progress display (0%, 1%, 4%, 7%, etc.) and isolated progress per input panel

### 🔧 Technical Implementation

#### **OCR Progress System Overhaul**
- **`src/services/OCR_Engine_New.ts`**: 
  - Fixed DataCloneError by removing problematic `setParameters` call with logger function serialization
  - Added global progress handler that installs once per worker to avoid handler conflicts
  - Implemented job-specific progress callbacks using Map registry for operation-to-job mapping
  - Real progress extraction from worker messages matches console log values
  - Proper cleanup of callbacks and mappings prevents memory leaks
- **`src/hooks/useOCR.ts`**:
  - Simplified progress phases to single 'text_extraction' phase for consistency
  - Updated progress callback to handle real Tesseract.js progress values (0.0-1.0 range)
  - Improved time estimation and progress clamping
- **`src/components/TextInputPanel.tsx`**:
  - Streamlined progress modal UI to show single extraction phase
  - Removed complex multi-phase progress indicators in favor of real progress display

#### **Concurrent Operations Support**
- **Job Isolation**: Each OCR operation gets unique operation ID mapped to worker job ID
- **Progress Dispatching**: Global handler routes progress messages to correct panel callbacks
- **Resource Management**: Automatic cleanup when operations complete or are cancelled
- **Worker Reuse**: Maintains prewarmed worker benefits while fixing progress tracking

### ✅ User Experience Improvements

#### **Reliable Progress Feedback**
- **Real Progress Values**: Shows actual Tesseract.js progress (0%, 1%, 4%, 7%, 10%, etc.) instead of stuck at 0%
- **Panel Isolation**: Panel A progress only affects Panel A modal, Panel B progress only affects Panel B modal
- **Concurrent Support**: Multiple OCR operations can run simultaneously without progress interference
- **Visual Consistency**: Smooth progress updates throughout the entire OCR process

#### **Developer Experience**
- **Debug Friendly**: Console logs preserved for troubleshooting while modal shows clean progress
- **Error Resilient**: Graceful handling of worker message interception failures
- **Memory Efficient**: Proper cleanup prevents callback accumulation and memory leaks

### 🐛 Minor Fix: Progress Rate Calculation
- **PROBLEM SOLVED**: OCR progress rate always showing "0.0% per sec" instead of meaningful values
- **ROOT CAUSE**: Formula was dividing progress by 100 first (converting to decimal 0.0-1.0) then dividing by elapsed time
- **FIX**: Removed unnecessary division by 100 to keep progress in percentage units throughout calculation
- **RESULT**: Now shows meaningful progress rates like "5.2% per sec" or "12.8% per sec" for better user feedback

#### **Technical Details**
- **`src/components/TextInputPanel.tsx`**: Fixed progress rate calculation formula from `((progress / 100) / elapsed_seconds)` to `(progress / elapsed_seconds)`
- **Impact**: Users now get accurate feedback on OCR processing speed instead of misleading "0.0% per sec" display

## [0.6.2] - 2025-09-02

### 🐛 Critical Fix: OCR Text Visibility Regression
- **PROBLEM SOLVED**: OCRed text was not appearing in the input text panel after OCR completion due to issues in the legacy OCR processing pipeline
- **ROOT CAUSE**: Complex legacy post-processing code in `OCRService.ts` was causing text to be lost or corrupted during processing
- **BREAKTHROUGH**: Redirected all OCR operations to use the modern `OCR_Engine_New.ts` instead of legacy implementations
- **RESULT**: OCRed text now properly appears in input panels immediately after OCR completion

### 🔧 Technical Implementation

#### **OCR Service Modernization**
- **`src/services/OCRService.ts`**: 
  - Updated `extractTextFromImage()` to delegate to `OCR_Engine_New.extract()` instead of legacy path
  - Updated `extractTextFromImageLegacy()` to use `OCR_Engine_New.extract()` instead of complex legacy implementation
  - Updated `detectLanguage()` to use modern multilingual worker approach
  - Fixed TypeScript compilation issues with Map iterators and type definitions
- **`src/services/OCR_Engine_New.ts`**:
  - Fixed compatibility issues with Tesseract.js output formats
  - Removed unsupported `paragraphs` property from recognition options
  - Updated text extraction logic to work with available properties

#### **Code Quality Improvements**
- **Type Safety**: Added missing type imports and fixed array type issues
- **Performance**: Fixed Map iterator issues using `Array.from()` for better browser compatibility
- **Maintainability**: Removed complex legacy post-processing pipelines that were prone to errors
- **Modularity**: Clean separation between OCR service interface and engine implementation

### ✅ User Experience Improvements

#### **Reliable OCR Processing**
- **Immediate Results**: OCRed text appears in input panel without delay or loss
- **Consistent Behavior**: Works reliably across all supported image formats and languages
- **Error Handling**: Improved fallback mechanisms and error reporting
- **Performance**: Faster processing through modern engine optimizations

#### **Cross-Platform Compatibility**
- **Web Deployment**: Works correctly in browser environments
- **Electron Desktop**: Maintains full functionality in desktop builds
- **Mobile Support**: Responsive design maintains OCR capabilities on mobile devices

### 🚀 Development Excellence

#### **SSMR Methodology**
- **Safe**: Zero breaking changes, all existing functionality preserved
- **Step-by-step**: Incremental updates with thorough testing at each phase
- **Modular**: Clean separation of concerns with focused responsibilities
- **Reversible**: Clear architectural boundaries allow easy rollback if needed

#### **Quality Assurance**
- **TypeScript Compliance**: Fixed all compilation errors and type issues
- **Backward Compatibility**: All existing OCR service APIs continue to work unchanged
- **Performance Monitoring**: Maintained existing performance tracking and metrics
- **Error Recovery**: Enhanced error handling with better user feedback

### 📁 Files Modified (high level)
- `src/services/OCRService.ts` - Service modernization and delegation to new engine
- `src/services/OCR_Engine_New.ts` - Engine compatibility fixes
- `src/services/SimpleOCRCache.ts` - Map iterator fixes

### 🎯 Impact
This fix resolves a critical regression that was preventing users from seeing OCRed text in the input panels, restoring core functionality and improving the overall reliability of the document comparison workflow.

## [0.6.1] - 2025-09-01

### Fixes
- Text input color: Restored theme-consistent user text color in `TextInputPanel` by enforcing theme body color on `.user-input-typography` (`src/styles/glassmorphism.css`). Uses `color: var(--theme-text-body) !important;` to override legacy utility classes and ensure correct inheritance across themes.

### Styles/CSS Cleanup (INP, safe and non-breaking)
- Removed unused legacy button utilities: `.enhanced-button`, `.subtle-button`, and `bg-theme-*` helpers, plus their unused `--button-*` variables from `:root`.
- Removed unused content-panel utilities: `.glass-effect`, `.glass-content-panel` (and hover), chunk-container overrides within content panels, and base hover variant `.glass-panel.hover-from-handle` (theme-specific variants remain in theme files).
- Removed unused utilities: `.line-clamp-2`, `.custom-scrollbar` rules.
- Consolidated duplicate `.user-input-typography` rules into a single definition, keeping CJK-friendly settings (`font-variant-east-asian: proportional-width;`, `font-weight: 500 !important`).
- Kept active selectors: `.glass-panel` (+ hover), `.glass-input-field` (+ hover/focus), and `.libertinus-math-text` (for output).

### Validation
- Repo-wide search confirmed no references to removed selectors/variables.
- Smoke test passed: text color, placeholder, focus ring, font size; theme switching; selection styling; OCR flows; redline output integrity.

## [0.6.0] - 2025-08-30

### 🎯 **FEATURE: Multi-Script Line Joining Enhancement**
- **EXTENDED SUPPORT**: Enhanced OCR post-processing to support line joining for Cyrillic and Arabic scripts in addition to existing Latin and CJK support
- **COMPREHENSIVE UNICODE COVERAGE**: Added complete Unicode ranges for Cyrillic (`\u0400-\u04ff`, `\u0500-\u052f`, `\u2de0-\u2dff`, `\ua640-\ua69f`) and Arabic (`\u0600-\u06ff`, `\u0750-\u077f`, `\u08a0-\u08ff`, `\ufb50-\ufdff`, `\ufe70-\ufeff`) scripts
- **PARAGRAPH RECONSTRUCTION**: Improved text reconstruction for documents in Russian, Bulgarian, Serbian, Ukrainian, Arabic, Persian/Farsi, Urdu, and other languages using these scripts
- **PERFORMANCE OPTIMIZED**: Efficient regex patterns with minimal performance impact even with extended character class coverage

### 🚀 **ENHANCEMENT: OCR Engine Post-Processing Refinement**
- **BUG FIX**: Resolved critical regex syntax error in CJK character class definitions that caused "Range out of order" exceptions
- **ENHANCED PATTERN MATCHING**: Added new patterns for punctuation followed by line breaks to improve text reconstruction quality
- **CONSISTENT BEHAVIOR**: Unified line joining logic across all supported scripts for predictable text processing
- **BACKWARD COMPATIBILITY**: All existing functionality preserved with no breaking changes to OCR processing pipeline

### ✨ **TECHNICAL: Implementation Excellence**
- **MODULAR DESIGN**: Extended `removeCJKSpacesFromRenderedText` function to handle all supported scripts while maintaining clean, readable code
- **PERFORMANCE MONITORING**: Maintained existing performance tracking and iteration limits to ensure consistent processing times
- **ERROR HANDLING**: Preserved robust error handling with proper fallback mechanisms
- **TYPE SAFETY**: Full TypeScript support with appropriate type definitions for extended character classes

### 🧪 **QUALITY ASSURANCE**
- **BUILD VERIFICATION**: Confirmed successful build with all changes applied and no syntax errors
- **REGRESSION TESTING**: Validated that existing Latin and CJK text processing continues to work correctly
- **SCRIPT COVERAGE**: Comprehensive Unicode range coverage for all supported writing systems
- **EDGE CASE HANDLING**: Proper handling of mixed-script documents and complex text layouts

### 🎯 **USER IMPACT**
- **IMPROVED ACCURACY**: Better text reconstruction for documents in multiple languages
- **ENHANCED UX**: More readable OCR output for Cyrillic and Arabic script documents
- **PROFESSIONAL QUALITY**: Production-ready enhancement suitable for legal and business document processing
- **GLOBAL ACCESSIBILITY**: Extended support for international users working with non-Latin scripts


> Older releases (0.5.28 and earlier) have been moved to docs/changelog/Changelog-Archive-2025-08.md.

## Archives

- 2025-08: docs/changelog/Changelog-Archive-2025-08.md
- 2025-07: docs/changelog/Changelog-Archive-2025-07.md
- 2025-06: docs/changelog/Changelog-Archive-2025-06.md
- 2025-01: docs/changelog/Changelog-Archive-2025-01.md

## Contributing

We welcome contributions to improve the document comparison algorithm and user experience. Please refer to our development guidelines and test suite when proposing changes.





## License

This project is proprietary software owned by RdLn Team. See LICENSE file for full terms and conditions.

