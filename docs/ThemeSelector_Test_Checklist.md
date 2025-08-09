# ThemeSelector Refactor - Test Checklist

## Quick Verification Steps

### ✅ **Basic Functionality**
- [ ] Theme selector button appears in the UI
- [ ] Hover over theme button shows cascading theme cards
- [ ] Theme cards display with proper visual styling
- [ ] Clicking a theme card changes the application theme
- [ ] Selected theme shows check mark indicator

### ✅ **Interaction Features**
- [ ] Hover effects work on individual theme cards
- [ ] Keyboard navigation works (Arrow keys when open)
- [ ] Enter/Space selects theme, Escape closes
- [ ] Mouse leave closes the cascade after delay

### ✅ **Drag & Drop (Advanced)**
- [ ] Theme cards can be dragged to reorder
- [ ] Bump physics animation works during drag
- [ ] Drop zones appear during drag operations
- [ ] Theme order persists after reordering

### ✅ **Visual Polish**
- [ ] Cascade animation is smooth and staggered
- [ ] Theme cards have proper glassmorphism effects
- [ ] Zoom level changes don't break positioning
- [ ] All themes display with correct colors/gradients

### ✅ **Performance**
- [ ] No console errors in browser dev tools
- [ ] Smooth animations without lag
- [ ] Memory usage stable (check dev tools)
- [ ] No visual glitches during interactions

## Expected Behavior

**On Hover**: Theme cards should cascade out in a curved arc pattern with staggered animation delays.

**On Theme Selection**: Application theme should change immediately, and cascade should close.

**On Drag**: Cards should show bump physics (nearby cards move slightly), with smooth drop zones.

**On Keyboard**: Arrow keys navigate, Enter selects, Escape closes.

## Quick Test Commands

```bash
# Start development server
npm run dev

# Run tests (if available)
npm run test

# Check for TypeScript errors
npx tsc --noEmit
```

## Rollback Plan

If issues are found, the original component can be restored from git history:
```bash
git log --oneline src/components/ThemeSelector.tsx
git checkout <commit-hash> -- src/components/ThemeSelector.tsx
```