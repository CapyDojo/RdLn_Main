# Theme Color Quick Reference Guide

**Theme Example**: Lothlórien  
**Last Updated**: July 2025

## 🎨 Component Color Locations

| Component | Color Property | File Location | Property Path | Current Value |
|-----------|---------------|---------------|---------------|---------------|
| **Primary Buttons** | Background | `src/themes/definitions/lothlorien.ts` | `colors.primary.500` | `#22c55e` |
| **Secondary Buttons** | Background | `src/themes/definitions/lothlorien.ts` | `colors.secondary.500` | `#10b981` |
| **Accent Buttons** | Background | `src/themes/definitions/lothlorien.ts` | `colors.accent.500` | `#f59e0b` |
| **Body Text** | Color | `src/styles/themes/lothlorien.css` | `--theme-text-body` | `#d1fae5` |
| **Headers (h1, h2, h3)** | Color | `src/styles/themes/lothlorien.css` | `--theme-text-header` | `#004915` |
| **Links & Interactive** | Color | `src/styles/themes/lothlorien.css` | `--theme-text-interactive` | `#0ea5e9` |
| **Success States** | Color | `src/styles/themes/lothlorien.css` | `--theme-text-success` | `#4ade80` |
| **Glass Panels** | Background | `src/styles/themes/lothlorien.css` | `--theme-glass-bg` | `15, 32, 39` |
| **Glass Panel Borders** | Border | `src/styles/themes/lothlorien.css` | `--theme-glass-border` | `34, 85, 48` |
| **Glass Panel Hover** | Border | `src/styles/themes/lothlorien.css` | `--theme-glass-hover-border` | `34, 197, 94` |
| **Segmented Controls** | Background | `src/styles/themes/lothlorien.css` | `--theme-segmented-control-bg` | `34, 197, 94` |
| **Segmented Control Text** | Unselected Text | `src/index.css` | `.segmented-control .segment color` | `rgb(var(--color-neutral-600, 75 85 99))` |
| **Segmented Control Text** | Selected Text | `src/index.css` | `.segmented-control .segment.active color` | `rgb(var(--color-primary-800, 30 64 175))` |
| **Font Size "Aa" Text** | Normal State | `src/index.css` | `.segmented-control .segment color` | `rgb(var(--color-neutral-600, 75 85 99))` |
| **Font Size "Aa" Text** | Active State | `src/index.css` | `.segmented-control .segment.active color` | `rgb(var(--color-primary-800, 30 64 175))` |
| **Theme Selector Palette** | Icon Color | `src/index.css` | `.segmented-control .segment color` | `rgb(var(--color-neutral-600, 75 85 99))` |
| **OCR Language Modal** | Header Text | `src/styles/themes/lothlorien.css` | `--theme-text-header` | `#004915` |
| **OCR Language Modal** | Body Text | `src/styles/themes/lothlorien.css` | `--theme-text-body` | `#d1fae5` |
| **OCR Language Modal** | Background | `src/styles/themes/lothlorien.css` | `--theme-glass-bg` | `15, 32, 39` |
| **OCR Checkboxes** | Selected State | `src/themes/definitions/lothlorien.ts` | `colors.accent.500` | `#f59e0b` |
| **OCR Quick Presets** | Button Background | `src/themes/definitions/lothlorien.ts` | `colors.secondary.100` | `#d1fae5` |
| **OCR Quick Presets** | Button Text | `src/styles/themes/lothlorien.css` | `--theme-text-header` | `#004915` |
| **OCR Search Box** | Background | `src/styles/themes/lothlorien.css` | `--theme-glass-bg` | `15, 32, 39` |
| **OCR Search Box** | Border | `src/styles/themes/lothlorien.css` | `--theme-glass-border` | `34, 85, 48` |
| **Text Selection** | Background | `src/styles/themes/lothlorien.css` | `::selection background-color` | `rgba(34, 197, 94, 0.25)` |

## 📁 File Structure Summary

### Theme Definition (`src/themes/definitions/lothlorien.ts`)
- **Primary/Secondary/Accent Colors**: Full 50-900 palette for buttons, badges, status indicators
- **Neutral Colors**: Text and background variations
- **Semantic Colors**: Specific component mappings (optional)

