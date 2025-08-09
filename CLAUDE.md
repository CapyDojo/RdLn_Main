# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server
npm run dev                    # Start development server on localhost:5173

# Production builds
npm run build                  # Standard web build
npm run build:web             # Explicit web build for Netlify
npm run preview               # Preview production build

# Code quality
npm run lint                  # ESLint code quality checks

# Testing commands
npm run test                  # Run tests in watch mode
npm run test:run              # Run tests once
npm run test:ui               # Run tests with Vitest UI
npm run test:coverage         # Run tests with coverage reports
npm run test:unit             # Unit tests only
npm run test:integration      # Integration tests with OCR config
npm run test:performance      # Performance benchmarking tests
npm run test:accuracy         # OCR accuracy validation tests
npm run test:ocr              # All OCR-specific tests
npm run test:real             # Real OCR tests without coverage tracking
npm run test:watch            # Watch mode for active development

# Platform-specific builds
npm run tauri:dev             # Tauri development mode
npm run tauri:build           # Build Tauri desktop app
npm run electron:dev          # Electron development mode
npm run electron:build        # Build Electron app (cross-platform)
npm run electron:build:win    # Windows-specific Electron build
npm run electron:build:mac    # macOS-specific Electron build
npm run electron:build:linux  # Linux-specific Electron build

