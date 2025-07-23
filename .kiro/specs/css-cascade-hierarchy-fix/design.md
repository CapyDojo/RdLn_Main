# Design Document

## Overview

This design addresses the CSS cascade hierarchy issues in the Kyoto theme by implementing a systematic approach to CSS specificity that eliminates the need for `!important` declarations while ensuring theme-specific styles properly override base styles. The solution establishes a clean, maintainable CSS architecture that serves as a blueprint for other themes.

The core issue is that base styles in `glassmorphism.css` are overriding theme-specific styles in `kyoto.css` due to insufficient CSS specificity. This design implements a hierarchical specificity strategy that resolves these conflicts through natural CSS cascade enhancement.

## Architecture

### CSS Specificity Hierarchy Strategy

The design implements a three-tier CSS specificity hierarchy:

1. **Base Layer** (Lowest Specificity): `glassmorphism.css` - Generic glass panel styles
2. **Theme Layer** (Medium Specificity): `kyoto.css` - Theme-specific overrides with `html[data-theme="kyoto"]` prefix
3. **Layout Layer** (Highest Specificity): `current-layout.css` - Layout-specific and interaction-specific styles

### Specificity Enhancement Patterns

#### Pattern 1: Theme Selector Enhancement
```css
/* Base (specificity: 0,0,1,0) */
.glass-panel { background: rgba(255, 255, 255, var(--glass-panel)); }

/* Theme Override (specificity: 0,1,1,1) */
html[data-theme="kyoto"] .glass-panel { background: rgba(28, 25, 23, var(--glass-panel)); }
```

#### Pattern 2: Component Context Enhancement
```css
/* Enhanced specificity for nested components (specificity: 0,1,2,1) */
html[data-theme="kyoto"] .glass-panel .text-body { color: #f8b4b4; }
```

#### Pattern 3: State-Specific Enhancement
```css
/* Hover state specificity (specificity: 0,1,2,1) */
html[data-theme="kyoto"] .glass-panel:hover { /* enhanced styles */ }
```

### CSS Variable Integration Strategy

The design leverages the existing CSS variable system while ensuring theme-specific values take precedence:

```css
/* Base variables (overridden by theme) */
:root {
  --glass-panel: 0.12;
  --glass-focus: 0.20;
}

/* Theme-specific implementation */
html[data-theme="kyoto"] .glass-panel {
  background: rgba(28, 25, 23, var(--glass-panel)); /* Uses theme-specific RGB with base opacity */
}
```

## Components and Interfaces

### 1. Glass Panel Base Styling Component

**Purpose**: Ensure theme-specific glass panel backgrounds override base white backgrounds

**Implementation Strategy**:
- Increase specificity of theme selectors to override `glassmorphism.css` base styles
- Maintain CSS variable usage for opacity consistency
- Remove conflicting `!important` declarations from base styles

**CSS Selector Pattern**:
```css
html[data-theme="kyoto"] .glass-panel,
html[data-theme="kyoto"] .glass-panel.glass-content-panel {
  background: rgba(28, 25, 23, var(--glass-panel));
  border: 1px solid rgba(120, 113, 108, var(--glass-focus));
}
```

### 2. Hover Effects Management Component

**Purpose**: Implement consistent hover effects that work for both direct hover and handle-triggered hover

**Implementation Strategy**:
- Consolidate multiple hover rules into single, high-specificity selectors
- Ensure handle-triggered hover (`.hover-from-handle` class) has sufficient specificity
- Implement layered shadow effects for dramatic visual impact

**CSS Selector Patterns**:
```css
/* Direct hover */
html[data-theme="kyoto"] .glass-panel:hover,
html[data-theme="kyoto"] .glass-panel.glass-content-panel:hover {
  background: rgba(28, 25, 23, var(--glass-focus));
  border-color: rgba(220, 8, 8, 0.6);
  box-shadow: 0 24px 64px 0 rgba(220, 8, 8, 0.6), 0 10px 36px 0 rgba(220, 8, 8, 0.4);
  transform: translateY(-2px);
}

/* Handle-triggered hover */
html[data-theme="kyoto"] .glass-panel.hover-from-handle,
html[data-theme="kyoto"] .glass-panel.force-hover {
  /* Same styles as direct hover */
}
```

### 3. Text Hierarchy Component

