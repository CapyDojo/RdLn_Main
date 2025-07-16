# Technology Stack

## Core Technologies

- **Frontend Framework**: React 18.3.1 with TypeScript 5.5.3
- **Build Tool**: Vite 5.4.2 with React plugin
- **Styling**: Tailwind CSS 3.4.1 with custom theme system using CSS variables
- **UI Library**: Lucide React for icons, Popper.js for positioning
- **OCR Engine**: Tesseract.js 5.0.4 with multi-language support
- **Image Processing**: Sharp 0.34.2, Canvas 3.1.2
- **Text Processing**: OpenCC.js 1.0.5 for Chinese text conversion

## Testing & Quality

- **Test Framework**: Vitest 3.2.4 with UI and coverage support
- **Testing Library**: React Testing Library 16.3.0 with Jest DOM
- **Linting**: ESLint 9.9.1 with TypeScript ESLint and React plugins
- **Type Checking**: Strict TypeScript configuration with bundler module resolution

## Architecture Patterns

- **Component Architecture**: Modular components with clear separation of concerns
- **Context Providers**: Theme, Layout, Performance, and Experimental feature contexts
- **Custom Hooks**: Reusable logic for OCR, performance monitoring, comparison, and UI interactions
- **Service Layer**: Dedicated services for OCR, performance monitoring, and background processing
- **Algorithm Layer**: Myers algorithm implementation for document comparison

## Common Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Testing
npm run test            # Run all tests in watch mode
npm run test:run        # Run tests once
npm run test:coverage   # Run tests with coverage
npm run test:ui         # Run tests with UI
npm run test:ocr        # Run OCR-specific tests
npm run test:integration # Run integration tests
npm run test:performance # Run performance tests
npm run test:accuracy   # Run accuracy tests

# Code Quality
npm run lint            # Run ESLint
```

## Development Guidelines

- **SSMR Approach**: Safe, Step-by-step, Modular, Reversible changes
- **TypeScript**: Full type safety with strict configuration
- **Performance First**: Optimize for large document handling with chunked rendering
- **Visual Consistency**: Maintain DOM structure parity between components for glassmorphism effects
- **Client-Side Focus**: All processing must remain browser-based for privacy