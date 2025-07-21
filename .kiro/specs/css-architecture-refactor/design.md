# Design Document

## Overview

The CSS Architecture Refactor will transform the current fragmented theme system into a clean, TypeScript-driven architecture. The design centers around eliminating all theme-specific CSS from glassmorphism.css and relying on the authoritative TypeScript theme definitions in `src/themes/definitions/` as the single source of truth. This eliminates cascade conflicts, removes the need for `!important` declarations, and provides a maintainable system where themes are defined once in TypeScript and CSS is generated or applied via CSS variables.

## Architecture

### Current State Analysis

**Problems Identified:**
- Theme styles scattered across 3+ locations per theme
- Excessive `!important` declarations causing cascade conflicts
- glassmorphism.css contains 1000+ lines with theme-specific overrides
- Multiple failed fix attempts cluttering the codebase
- Inconsistent hover effect implementations across themes
- No clear pattern for theme development

**File Structure Issues:**
```
src/themes/definitions/     # TypeScript theme configs
src/styles/themes/         # Some theme CSS files
src/styles/glassmorphism.css # Mixed base + theme overrides
src/styles/                # Multiple failed fix attempts
```

### Target Architecture

**TypeScript-Driven Theme System:**
```
src/themes/definitions/         # SINGLE SOURCE OF TRUTH
├── professional.ts            # Complete theme definition with semanticColors
├── kyoto.ts                  # Complete theme definition with semanticColors
├── bamboo.ts                 # Complete theme definition with semanticColors
├── classic-dark.ts           # Complete theme definition with semanticColors
├── classic-light.ts          # Complete theme definition with semanticColors
├── new-york.ts               # Complete theme definition with semanticColors
├── aurora-borealis.ts        # Complete theme definition with semanticColors
├── deep-dive.ts              # Complete theme definition with semanticColors
└── neon-night.ts             # Complete theme definition with semanticColors

src/themes/utils/
├── cssVariables.ts           # Generates CSS variables from TypeScript
├── colors.ts                 # Color utility functions
└── validation.ts             # Theme validation utilities

src/styles/
├── glassmorphism.css         # Base effects only, uses CSS variables
└── themes/                   # Generated or minimal CSS files
    └── themes.css            # Imports any necessary theme CSS
```

## Components and Interfaces

### Base Glassmorphism System

**glassmorphism.css Structure:**
```css
/* 1. CSS Variables - Opacity levels only */
:root {
  --glass-subtle: 0.05;
  --glass-panel: 0.12;
  --glass-focus: 0.20;
  --glass-strong: 0.35;
}

/* 2. Base Classes - Theme-agnostic */
.glass-panel { /* Base glassmorphism without colors */ }
.glass-input-field { /* Base input styling */ }
.glass-content-panel { /* Base content panel */ }

/* 3. Interaction States - Using CSS variables */
.glass-panel:hover { /* Uses theme CSS variables */ }
.glass-panel.hover-from-handle { /* Uses theme CSS variables */ }

/* 4. Utility Classes */
.glass-effect { /* Backdrop filter utilities */ }
```

### Theme CSS Structure

**Each theme file (e.g., kyoto.css):**
```css
/* 1. Theme CSS Variables */
[data-theme="kyoto"] {
  --theme-glass-panel-bg: 28, 25, 23;
  --theme-glass-panel-border: 120, 113, 108;
  --theme-glass-panel-shadow: 220, 8, 8;
  --theme-glass-hover-bg: 28, 25, 23;
  --theme-glass-hover-border: 220, 8, 8;
  --theme-glass-hover-shadow: 220, 8, 8;
}

/* 2. Base Panel Styles */
[data-theme="kyoto"] .glass-panel {
  background: rgba(var(--theme-glass-panel-bg), var(--glass-panel));
  border: 1px solid rgba(var(--theme-glass-panel-border), var(--glass-focus));
  box-shadow: 0 8px 32px 0 rgba(var(--theme-glass-panel-shadow), var(--glass-strong));
}

/* 3. Hover Effects */
[data-theme="kyoto"] .glass-panel:hover {
  background: rgba(var(--theme-glass-hover-bg), var(--glass-focus));
  border-color: rgba(var(--theme-glass-hover-border), 0.6);
  box-shadow: 0 30px 80px 0 rgba(var(--theme-glass-hover-shadow), 0.7);
  transform: translateY(-2px);
}

/* 4. Text Hierarchy */
[data-theme="kyoto"] .text-body { /* Theme text colors */ }

/* 5. Input Fields */
[data-theme="kyoto"] .glass-input-field { /* Theme input styling */ }
```

### CSS Variable System

