# Design Document

## Overview

This design implements a simple React Context Provider to solve the RdLn Memory state synchronization issue. The solution follows the existing app patterns (`ThemeProvider`, `FontSizeProvider`) and wraps the current `useRdLnMemory` hook to create a single shared state across all components.

## Architecture

### Current Architecture (Problematic)
```
ComparisonInterface.tsx
├── useRdLnMemory() → Independent State A
└── RdLnMemorySidePanel.tsx
    └── useRdLnMemory() → Independent State B

RdLnMemoryDropdown.tsx
└── useRdLnMemory() → Independent State C
```

**Problem:** Three separate states, no synchronization.

### New Architecture (Solution)
```
main.tsx
└── RdLnMemoryProvider (wraps useRdLnMemory)
    └── App
        ├── ComparisonInterface.tsx → useRdLnMemoryContext()
        ├── RdLnMemorySidePanel.tsx → useRdLnMemoryContext()
        └── RdLnMemoryDropdown.tsx → useRdLnMemoryContext()
```

**Solution:** Single shared state via React Context.

## Components and Interfaces

### 1. RdLnMemoryContext (New)

**File:** `src/contexts/RdLnMemoryContext.tsx`

```typescript
interface RdLnMemoryContextType {
  // State (from existing useRdLnMemory)
  sessions: RdLnSession[];
  hasSessions: boolean;
  isLoading: boolean;
  
  // Actions (from existing useRdLnMemory)
  saveSession: (originalText: string, revisedText: string, hasResult: boolean, sessionName?: string) => string;
  loadSession: (sessionId: string) => RdLnSession | null;
  deleteSession: (sessionId: string) => void;
  clearAllSessions: () => void;
  generateSessionName: (originalText: string, revisedText: string) => string;
  exportSessions: () => string;
  importSessions: (jsonData: string) => boolean;
}
```

**Key Design Decisions:**
- **Reuse existing hook:** The provider wraps `useRdLnMemory()` directly, no changes needed to the hook
- **Same interface:** Components get the exact same API they had before
- **Error boundary:** Clear error message if context is used outside provider

### 2. Provider Implementation

```typescript
export const RdLnMemoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const rdlnMemory = useRdLnMemory(); // Single instance
  
  return (
    <RdLnMemoryContext.Provider value={rdlnMemory}>
      {children}
    </RdLnMemoryContext.Provider>
  );
};

export const useRdLnMemoryContext = () => {
  const context = useContext(RdLnMemoryContext);
  if (!context) {
    throw new Error('useRdLnMemoryContext must be used within RdLnMemoryProvider');
  }
  return context;
};
```

### 3. Component Updates

**Before:**
```typescript
import { useRdLnMemory } from '../hooks/useRdLnMemory';
const { sessions, saveSession, deleteSession } = useRdLnMemory();
```

**After:**
```typescript
import { useRdLnMemoryContext } from '../contexts/RdLnMemoryContext';
const { sessions, saveSession, deleteSession } = useRdLnMemoryContext();
```

**Components to update:**
- `ComparisonInterface.tsx`
- `RdLnMemorySidePanel.tsx` 
- `RdLnMemoryDropdown.tsx`

**Design Decision:** Keep the dropdown as a separate component and focus only on fixing the state synchronization issue. This maintains architectural simplicity and avoids scope creep.

## Data Models

### Current Data Structure Analysis

The existing `RdLnSession` interface is suitable for the current UX flows and synchronization fix:

```typescript
interface RdLnSession {
  id: string;                    // Unique identifier
  timestamp: number;             // Creation time  
  originalText: string;          // Full original document
  revisedText: string;           // Full revised document
  hasResult: boolean;            // Whether comparison was run
  sessionName?: string;          // User-friendly name
  autoSaved: boolean;            // Auto vs manual save
  characterCount: number;        // Total character count
  preview: string;               // First 50 chars preview
}
```

