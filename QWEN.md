# RdLn™ Document Comparison Tool - Project Context

## Project Overview

This is the **RdLn™ Document Comparison Tool**, a professional-grade application for comparing documents with advanced features like OCR (Optical Character Recognition) and a modern glassmorphism UI. It's built using React, TypeScript, and Vite.

### Repo Primer (Read First)
- Source of truth: `AGENTS.md` (architecture, flows, Definition of Done). Follow `docs/DevRules/Agent_Rules.md` and `docs/DevRules/DEVELOPMENT_GUIDELINES.md`.
- Platform status: Tauri builds are on hold — do not run `npm run tauri:*`. Use Electron for desktop (`npm run electron:dev`, `npm run electron:build:win`). Prefer Windows-native commands.

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

## Development Rules and Guidelines

For all development work, please refer to the following documents:
- `docs/DevRules/Agent_Rules.md` - Contains specific rules for agent behavior and development practices
- `docs/DevRules/DEVELOPMENT_GUIDELINES.md` - Contains universal development guidelines and safety protocols

## Development Rules and Guidelines

As part of development, the following rules and guidelines must be followed:

### Agent Rules (docs/DevRules/Agent_Rules.md)

1. **Don't be lazy** - Always put in full effort
2. **Follow Development Guidelines** - Read and apply DEVELOPMENT_GUIDELINES.md at start of session
3. **CSS Protocol** - Follow systematic CSS debugging to avoid deadends:
   - Inspect first, code second
   - Identify the real problem
   - Verify selector targeting
   - Use systematic debugging approach
4. **Ignore .ignore files** - Except for git syncing purposes
5. **Documentation naming** - Use YYYYMMDD_[Type]_Doc Name convention
6. **Investigation protocol** - Thoroughly trace code flows before coding
7. **Single Sprint Documentation** - Maintain one central planning document per sprint
8. **Documentation location** - Save docs under /Docs folder hierarchy
9. **No development server** - Don't start dev server in chat
10. **Collaborative problem-solving** - Follow systematic investigation approach
11. **SSMR methodology** - 100% Safely, Step-by-step, Modular and Reversible

### Development Guidelines (docs/DevRules/DEVELOPMENT_GUIDELINES.md)

1. **Prime Directive** - First, do no harm. Second, fix the specific issue.
2. **Core Principles** - Preserve working functionality, incremental over revolutionary
3. **Pre-Change Protocol** - Impact assessment checklist before any modification
4. **The "One Thing" Rule** - Do one thing, test it, report results, wait for permission
5. **Change Hierarchy** - Configuration only → Minimal edits → Function changes → Module changes → Architecture changes
6. **Anti-Patterns** - Avoid helpful refactors, assumptions, style fixes, and scope creep
7. **Testing Protocol** - Syntax valid → Unit works → Integration works → No regressions → User flow works
8. **Error Recovery** - STOP, CAPTURE, LOCATE, MINIMAL FIX, VERIFY, CHECK
9. **Communication Standards** - Clear status updates and risk communication
10. **Project-Specific Rules** - Never modify core algorithm files without explicit approval
11. **Emergency Protocol** - Admit errors, document changes, provide rollback instructions
12. **Changelog Guidelines** - Document all changes with references
13. **OCR-Specific Guidelines** - Test with actual images and verify performance