**Semantic Color Variables:**
```css
/* RGB values for flexible opacity usage */
--theme-glass-panel-bg: r, g, b;
--theme-glass-panel-border: r, g, b;
--theme-glass-panel-shadow: r, g, b;
--theme-glass-hover-bg: r, g, b;
--theme-glass-hover-border: r, g, b;
--theme-glass-hover-shadow: r, g, b;

/* Text colors */
--theme-text-primary: #color;
--theme-text-secondary: #color;
--theme-text-interactive: #color;
```

## Data Models

### Theme Configuration Interface

```typescript
interface ThemeColors {
  glassPanelBg: [number, number, number];
  glassPanelBorder: [number, number, number];
  glassPanelShadow: [number, number, number];
  glassHoverBg: [number, number, number];
  glassHoverBorder: [number, number, number];
  glassHoverShadow: [number, number, number];
  textPrimary: string;
  textSecondary: string;
  textInteractive: string;
}

interface ThemeDefinition {
  name: string;
  colors: ThemeColors;
  cssFile: string;
  validated: boolean;
}
```

### CSS Rule Structure

```typescript
interface CSSRule {
  selector: string;
  properties: Record<string, string>;
  specificity: number;
  hasImportant: boolean;
  theme?: string;
}

interface ThemeValidation {
  themeName: string;
  requiredSelectors: string[];
  missingSelectors: string[];
  hasImportantDeclarations: boolean;
  isValid: boolean;
}
```

## Error Handling

### CSS Cascade Conflicts

**Prevention Strategy:**
- Use consistent specificity levels across all themes
- Eliminate `!important` declarations through proper cascade design
- Validate CSS specificity during build process

**Fallback Mechanism:**
```css
/* Fallback values in CSS variables */
background: rgba(var(--theme-glass-panel-bg, 255, 255, 255), var(--glass-panel));
```

### Missing Theme Styles

**Detection:**
- Automated validation of required CSS selectors per theme
- Build-time checks for missing theme files
- Runtime fallbacks to base styles

**Recovery:**
```css
/* Base fallback styles when theme is incomplete */
[data-theme] .glass-panel {
  background: rgba(255, 255, 255, var(--glass-panel));
  /* ... other fallback styles */
}
```

### Performance Degradation

**Monitoring:**
- CSS parsing time measurement
- Render performance tracking
- File size optimization

**Optimization:**
- Lazy loading of theme CSS files
- CSS minification and compression
- Removal of unused styles

## Testing Strategy

### Automated Theme Validation

**CSS Structure Tests:**
```javascript
describe('Theme CSS Architecture', () => {
  test('Each theme has required selectors', () => {
    // Validate all themes have complete CSS implementations
  });
  
  test('No !important declarations', () => {
    // Scan all theme files for !important usage
  });
  
  test('Consistent specificity levels', () => {
    // Validate CSS specificity across themes
  });
});
```

### Visual Regression Testing

**Hover Effect Consistency:**
- Screenshot comparison across themes
- Interaction behavior validation
- Animation timing verification

### Performance Testing

**CSS Loading Performance:**
- Measure CSS parsing time per theme
- Validate file size optimization
- Test theme switching performance

### Integration Testing

**Theme System Integration:**
- Test theme switching functionality
- Validate CSS variable propagation
- Ensure glassmorphism effects work across all themes

## Migration Strategy

### Phase 1: Clean Slate
1. Audit current CSS architecture
2. Delete all theme CSS from glassmorphism.css
3. Test impact and identify gaps

### Phase 2: TypeScript-Driven Generation
1. Enhance CSS variable generation system
2. Generate CSS from TypeScript definitions
3. Implement hover effects from semanticColors

### Phase 3: Testing and Validation
1. Test all themes systematically
2. Fix Kyoto theme hover effects specifically
3. Validate CSS architecture compliance

### Phase 4: Cleanup and Optimization
1. Clean up legacy CSS files
2. Update build system and documentation
3. Performance optimization and final validation

## Implementation Considerations

### CSS Specificity Management

**Consistent Specificity Levels:**
```css
/* Level 1: Base styles (0,0,1,0) */
.glass-panel { }

/* Level 2: Theme styles (0,0,2,0) */
[data-theme="kyoto"] .glass-panel { }

/* Level 3: State styles (0,0,2,1) */
[data-theme="kyoto"] .glass-panel:hover { }

/* Level 4: Component-specific (0,0,3,0) */
[data-theme="kyoto"] .glass-panel.glass-content-panel { }
```

### Build System Integration

**CSS Processing Pipeline:**
1. Validate theme CSS files
2. Check for `!important` declarations
3. Optimize and minify CSS
4. Generate theme validation report

### Development Workflow

**New Theme Creation:**
1. Copy template.css to new theme file
2. Update CSS variables with theme colors
3. Customize specific selectors as needed
4. Validate theme completeness
5. Test across all components

This architecture provides a solid foundation for maintainable, scalable theme development while eliminating the current CSS conflicts and maintenance issues.