**Strengths for Current Scope:**
- Supports all existing UX flows (save, load, preview, organize)
- Adequate for localStorage storage limits in typical usage
- Provides good user experience with previews and smart naming
- Maintains backward compatibility

**Decision:** Keep existing data structure unchanged to maintain architectural simplicity and focus on the synchronization fix. Storage optimization and advanced features can be addressed in future iterations.

## Error Handling

### Context Error
```typescript
// Clear error if context is used incorrectly
if (!context) {
  throw new Error('useRdLnMemoryContext must be used within RdLnMemoryProvider');
}
```

### Storage Errors
**No changes needed.** The existing `useRdLnMemory` hook already handles:
- localStorage failures
- Storage quota exceeded
- Data corruption
- Session validation

## Testing Strategy

### Critical User Flow Testing (From Analysis Report)
1. **Save Session:** Verify appears immediately in all components
2. **Delete Session:** Verify removal from all components  
3. **Load Session:** Verify data loads correctly
4. **Page Reload:** Verify persistence works
5. **Multiple Tabs:** Verify cross-tab synchronization (existing localStorage behavior)

### Unit Tests
1. **Context Provider:** Test that it provides the correct values
2. **Hook Replacement:** Test that components get the same data
3. **Error Boundaries:** Test error when context is missing

### Integration Tests
1. **Cross-Component Sync:** Save in side panel, immediately check dropdown
2. **Real User Flow:** Save → Delete → Load across all three components
3. **Persistence:** Reload page, verify sessions persist with same data format

### Edge Cases (From Analysis Report)
1. **Storage Quota Exceeded:** Test existing fallback behavior still works
2. **Corrupted Data:** Test existing data validation continues to work
3. **Network Offline:** Test offline functionality (existing localStorage behavior)
4. **Large Sessions:** Test performance with many sessions (no regression)

## Implementation Plan

### Phase 1: Create Context Provider (Critical - Fix Immediately)
1. Create `src/contexts/RdLnMemoryContext.tsx`
2. Implement provider and hook exactly as shown in analysis report
3. Add basic unit tests

### Phase 2: Update App Structure (Critical - Fix Immediately)
1. Add provider to `main.tsx` alongside existing providers
2. Test that app still works with no regressions

### Phase 3: Update Components (Critical - Fix Immediately)
1. Update `ComparisonInterface.tsx` - replace `useRdLnMemory` import
2. Update `RdLnMemorySidePanel.tsx` - replace hook usage
3. Update `RdLnMemoryDropdown.tsx` - replace read-only usage with context
4. Test save/delete/load flows across all three components

### Phase 4: Integration Testing (Critical - Fix Immediately)
1. Test cross-component synchronization (save in panel, see in dropdown)
2. Test all user flows (save → delete → load)
3. Verify page reload persistence works
4. Verify no regressions in existing functionality

### Future Phases (Post-MVP, from Analysis Report)
- **High Priority:** Enhanced error handling, optimistic updates, loading states
- **Enhancement:** IndexedDB migration, session search, compression, offline indicators

## Migration Safety

**Backward Compatibility:**
- Existing `useRdLnMemory` hook remains unchanged
- Same localStorage key and data format
- All existing functionality preserved
- No breaking changes to component APIs

**Rollback Plan:**
If issues arise, simply:
1. Remove provider from `main.tsx`
2. Revert component imports back to `useRdLnMemory`
3. System returns to previous state

## Performance Considerations

**Immediate Benefits:**
- Single hook instance instead of three (reduces memory usage)
- Eliminates duplicate localStorage reads on app startup
- Reduces memory usage from multiple hook instances
- React Context updates only when sessions change

**Future Enhancements (Post-MVP):**
Based on the analysis report, these optimizations can be added later:
- Optimistic updates with rollback for better UX
- Batch localStorage operations to prevent race conditions
- Consider IndexedDB migration via localForage for large datasets
- Session compression for storage efficiency

**Current Performance:**
- No additional re-renders beyond current behavior
- Same localStorage operations (no performance regression)
- Maintains existing performance characteristics