# RdLn Architecture Overview

## Core Architecture

### Application Structure
RdLn follows a modular, performance-first architecture built on React 18 + TypeScript + Vite:

```
App.tsx (Root)
├── Context Providers (Theme, Layout, Performance, FontSize)
├── ComparisonInterface.tsx (Main Orchestrator)
│   ├── DesktopInputLayout / MobileInputLayout
│   ├── ProcessingDisplay
│   └── OutputLayout (with RedlineOutput)
└── Experimental Features (Feature-flagged)
```

### Key Architectural Patterns

#### SSMR Methodology
All development follows **Safe, Step-by-step, Modular, Reversible** principles:
- **Safe**: Error boundaries, graceful degradation, cleanup mechanisms
- **Step-by-step**: Incremental changes with feature flags for rollback
- **Modular**: Components extracted into reusable, testable pieces
- **Reversible**: All changes can be easily reverted without breaking dependencies

#### Context-Based State Management
```typescript
// Global state through React contexts
- ThemeContext: CSS variable injection, theme management
- LayoutContext: Responsive breakpoints, mobile/desktop state
- PerformanceContext: Metrics collection, monitoring
- FontSizeContext: Dynamic typography scaling
- ExperimentalLayoutContext: Feature flags
```

#### Service Layer Architecture
```typescript
// Business logic abstracted into services
- OCRService: Tesseract.js coordination, multi-language support
- OCROrchestrator: Complex workflow management, progress tracking
- LanguageDetectionService: Automatic language detection
- PerformanceMonitor: System metrics, memory usage tracking
- MyersAlgorithm: Core document comparison engine
```

## Component Architecture

### Input Layer
- **DesktopInputLayout**: Side-by-side panels with shared resize handle
- **MobileInputLayout**: Vertical stacking with mobile-optimized controls
- **TextInputPanel**: Input areas with OCR integration and drag-drop support

### Processing Layer
- **ProcessingDisplay**: Progress indicators, cancellation controls
- **OCROrchestrator**: Worker management, multi-language coordination
- **Performance Monitoring**: Real-time metrics, system protection

### Output Layer
- **OutputLayout**: Results container with resize handling
- **RedlineOutput**: Chunked rendering with ref-based scroll synchronization
- **ComparisonStats**: Metrics display (additions, deletions, matches)

## Performance Architecture

### Chunked Processing
- **Large Document Handling**: Documents processed in chunks to prevent browser crashes
- **Progressive Rendering**: Results streamed progressively for 500k+ character documents
- **Memory Management**: Automatic cleanup of resources and workers

### OCR Performance
```typescript
// Multi-threaded OCR with progress tracking
OCRService -> Workers -> Progress Events -> UI Updates
           -> Language Detection -> Optimization -> Results
           -> Cancellation Support -> Cleanup
```

### UI Performance
- **Virtual Scrolling**: For large comparison results
- **CSS Custom Properties**: Dynamic theming without re-renders
- **Glassmorphism Optimization**: Efficient backdrop filter usage
- **Resize Synchronization**: Ref-based coordination between panels

## Theme Architecture

### CSS Custom Properties System
```css
/* Dynamic theme switching through CSS variables */
:root {
  --primary-color: theme-specific-value;
  --glass-bg: rgba(theme-colors);
  --backdrop-filter: blur(theme-blur);
}
```

### Theme Definitions
- **11+ Professional Themes**: Bamboo, Professional, Aurora Borealis, etc.
- **TypeScript Definitions**: Type-safe theme configuration
- **Glassmorphism Effects**: Consistent glass-panel aesthetics

## Data Flow Architecture

### Document Comparison Flow
```
Text Input -> Myers Algorithm -> Chunked Processing -> Progressive Rendering -> RedlineOutput
```

### OCR Processing Flow
```
Image Upload -> Language Detection -> Tesseract Processing -> Text Cleanup -> Comparison Ready
```

### State Synchronization
```
User Input -> Context Updates -> Component Re-renders -> DOM Updates -> Event Handlers
```

## Testing Architecture

### Multi-Layer Testing
- **Unit Tests**: Component isolation with React Testing Library
- **Integration Tests**: OCR workflows with real images
- **Performance Tests**: Benchmarking with large documents
- **Accuracy Tests**: OCR quality validation
- **E2E Tests**: Playwright for complete user workflows

### Test Organization
```
tests/
├── images/          # Real OCR test fixtures
├── performance/     # Benchmarking suites
├── accuracy/        # OCR validation tests
└── rendering/       # UI rendering tests
```

## Security & Privacy Architecture

### Client-Side Processing
- **No Server Uploads**: All processing occurs in browser
- **Local Storage Only**: No external data transmission
- **Worker Isolation**: OCR processing in separate threads
- **Memory Cleanup**: Automatic cleanup of sensitive data

## Build Architecture

### Multi-Platform Support
- **Web**: Vite build for Netlify deployment
- **Electron**: Desktop app with native file system access
- **Tauri**: Rust-based desktop app for better performance
- **Asset Management**: Automated download of fonts and OCR training data

### Development Architecture
- **Hot Module Replacement**: Vite HMR on localhost:5173
- **TypeScript Strict Mode**: Full type safety
- **ESLint**: Code quality enforcement
- **Feature Flags**: Experimental features in `src/components/experimental/`