# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Linting
npm run lint

# Testing
npm run test           # Run tests in watch mode
npm run test:run       # Run tests once
npm run test:ui        # Run tests with UI
npm run test:coverage  # Run tests with coverage
npm run test:unit      # Unit tests only
npm run test:integration # Integration tests only
npm run test:ocr       # OCR-specific tests
npm run test:real      # Real OCR tests (no coverage)
```

## Architecture Overview

This is RdLn, a professional document comparison tool with OCR capabilities built on React 18 + TypeScript + Vite. The application uses a modular architecture with performance optimization for large document processing.

### Core Components Structure

- **App.tsx**: Main application with theme providers and routing
- **ComparisonInterface.tsx**: Primary orchestration component that coordinates all document comparison functionality
- **Layout Components**: Modular input/output layouts
  - `DesktopInputLayout` / `MobileInputLayout`: Responsive input layouts
  - `OutputLayout`: Results display with resize capabilities
- **OCR Integration**: Multi-language text extraction with 50+ language support
- **Theme System**: Comprehensive theming with glassmorphism UI effects

### Key Services

- **OCRService**: Tesseract.js wrapper with caching, language detection, and worker management
- **MyersAlgorithm**: Core document comparison engine optimized for legal documents with progressive chunking
- **Performance Monitoring**: Built-in performance tracking and memory management
- **Background Services**: Language loading, caching, and cleanup services

### State Management

- **Context Providers**:
  - `ThemeContext`: Theme management and CSS variable injection
  - `LayoutContext`: Responsive layout state
  - `ExperimentalLayoutContext`: Feature flags for experimental UI features
- **Custom Hooks**: Comprehensive hook library for comparison logic, OCR, performance, and UI interactions

### Styling Architecture

- **Glassmorphism UI**: Modern glass-panel effects with consistent visual hierarchy
- **Theme System**: CSS custom properties with dynamic theme switching
- **Responsive Design**: Mobile-first approach with dedicated mobile/desktop components
- **CSS Organization**: Modular stylesheets organized by feature/theme

## Development Guidelines

At the start of each session, read docs\DevRules\DEVELOPMENT_GUIDELINES.md and adhere to them unless otherwise specified.

### SSMR Methodology
This codebase follows **Safe, Step-by-step, Modular, Reversible** (SSMR) development:
- Make incremental changes with feature flags
- Ensure each change can be easily reverted
- Maintain backward compatibility during refactoring
- Use performance monitoring to validate changes

### Component Architecture
- All panels use identical DOM structure for visual consistency
- Components are extracted into modular, reusable pieces
- Performance-first design for handling large documents (500k+ characters)
- Error boundaries and graceful degradation throughout

### Performance Considerations
- Chunked rendering prevents browser crashes on large documents
- Smart resource management with worker cleanup
- Memory usage tracking during processing
- Progressive section streaming for large comparisons

## Testing Setup

- **Framework**: Vitest with React Testing Library
- **Coverage**: V8 coverage reporting
- **Test Types**: Unit, integration, performance, and accuracy tests
- **OCR Testing**: Dedicated OCR test suite with real document fixtures
- **Image Assets**: Test documents in `tests/images/` directory

## Key Features

- **Document Comparison**: Myers algorithm-based diff engine
- **OCR Integration**: Multi-language text extraction with intelligent language detection
- **Performance Optimization**: Handles enterprise-scale documents efficiently
- **Client-Side Processing**: Complete confidentiality with no server uploads
- **Responsive Design**: Optimized for both desktop and mobile workflows
- **Theme System**: 10+ professional themes with glassmorphism effects

## Configuration Files

- **Vite Config**: Standard React setup with HMR on localhost:5173
- **TypeScript**: Strict mode with comprehensive type coverage
- **Tailwind**: Utility-first CSS framework
- **ESLint**: Code quality enforcement
- **Vitest**: Testing configuration with multiple test modes

## Special Considerations

- OCR workers require cleanup on component unmount to prevent memory leaks
- Large document processing uses progressive chunking to maintain browser responsiveness
- Theme switching requires CSS custom property updates across the entire DOM tree
- Mobile layout uses vertical stacking vs desktop side-by-side layout