### Theme CSS (`src/styles/themes/lothlorien.css`)
- **CSS Variables**: Core theme colors and glass effects
- **Text Hierarchy**: Body, header, secondary, interactive text colors
- **Component Overrides**: Minimal styling for theme-specific needs

## 🚀 Quick Edit Examples

### Change Primary Button Color
```typescript
// File: src/themes/definitions/lothlorien.ts
primary: {
    500: '#your-new-color',  // ← Edit this
}
```

### Change Body Text Color
```css
/* File: src/styles/themes/lothlorien.css */
--theme-text-body: #your-new-color;  /* ← Edit this */
```

### Change Glass Panel Background
```css
/* File: src/styles/themes/lothlorien.css */
--theme-glass-bg: r, g, b;  /* ← Edit RGB values */
```

### Change OCR Checkbox Selected Color
```typescript
// File: src/themes/definitions/lothlorien.ts
accent: {
    500: '#your-new-color',  // ← Edit this (orange checkmarks)
}
```

### Change OCR Quick Preset Buttons
```typescript
// File: src/themes/definitions/lothlorien.ts
secondary: {
    100: '#your-new-color',  // ← Edit this (button background)
}
```

### Change Segmented Control Text Colors
```css
/* File: src/index.css - For unselected text (Aa, palette icon) */
.segmented-control .segment {
    color: rgb(your, new, color);  /* ← Edit RGB values */
}

/* File: src/index.css - For selected text (active Aa) */
.segmented-control .segment.active {
    color: rgb(your, new, color);  /* ← Edit RGB values */
}
```

### Change Header Card Controls via Theme Variables
```css
/* File: src/styles/themes/lothlorien.css - Override via theme variables */
--color-neutral-600: your, new, color;  /* ← Unselected text */
--color-primary-800: your, new, color;  /* ← Selected text */
```

## 💡 Pro Tips

1. **Buttons**: Always use theme definition file (`lothlorien.ts`)
2. **Text Colors**: Use CSS variables in theme CSS file (`lothlorien.css`)
3. **Glass Effects**: RGB values in CSS variables (no # prefix)
4. **Consistency**: Primary 500 = main button, 600 = hover state
5. **Testing**: Changes apply immediately on theme switch

## 🔍 Finding Component Classes

Use browser dev tools to inspect elements and look for:
- `bg-theme-primary-500` → Theme definition file
- `text-theme-header` → CSS variables in theme CSS
- `segmented-control` → Check `src/index.css` for segment styling
- Custom classes → Check theme CSS file first

## 🎛️ Header Card Controls Breakdown

| Visual Element | What It Controls | Color Source | Notes |
|----------------|------------------|--------------|-------|
| **"Aa" Text (Unselected)** | Font size selector inactive buttons | `--color-neutral-600` fallback `75 85 99` | Gray text for inactive sizes |
| **"Aa" Text (Selected)** | Font size selector active button | `--color-primary-800` fallback `30 64 175` | Blue text for current size |
| **Palette Icon 🎨** | Theme selector button icon | `--color-neutral-600` fallback `75 85 99` | Same as unselected segments |
| **Segmented Control Background** | Container background | `rgba(255, 255, 255, 0.1)` | Semi-transparent white |
| **Active Indicator** | Sliding background behind selected | `--color-primary-200` gradient | Light blue sliding indicator |

## 🎯 OCR Language Components Breakdown

| Visual Element | What It Controls | Color Source |
|----------------|------------------|--------------|
| **"Manual Language Selection"** | Modal header text | `--theme-text-header` |
| **"Select Languages (1 selected)"** | Subheader text | `--theme-text-body` |
| **Orange Checkmarks** | Selected language indicators | `colors.accent.500` |
| **Language Names** | "English", "Chinese", etc. | `--theme-text-body` |
| **File Sizes** | "4.2MB", "15.2MB", etc. | `--theme-text-secondary` |
| **Search Box** | Filter languages input | `--theme-glass-bg` + `--theme-glass-border` |
| **Quick Preset Buttons** | "English Only", "English + Chinese" | `colors.secondary.100` (bg) + `--theme-text-header` (text) |
| **Modal Background** | Overall dialog background | `--theme-glass-bg` |