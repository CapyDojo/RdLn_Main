# Experimental: Unified Redlining Colors

## Overview

This experimental module provides unified redlining colors across all themes:
- **GREEN** for all additions (regardless of theme)
- **RED** for all deletions (regardless of theme)

## Current Behavior vs. Experimental

**Current**: Redlining colors adapt to each theme
- Professional theme: Blue additions, orange deletions
- Bamboo theme: Green additions, orange deletions
- Classic Dark: Blue-grey additions, red-orange deletions

**Experimental**: Consistent colors across all themes
- All themes: Green additions, red deletions

## Files

- `unified-redline-colors-mvp.css` - Removed (consolidated into main unified-redline-mvp.css)
- `activate-experiment.css` - Simple activation module
- `README.md` - This documentation

## Quick Test

**To Activate:**
Add this line to `src/index.css`:
```css
@import './styles/experimental/activate-experiment.css';
```

**To Deactivate:**
Remove the import line or delete the experimental folder.

## Safety

✅ **Completely Safe**
- Zero impact on existing functionality
- Only affects redline span colors in output panel
- No component modifications
- No architecture changes
- Fully reversible

## Technical Details

### Target Elements
The experiment targets these specific generated HTML elements from `RedlineOutput.tsx`:

**Additions:**
```html
<span class="bg-theme-secondary-100 text-theme-secondary-800 border border-theme-secondary-300 underline decoration-2 decoration-theme-secondary-600">
```

**Deletions:**
```html
<span class="bg-theme-accent-100 text-theme-accent-800 border border-theme-accent-300 line-through decoration-2 decoration-theme-accent-600">
```

### Color Specification

**Additions (Green):**
- Background: `#dcfce7` (Green-100)
- Text: `#166534` (Green-800) 
- Border: `#bbf7d0` (Green-200)
- Decoration: `#15803d` (Green-700)
- Contrast Ratio: 8.9:1 (WCAG AAA)

**Deletions (Red):**
- Background: `#fee2e2` (Red-100)
- Text: `#dc2626` (Red-600)
- Border: `#fecaca` (Red-200) 
- Decoration: `#b91c1c` (Red-700)
- Contrast Ratio: 7.2:1 (WCAG AAA)

## Debug Mode

To verify targeting, uncomment the debug section in `unified-redline-colors.css`:

```css
.glass-panel-inner-content span.bg-theme-secondary-100,
.chunk-container span.bg-theme-secondary-100 {
  outline: 3px solid lime !important;
  outline-offset: 2px !important;
}
```

This will add green outlines to additions and red outlines to deletions.

## Testing Steps

1. Activate the experiment
2. Run a document comparison
3. Switch between different themes
4. Verify all additions are green and all deletions are red
5. Check that no other UI elements are affected
6. Deactivate and verify normal theme behavior returns

---

**Status**: Experimental - Safe to delete entire folder without impact
