# RdLn™ Project Overview

## Project Purpose
RdLn™ is a professional-grade document comparison tool designed for legal professionals and organizations requiring precise document analysis. It features:

- **Document Comparison**: Myers algorithm-based diff engine optimized for legal documents
- **OCR Integration**: Multi-language optical character recognition with 50+ language support
- **Client-Side Processing**: Complete confidentiality with no server uploads
- **Performance Optimized**: Chunked rendering for large documents (500k+ characters)
- **Modern UI**: Glassmorphism interface with 11+ professional themes

## Tech Stack

### Core Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: CSS Custom Properties + Tailwind CSS + Glassmorphism effects
- **Testing**: Vitest + React Testing Library + Playwright (E2E)
- **Build**: Vite with HMR on localhost:5173

### Cross-Platform Support
- **Web**: Standard web deployment (Netlify)
- **Desktop**: Electron (Windows/Mac/Linux) and Tauri
- **OCR**: Tesseract.js with WebAssembly

### Key Dependencies
- **React 18.3.1** with TypeScript 5.5.3
- **Tesseract.js 5.0.4** for OCR functionality
- **FontAwesome + Lucide React** for icons
- **JSZip** for file handling
- **Sharp** for image processing

## Project Structure
```
src/
├── algorithms/        # Myers Algorithm (core comparison engine)
├── components/        # React components + experimental features
├── contexts/          # React context providers (Theme, Layout, Performance)
├── hooks/            # Custom React hooks
├── services/         # Business logic (OCR, Performance, Language Detection)
├── styles/           # CSS themes + glassmorphism effects
├── themes/           # Theme definitions and utilities
├── types/            # TypeScript definitions
└── utils/            # Helper functions

docs/                 # Comprehensive documentation
tests/                # Testing infrastructure with real OCR images
public/tessdata/      # OCR training data (50+ languages)
```

## Current Status
- **Version**: 0.5.15
- **Branch**: Beta_v.0.5.0_Sprint
- **Architecture**: SSMR methodology (Safe, Step-by-step, Modular, Reversible)
- **Build Status**: Production-ready with cross-platform support