**Purpose**: Ensure theme-specific text colors override base and component styles

**Implementation Strategy**:
- Create comprehensive selector chains that target all text contexts
- Use multiple selector combinations to ensure coverage
- Maintain semantic color mapping from TypeScript definitions

**CSS Selector Pattern**:
```css
html[data-theme="kyoto"] .text-body,
html[data-theme="kyoto"] .glass-panel .text-body,
html[data-theme="kyoto"] textarea.glass-input-field,
html[data-theme="kyoto"] .glass-panel textarea,
html[data-theme="kyoto"] .glass-panel input {
  color: #f8b4b4; /* Maps to semanticColors.textBody */
}
```

### 4. Layout Integration Component

**Purpose**: Handle layout-specific hover effects and handle interactions

**Implementation Strategy**:
- Implement theme-specific rules in `current-layout.css` with highest specificity
- Target specific layout contexts (input panels, output panels, resize handles)
- Ensure consistent behavior across different panel types

**CSS Selector Pattern**:
```css
[data-theme="kyoto"] .layout-current .hover-from-handle,
[data-theme="kyoto"] .layout-current .hover-from-handle-primary {
  background: rgba(28, 25, 23, var(--glass-focus));
  border-color: rgba(220, 8, 8, 0.8);
  box-shadow: 0 28px 72px 0 rgba(220, 8, 8, 0.8), 0 14px 40px 0 rgba(220, 8, 8, 0.6);
}
```

### 5. Selector Complexity Optimization Component

**Purpose**: Reduce CSS selector complexity while maintaining sufficient specificity to override base styles

**Implementation Strategy**:
- Implement CSS custom properties at theme level to centralize color values
- Use simplified selectors with theme-scoped variables
- Reduce selector chain length while preserving override capability

**Optimized CSS Pattern**:
```css
/* Theme-scoped variables - set once at theme level */
html[data-theme="kyoto"] {
  --theme-glass-bg: 28, 25, 23;
  --theme-glass-border: 120, 113, 108;
  --theme-glass-hover-border: 220, 8, 8;
  --theme-glass-hover-shadow: 220, 8, 8;
  --theme-text-body: #f8b4b4;
  --theme-text-header: #86efac;
}

/* Simplified selectors using theme variables */
html[data-theme="kyoto"] .glass-panel {
  background: rgba(var(--theme-glass-bg), var(--glass-panel));
  border-color: rgba(var(--theme-glass-border), var(--glass-focus));
}

html[data-theme="kyoto"] .glass-panel:hover {
  border-color: rgba(var(--theme-glass-hover-border), 0.6);
  box-shadow: 0 24px 64px 0 rgba(var(--theme-glass-hover-shadow), 0.6);
}

html[data-theme="kyoto"] .text-body {
  color: var(--theme-text-body);
}
```

**Benefits**:
- Reduces average selector specificity from 0,1,2,1 to 0,1,1,1
- Centralizes color management for easier maintenance
- Improves CSS readability and reduces file size
- Maintains sufficient specificity to override base styles
- Creates consistent pattern for blueprint application

## Data Models

### CSS Specificity Calculation Model

The design uses a systematic approach to CSS specificity calculation with optimization for maintainability:

```
Specificity Format: (inline, IDs, classes/attributes/pseudo-classes, elements)

Base Styles:        (0, 0, 1, 0) - .glass-panel
Theme Styles:       (0, 1, 1, 1) - html[data-theme="kyoto"] .glass-panel  
Layout Styles:      (0, 1, 2, 1) - [data-theme="kyoto"] .layout-current .hover-from-handle

Optimized Theme:    (0, 1, 1, 1) - html[data-theme="kyoto"] .glass-panel (using CSS variables)
```

**Optimization Strategy**: Use CSS custom properties to reduce selector complexity while maintaining override capability.

### Color Mapping Model

The design maintains consistency between TypeScript theme definitions and CSS implementations:

```typescript
// TypeScript Definition (Source of Truth)
semanticColors: {
  glassPanelBg: '#1c1917',
  glassPanelHoverBorder: '#dc0808',
  glassPanelHoverShadow: '#dc0808',
}

// CSS Implementation (Derived)
html[data-theme="kyoto"] .glass-panel {
  background: rgba(28, 25, 23, var(--glass-panel)); // #1c1917 with opacity
}

html[data-theme="kyoto"] .glass-panel:hover {
  border-color: rgba(220, 8, 8, 0.6); // #dc0808 with opacity
}
```

