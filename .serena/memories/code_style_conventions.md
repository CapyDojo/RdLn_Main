# RdLn Code Style & Conventions

## TypeScript Configuration
- **Strict Mode**: Enabled with full type safety
- **Target**: ES2020 with DOM libraries
- **Module**: ESNext with bundler resolution
- **JSX**: React JSX transform
- **Linting**: Strict with no unused locals/parameters

## Code Style Guidelines

### File Naming
- **Components**: PascalCase (e.g., `ComparisonInterface.tsx`)
- **Hooks**: camelCase starting with `use` (e.g., `useComparison.ts`)
- **Services**: PascalCase (e.g., `OCRService.ts`)
- **Types**: camelCase with descriptive suffixes (e.g., `performance-types.ts`)
- **Utils**: camelCase (e.g., `textMetrics.ts`)

### Component Architecture
- **Functional Components**: Use React 18 function components with hooks
- **Props Interface**: Define TypeScript interfaces for all props
- **Error Boundaries**: Wrap components with error handling
- **Ref Architecture**: Use ref-based patterns for DOM manipulation (see RedlineOutput.tsx)

### Import Organization
```typescript
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// 3. Internal components
import { ComparisonInterface } from './components/ComparisonInterface';

// 4. Services and utilities
import { OCRService } from '../services/OCRService';
import { textMetrics } from '../utils/textMetrics';

// 5. Types
import type { OCRResult, PerformanceMetrics } from '../types';
```

### State Management
- **Context Providers**: Use for global state (Theme, Layout, Performance)
- **Custom Hooks**: Extract complex logic into reusable hooks
- **Local State**: Use useState for component-specific state
- **Performance**: Use useCallback/useMemo for optimization

### CSS Architecture
- **CSS Custom Properties**: Dynamic theming with CSS variables
- **Glassmorphism**: Consistent glass-panel effects across themes
- **Modular Styles**: Organized by feature in `src/styles/`
- **Theme System**: 11+ professional themes with TypeScript definitions

### Error Handling
```typescript
// Use proper error boundaries
try {
  const result = await ocrService.process(image);
} catch (error) {
  console.error('OCR processing failed:', error);
  // Graceful degradation
}
```

### Performance Patterns
- **Chunked Processing**: Break large operations into chunks
- **Progressive Rendering**: Stream results for large documents
- **Memory Cleanup**: Proper cleanup of OCR workers and resources
- **Performance Monitoring**: Built-in tracking with PerformanceMonitor

## Architecture Patterns

### SSMR Methodology
All development follows **Safe, Step-by-step, Modular, Reversible** principles:
- **Safe**: Include error handling and graceful degradation
- **Step-by-step**: Incremental changes with feature flags
- **Modular**: Extract reusable, testable components
- **Reversible**: Changes can be easily reverted

### Component Structure
```typescript
interface ComponentProps {
  // Required props
  data: DataType;
  onAction: (result: ResultType) => void;
  
  // Optional props with defaults
  className?: string;
  disabled?: boolean;
}

export const Component: React.FC<ComponentProps> = ({
  data,
  onAction,
  className = '',
  disabled = false
}) => {
  // Component implementation
};
```

### Service Pattern
```typescript
export class ServiceName {
  private readonly config: ConfigType;
  
  constructor(config: ConfigType) {
    this.config = config;
  }
  
  public async operation(input: InputType): Promise<ResultType> {
    // Implementation with error handling
  }
  
  public cleanup(): void {
    // Resource cleanup
  }
}
```

## Testing Conventions
- **Test Files**: Co-located with source files in `__tests__` folders
- **Test Types**: Unit, integration, performance, accuracy, E2E
- **Real OCR Testing**: Use actual images from `tests/images/`
- **Coverage**: 70% global, 90% for critical components