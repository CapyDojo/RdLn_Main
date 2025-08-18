# RdLn™ Document Comparison Tool - Project Context

## Project Overview

This is the **RdLn™ Document Comparison Tool**, a professional-grade application for comparing documents with advanced features like OCR (Optical Character Recognition) and a modern glassmorphism UI. It's built using React, TypeScript, and Vite.

### Key Features

- **Document Comparison**: Uses a custom implementation of the Myers diff algorithm to compare text documents, optimized for legal and professional documents.
- **OCR Integration**: Extracts text from images using Tesseract.js, supporting multiple languages with intelligent post-processing.
- **Glassmorphism UI**: Modern, sleek interface with glass-like panels.
- **Client-Side Processing**: All processing happens in the browser for privacy.
- **Performance Optimized**: Uses advanced techniques like tokenization, prefix/suffix trimming, paragraph-level trimming, streaming for large documents, and chunked rendering for handling large documents efficiently.
- **RdLn Memory**: Session management to save and load comparison sessions.
- **Experimental Features**: Includes various experimental UI and interaction enhancements.

### Unique Architectural Aspects

- **Myers Algorithm Optimizations**: The core diff algorithm (`src/algorithms/MyersAlgorithm.ts`) includes several custom optimizations:
  - **Tokenization**: Instead of character-by-character comparison, it tokenizes text into meaningful units (words, numbers, punctuation, whitespace) for more semantically accurate diffs.
  - **Trimming**: Implements both character-level and paragraph-level prefix/suffix trimming to reduce the problem space before running the expensive diff algorithm.
  - **Streaming**: For very large documents (measured in tokens), a streaming version of the Myers algorithm processes chunks, yielding to the UI thread periodically to prevent browser lockup.
  - **Chunking**: Large result sets are managed to prevent UI crashes.
  - **Semantic Chunking**: When rendering results, content is divided into semantic blocks for better performance and rendering.
- **OCR Enhancements**: The OCR service (`src/services/OCRService.ts`) includes sophisticated post-processing for different languages, language detection caching, and worker caching for performance. It integrates with Tauri for native capabilities when available.
- **Error Handling & Performance Monitoring**: Standardized error handling (`src/utils/errorHandling.ts`) and a central performance monitoring service (`src/services/PerformanceMonitor.ts`) provide robustness and insights.
- **SSMR Methodology**: Development follows a Safe, Step-by-step, Modular, Reversible approach, evident in feature flags and progressive implementation within the codebase.

### Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **OCR Engine**: Tesseract.js
- **Testing**: Vitest, Playwright
- **Desktop Builds**: Tauri, Electron

## Project Structure

The project has a standard React/Vite structure with `src/` containing the main application code:

- `src/App.tsx`: Main application component.
- `src/components/`: React components for UI elements.
- `src/hooks/`: Custom React hooks for logic encapsulation (e.g., `useComparison` for diff logic, `useResizeHandlers`).
- `src/algorithms/`: Implementation of the document comparison algorithm (`MyersAlgorithm.ts`).
- `src/services/`: Services for OCR (`OCRService.ts`), performance monitoring (`PerformanceMonitor.ts`), etc.
- `src/contexts/`: React context providers (Theme, Layout, Scroll Lock).
- `src/config/`: Application configuration files (UI, System limits, Feature flags in `appConfig.ts`).
- `src/types/`: TypeScript type definitions.
- `src/utils/`: Utility functions (error handling, word tokenization, performance utils).

## Building and Running

### Prerequisites

- Node.js (version specified in `package.json` engines, or latest LTS)
- npm (comes with Node.js)

### Installation

```bash
npm install
```

This command installs all the necessary dependencies listed in `package.json`.

### Development

```bash
npm run dev
```

Starts the Vite development server with hot reloading.

### Production Build

```bash
npm run build
```

Builds the application for production, outputting to the `dist/` directory.

### Running Tests

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run OCR tests
npm run test:ocr

# Run all tests
npm test
```

### Desktop Application Builds

#### Tauri

```bash
# Development
npm run tauri:dev

# Build
npm run tauri:build
```

#### Electron

```bash
# Development
npm run electron:dev

# Build for Windows
npm run electron:build:win

# Build for Mac
npm run electron:build:mac

# Build for Linux
npm run electron:build:linux
```

## Development Conventions

- **SSMR Approach**: Development follows a Safe, Step-by-step, Modular, Reversible methodology, often seen with feature flags and progressive enhancements.
- **TypeScript**: The codebase is fully typed with TypeScript for better maintainability and error checking.
- **Modular Components**: UI and logic are separated into reusable components and hooks.
- **Performance Monitoring**: Performance is monitored using custom hooks and services.
- **Error Handling**: Standardized error handling with specific error categories and user messages.
- **Configuration**: Centralized configuration files (`src/config/`) manage UI, system limits, and feature flags.
- **Context API**: React Context is used for managing global state like theme, layout, and scroll lock.