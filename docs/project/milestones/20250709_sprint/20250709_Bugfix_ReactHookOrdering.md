# React Hook Ordering Fix

**Date:** July 9, 2025  
**Issue:** `Cannot access 'features' before initialization` error in ComparisonInterface  
**Status:** Fixed ✅

## Problem

The ComparisonInterface component was throwing a runtime error:
```
Uncaught ReferenceError: Cannot access 'features' before initialization
```

## Root Cause

**Hook Ordering Violation**: The `useEffect` hook on line 227 was trying to access `features.resultsOverlay` and `overlayVisible` before the hooks that provide these values were called:

```typescript
// Line 227: useEffect trying to access features and overlayVisible
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (features.resultsOverlay && overlayVisible) { // ERROR: accessing before initialization
        return;
      }
      // ...
    }
  };
}, [features.resultsOverlay, overlayVisible]); // Dependencies not yet available

// Line 287: features defined AFTER the useEffect
const { features } = useExperimentalFeatures();

// Line 298: overlayVisible defined AFTER the useEffect  
const { isVisible: overlayVisible } = useResultsOverlay(/* ... */);
```

## Solution

**Moved Hook Declarations**: Moved the experimental features hooks to be called **before** the useEffect that depends on them:

```typescript
// Fixed order:
// 1. First: Define all hooks
const { features } = useExperimentalFeatures();
const experimentalCSSClasses = useExperimentalCSSClasses();
const { jumpToResults } = useJumpToResults();
const { getPanelVisibility } = useMobileTabInterface();
const { isVisible: overlayVisible } = useResultsOverlay(/* ... */);

// 2. Then: Use them in useEffect
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (features.resultsOverlay && overlayVisible) { // ✅ Now available
        return;
      }
      // ...
    }
  };
}, [features.resultsOverlay, overlayVisible]); // ✅ Dependencies available
```

## Changes Made

1. **Moved Hook Declarations** (lines 199-226):
   - `useExperimentalFeatures()` 
   - `useExperimentalCSSClasses()`
   - `useJumpToResults()`
   - `useMobileTabInterface()`
   - `useResultsOverlay()`

2. **Removed Duplicate Declarations** (lines 315-342):
   - Removed the duplicate hooks that were declared later in the file

3. **Maintained Hook Order Rules**:
   - All hooks are called at the top level
   - No conditional hook calls
   - Dependencies are available before use

## Files Modified

- `src/components/ComparisonInterface.tsx` - Fixed hook ordering

## Testing

✅ **Build Successful** - No compilation errors  
✅ **Runtime Error Fixed** - No more "Cannot access before initialization" error  
✅ **Hook Dependencies** - All dependencies available when needed  
✅ **Functionality Preserved** - All features work as expected  

## Key Learning

**React Hook Rules**: Hooks must be called in the same order every time and their return values must be available before being used in other hooks or effects. This is a fundamental React rule that ensures consistent behavior.

The fix ensures that:
1. All hooks are called before any effects that depend on them
2. Dependencies are properly available when referenced
3. No duplicate declarations exist
4. Hook order is consistent across renders

---

**Status**: React hook ordering issue resolved - header hiding functionality now works correctly.
