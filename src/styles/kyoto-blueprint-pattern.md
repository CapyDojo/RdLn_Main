# Kyoto Theme Blueprint Pattern

This document outlines the clean CSS architecture pattern extracted from the Kyoto theme to serve as a blueprint for other themes.

## File Structure

### 1. Theme Definition (TypeScript)
**Location**: `src/themes/definitions/kyoto.ts`
- Complete semantic color mappings
- Hover effect definitions (`glassPanelHoverBorder`, `glassPanelHoverShadow`)
- Consistent color palette with clear hierarchy

### 2. Theme CSS File
**Location**: `src/styles/themes/kyoto.css`
- Base glass panel styling
- Text hierarchy (body, headers, secondary, interactive, success)
- Footer text harmonization
- Glass panel hover effects (consolidated)
- Programmatic hover states
- Component-specific styling (segmented controls)

### 3. Layout Integration
**Location**: `src/styles/layouts/current-layout.css`
- Theme-specific hover-from-handle rules
- Output panel handle hover rules
- Consistent with other theme patterns

## CSS Architecture Principles

### 1. Clean Hierarchy (No !important)
```css
/* GOOD: Clean specificity hierarchy */
html[data-theme="kyoto"] .glass-panel {
  background: rgba(28, 25, 23, var(--glass-panel));
}

/* AVOID: !important declarations */
html[data-theme="kyoto"] .glass-panel {
  background: rgba(28, 25, 23, var(--glass-panel)) !important;
}
```

### 2. Consolidated Rules
```css
/* GOOD: Single consolidated hover rule */
html[data-theme="kyoto"] .glass-panel:hover,
html[data-theme="kyoto"] .glass-panel.glass-content-panel:hover {
  background: rgba(28, 25, 23, var(--glass-focus));
  border-color: rgba(220, 8, 8, 0.6);
  box-shadow: 0 24px 64px 0 rgba(220, 8, 8, 0.6), 0 10px 36px 0 rgba(220, 8, 8, 0.4);
  transform: translateY(-2px);
}

/* AVOID: Multiple redundant rules */
html[data-theme="kyoto"] .glass-panel:hover { /* styles */ }
html[data-theme="kyoto"] .glass-panel.glass-content-panel:hover { /* duplicate styles */ }
```

### 3. Semantic Color Usage
```css
/* GOOD: Use semantic colors from TypeScript definition */
html[data-theme="kyoto"] .text-body {
  color: #f8b4b4; /* Maps to semanticColors.textBody */
}

html[data-theme="kyoto"] .text-header {
  color: #86efac; /* Maps to semanticColors.textHeader */
}
```

## Blueprint Application Process

### Step 1: TypeScript Definition
1. Copy `kyoto.ts` structure
2. Update color palettes (primary, secondary, accent, neutral)
3. Map semantic colors to theme-appropriate values
4. Define hover effect colors

### Step 2: Theme CSS File
1. Copy `kyoto.css` structure
2. Replace color values with new theme colors
3. Maintain same CSS selectors and hierarchy
4. Keep same hover effect patterns

### Step 3: Layout Integration
1. Copy Kyoto hover rules from `current-layout.css`
2. Replace color values with new theme colors
3. Maintain same specificity levels
4. Test hover-from-handle functionality

## Key Color Mappings

### Kyoto Theme Colors (Reference)
- **Glass Panel Background**: `rgba(28, 25, 23, var(--glass-panel))` (Dark stone)
- **Glass Panel Border**: `rgba(120, 113, 108, var(--glass-focus))` (Stone neutral)
- **Glass Panel Shadow**: `rgba(220, 8, 8, var(--glass-strong))` (Deep maple red)
- **Hover Border**: `rgba(220, 8, 8, 0.6)` (Maple red with opacity)
- **Hover Shadow**: `rgba(220, 8, 8, 0.6/0.4)` (Layered maple red shadows)

### Text Hierarchy Colors
- **Body Text**: `#f8b4b4` (Peach for user-generated text)
- **Headers**: `#86efac` (Vibrant green)
- **Secondary**: `#fef7e6` (Tatami wheat off-white)
- **Interactive**: `#f8b4b4` (Light maple red)
- **Success**: `#bbf7d0` (Light forest green)

## Testing Checklist

### Visual Tests
- [ ] Base glass panel styling renders correctly
- [ ] Text hierarchy shows proper colors and contrast
- [ ] Direct hover effects work on panels
- [ ] Handle hover effects work (hover-from-handle class)
- [ ] All interactive elements have proper colors

### Functional Tests
- [ ] Theme switching works without visual glitches
- [ ] Hover effects don't conflict with other themes
- [ ] No console errors related to CSS
- [ ] Performance is maintained (no CSS cascade issues)

## Success Metrics

- ✅ **No !important declarations** in theme CSS
- ✅ **Consolidated hover rules** (no redundancy)
- ✅ **Clean CSS hierarchy** with proper specificity
- ✅ **Consistent hover behavior** across all panels
- ✅ **Semantic color mapping** from TypeScript to CSS
- ✅ **Blueprint-ready structure** for other themes

## Files Archived

Legacy fix files moved to `src/styles/archive/`:
- `clean-kyoto-hierarchy*.css`
- `kyoto-hover-fix-v*.css`
- `glassmorphism.css.backup*`
- `nuclear-fix.js`

## Next Steps

1. Apply this blueprint pattern to Professional theme
2. Test Professional theme thoroughly
3. Repeat for remaining themes (Bamboo, Apple Dark, etc.)
4. Validate all themes follow consistent architecture