# Asset management
npm run download:fonts        # Download Google Fonts
npm run download:tesseract    # Download Tesseract OCR assets
npm run copy:tesseract        # Copy Tesseract assets for build
npm run download:all          # Download all external assets
```

## Architecture Overview

RdLn is a professional document comparison tool with OCR capabilities built on **React 18 + TypeScript + Vite**. The application features a performance-optimized, modular architecture designed to handle enterprise-scale document processing with complete client-side confidentiality.

### Core Application Structure

- **App.tsx**: Main application orchestrator with theme providers, routing, and global state management
- **ComparisonInterface.tsx**: Primary comparison orchestration component that coordinates all document comparison functionality
- **Layout System**: Responsive design with dedicated desktop/mobile components
  - `DesktopInputLayout` / `MobileInputLayout`: Platform-optimized input interfaces
  - `OutputLayout`: Results display with advanced resize and scroll synchronization
- **Theme System**: CSS custom properties-based theming with 11+ professional themes and glassmorphism effects

### Key Services & Algorithms

- **OCRService**: Tesseract.js integration with multi-language support (50+ languages), worker management, and intelligent caching
- **OCROrchestrator**: Coordinates complex OCR workflows with progress tracking and cancellation support
- **MyersAlgorithm**: Core document comparison engine optimized for legal documents with progressive chunking for large files (500k+ characters)
- **LanguageDetectionService**: Automatic language detection for optimal OCR accuracy
- **PerformanceMonitor**: Built-in performance tracking, memory usage monitoring, and system protection

### State Management Architecture

- **Context Providers**:
  - `ThemeContext`: Theme management with CSS variable injection and theme reordering
  - `LayoutContext`: Responsive layout state and breakpoint management
  - `ExperimentalLayoutContext`: Feature flags for experimental UI components
  - `FontSizeContext`: Dynamic font size management across the application
  - `PerformanceContext`: Performance monitoring and metrics collection

- **Custom Hooks Library**:
  - `useComparison`: Core comparison logic with cancellation and progress tracking
  - `useOCR`: OCR operations with multi-language support and error handling
  - `usePerformanceMonitor`: Performance tracking and optimization
  - `useResizeHandlers` / `useScrollSync`: Advanced UI interaction management
  - `useJumpToResults` / `useResultsOverlay`: Navigation and overlay management

### Component Architecture

- **Modular Panel System**: All panels use identical DOM structure for visual consistency
- **Glassmorphism UI**: Modern glass-panel effects with CSS custom properties
- **Performance-First Design**: Chunked rendering prevents browser crashes on large documents
- **Error Boundaries**: Graceful degradation throughout the component tree
- **Experimental Features**: Feature-flagged components in `src/components/experimental/`

## Styling Architecture

### Theme System
- **CSS Custom Properties**: Dynamic theming with 11 professional themes
- **Glassmorphism Effects**: Modern glass-panel aesthetics with backdrop filters
- **Theme Definitions**: TypeScript-based theme configurations in `src/themes/definitions/`
- **CSS Organization**: Modular stylesheets organized by feature and theme

### Responsive Design
- **Mobile-First**: Dedicated mobile components with vertical stacking
- **Desktop Optimization**: Side-by-side layouts with advanced resize handling
- **Breakpoint Management**: Consistent responsive behavior across components

### CSS Architecture
```
src/styles/
├── themes/           # Individual theme CSS files
├── glassmorphism.css # Base glass-panel effects
├── layouts/          # Layout-specific styles
└── experimental-features.css # Feature-flagged styles
```

## Design System & Documentation

### Design Documentation
RdLn includes a comprehensive design system located in `docs/design/`:
- **DesignMethodologyFramework.md**: ECI (Explore-Compare-Implement) methodology for design projects
- **DesignPatternLibrary.md**: Reusable patterns, gradient systems, and technical implementations  
- **BambooThemeLifeStory.md**: Complete case study of theme evolution from simple to spectacular
- **README.md**: Overview and quick start guide for design documentation

**For Design Work**: Always reference the design documentation before starting theme or UI work. Follow the ECI methodology and use established patterns from the pattern library.

## Development Guidelines

### SSMR Methodology
This codebase follows **Safe, Step-by-step, Modular, Reversible** development:

1. **Safe**: All changes include error handling and graceful degradation
2. **Step-by-step**: Incremental changes with feature flags for easy rollback
3. **Modular**: Components are extracted into reusable, testable pieces
4. **Reversible**: Every change can be easily reverted without breaking dependencies

### Critical Components (Handle with Care)
- **MyersAlgorithm.ts**: Core comparison engine - requires thorough testing
- **OCRService.ts**: OCR orchestration - test with real images across languages
- **ComparisonInterface.tsx**: Main UI coordination - verify all user interactions
- **RedlineOutput.tsx**: Results display with ref-based scroll synchronization
- **Theme system**: CSS variable changes affect entire application

### Performance Considerations
- **Chunked Processing**: Large documents processed in chunks to maintain responsiveness
- **Worker Management**: OCR workers require proper cleanup to prevent memory leaks
- **Progressive Rendering**: Results streamed progressively for large comparisons
- **Memory Monitoring**: Built-in tracking prevents browser crashes

### Development Workflow
1. Read `docs/DevRules/DEVELOPMENT_GUIDELINES.md` at session start
2. Use feature flags for experimental changes
3. Test performance impact on large documents (>100k characters)
4. Verify mobile/desktop layouts
5. Test OCR functionality with actual images

## Testing Setup

### Framework & Tools
- **Vitest**: Primary testing framework with React Testing Library
- **Coverage**: V8 coverage with configurable thresholds (70% global, 90% for critical components)
- **Test Types**: Unit, integration, performance, and accuracy testing
- **OCR Testing**: Dedicated test suite with real document fixtures in `tests/images/`

### Test Configuration
- **vitest.config.ts**: Standard unit/integration tests
- **vitest.ocr.config.ts**: OCR-specific tests with extended timeouts
- **Test Images**: Professional document samples for OCR validation
- **Coverage Thresholds**: Strict requirements for critical components

### Test Categories
```bash
# Unit tests - Fast, isolated component testing
npm run test:unit

# Integration tests - OCR workflows and component interactions  
npm run test:integration

# Performance tests - Benchmarking and optimization validation
npm run test:performance