### Cascade Resolution Model

The design implements a systematic cascade resolution approach:

1. **Conflict Detection**: Identify where base styles override theme styles
2. **Specificity Analysis**: Calculate current specificity levels
3. **Enhancement Strategy**: Determine minimum specificity increase needed
4. **Implementation**: Apply enhanced selectors with natural hierarchy
5. **Validation**: Test that theme styles properly override base styles

## Error Handling

### CSS Cascade Conflict Resolution

**Issue**: Base styles overriding theme styles
**Solution**: Implement systematic specificity enhancement
**Fallback**: Multiple selector variations to ensure coverage

```css
/* Primary selector */
html[data-theme="kyoto"] .glass-panel:hover { /* styles */ }

/* Fallback selectors for edge cases */
html[data-theme="kyoto"] .glass-panel.glass-content-panel:hover { /* same styles */ }
html[data-theme="kyoto"] [data-input-panel] .glass-panel:hover { /* same styles */ }
```

### Browser Compatibility Handling

**Issue**: Different browsers may handle CSS specificity differently
**Solution**: Use multiple selector approaches and test across browsers
**Fallback**: Provide alternative selector patterns for maximum compatibility

### Theme Switching Edge Cases

**Issue**: CSS transitions between themes may cause visual glitches
**Solution**: Ensure consistent CSS variable usage and transition properties
**Fallback**: Implement CSS transition delays to prevent flashing

## Testing Strategy

### Automated Testing Approach

1. **CSS Specificity Validation**: Automated tests to verify theme styles override base styles
2. **Visual Regression Testing**: Compare rendered output before and after changes
3. **Interaction Testing**: Verify hover effects work for both direct and handle hover
4. **Performance Testing**: Ensure CSS changes don't impact rendering performance

### Manual Testing Protocol

1. **Theme Switching Test**: Verify all functionality works when switching to/from Kyoto theme
2. **Hover Effect Test**: Test both direct panel hover and handle-triggered hover
3. **Text Hierarchy Test**: Verify all text elements display correct colors
4. **Glass Panel Test**: Confirm panels show dark theme colors, not white backgrounds

### Test Script Integration

The design includes integration with existing test scripts:

```javascript
// Enhanced test script validation
const testKyotoHierarchy = () => {
  // Test 1: Base styling override
  const panel = document.querySelector('.glass-panel');
  const computedStyle = getComputedStyle(panel);
  const bgColor = computedStyle.backgroundColor;
  
  // Should be dark theme color, not white
  const isDarkTheme = !bgColor.includes('255, 255, 255');
  console.log('Dark theme background:', isDarkTheme ? '✅' : '❌');
  
  // Test 2: Hover effect specificity
  panel.dispatchEvent(new MouseEvent('mouseenter'));
  const hoverStyle = getComputedStyle(panel);
  const hasStrongShadow = hoverStyle.boxShadow.includes('64px');
  console.log('Strong hover shadow:', hasStrongShadow ? '✅' : '❌');
};
```

### Blueprint Validation Testing

The design includes specific tests to validate the blueprint pattern:

1. **Consistency Test**: Verify all CSS patterns follow the established hierarchy
2. **Reusability Test**: Confirm the pattern can be applied to other themes
3. **Maintainability Test**: Ensure the CSS structure is clean and readable
4. **Performance Test**: Validate that the specificity approach doesn't impact performance

## Implementation Phases

### Phase 1: Base Style Cleanup
- Remove conflicting `!important` declarations from `glassmorphism.css`
- Identify specific selectors that need specificity enhancement
- Create backup of current working state

### Phase 2: Theme Specificity Enhancement
- Implement enhanced selectors in `kyoto.css`
- Add comprehensive text hierarchy selectors
- Consolidate hover effect rules

### Phase 3: Layout Integration
- Update `current-layout.css` with theme-specific hover rules
- Ensure handle-triggered hover effects work correctly
- Test output panel handle hover specifically

### Phase 4: Validation and Documentation
- Run comprehensive test suite
- Document the blueprint pattern
- Create application guide for other themes

This design provides a systematic, maintainable solution to the CSS cascade hierarchy issues while establishing a clean blueprint pattern for future theme development.