# Accuracy tests - OCR quality and comparison algorithm validation
npm run test:accuracy
```

## Key Features

### Document Comparison
- **Myers Algorithm**: Optimized diff engine with progressive chunking
- **Legal Document Focus**: Specialized tokenization for contracts and legal text
- **Performance Optimization**: Handles enterprise-scale documents (500k+ characters)
- **Visual Redlining**: Professional markup with customizable styling

### OCR Integration
- **Multi-Language Support**: 50+ languages with automatic detection
- **Progressive Processing**: Real-time progress feedback and cancellation
- **Quality Optimization**: Language-specific optimization and post-processing
- **Client-Side Processing**: Complete privacy with no server uploads

### Advanced UI Features
- **Responsive Design**: Optimized workflows for desktop and mobile
- **Theme System**: 11+ professional themes with glassmorphism effects
- **Experimental Features**: Feature-flagged components for testing new functionality
- **Performance Monitoring**: Real-time performance metrics and system protection

## Configuration Files

### Build & Development
- **vite.config.ts**: React + TypeScript setup with HMR on localhost:5173
- **vitest.config.ts**: Testing configuration with coverage thresholds
- **tailwind.config.js**: Utility-first CSS with theme-aware color system
- **tsconfig.json**: Strict TypeScript configuration

### Platform-Specific
- **netlify.toml**: Web deployment configuration
- **src-electron/**: Electron desktop app configuration
- **src-tauri/**: Tauri cross-platform app configuration

### Asset Management
- **public/tessdata/**: OCR language training data
- **public/tesseract/**: Tesseract WebAssembly files
- **scripts/**: Asset download and processing utilities

## Special Considerations for Claude

### Development Server Management
- **External Dev Server**: Do NOT start the development server (`npm run dev`) - it will be started externally by the user
- **Port Conflicts**: Avoid any commands that might interfere with the externally managed dev server on localhost:5173

### OCR Development
- **Worker Cleanup**: Always terminate OCR workers on component unmount to prevent memory leaks
- **Language Loading**: Test language detection and loading with various document types
- **Progress Feedback**: Ensure progress indicators work properly for long-running operations
- **Error Handling**: Test error scenarios (missing language files, processing failures)

### Performance Monitoring
- **Large Document Testing**: Always test changes with documents >100k characters
- **Memory Usage**: Monitor memory consumption during extended processing
- **Progressive Streaming**: Verify chunked processing works for large comparisons
- **Browser Limits**: Respect browser memory and processing constraints

### Theme Development
- **CSS Variables**: Theme changes require updating CSS custom properties across DOM
- **Glass Effects**: Backdrop filters may not work in all browsers - provide fallbacks
- **Responsive Testing**: Verify theme changes work across desktop/mobile layouts
- **Performance Impact**: Monitor rendering performance with glassmorphism effects

### Mobile Considerations
- **Vertical Layout**: Mobile uses stacked layout vs desktop side-by-side
- **Touch Interactions**: Test resize handles and scroll behavior on touch devices  
- **Performance**: Mobile devices have stricter memory and processing limits

### Development vs Production
- **Testing Components**: Remove development testing components before production builds
- **Debug Modes**: Disable debug logging and performance metrics in production
- **Asset Optimization**: Ensure all assets are properly optimized for deployment
- **Feature Flags**: Review experimental feature flags before release

## Project Structure Reference

```
src/
├── algorithms/        # Core comparison algorithms
├── components/        # React components
│   ├── experimental/  # Feature-flagged components
│   └── dev-dashboard/ # Development tools
├── contexts/          # React context providers
├── hooks/            # Custom React hooks
├── services/         # Business logic and APIs
├── styles/           # CSS and theme files
├── themes/           # Theme definitions and utilities
├── types/            # TypeScript type definitions
└── utils/            # Helper functions and utilities

tests/
├── images/           # Test document fixtures
├── accuracy/         # OCR accuracy tests
├── performance/      # Performance benchmarks
└── rendering/        # UI rendering tests
```

## Quick Reference Commands

```bash
# Start development with hot reload
npm run dev

# Run full test suite with coverage
npm run test:coverage

# Build for production deployment
npm run build

# Test OCR functionality
npm run test:ocr

# Lint code quality
npm run lint
```

## Important Notes

- **Client-Side Only**: All processing occurs in the browser for complete privacy
- **Memory Management**: Large documents require careful memory handling
- **Performance First**: UI remains responsive even with 500k+ character documents
- **SSMR Development**: All changes follow Safe, Step-by-step, Modular, Reversible principles
- **Cross-Platform**: Supports web, Electron, and Tauri deployment targets