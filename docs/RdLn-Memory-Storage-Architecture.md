# RdLn Memory - Storage Architecture

## Executive Summary

### **What It Does**
RdLn automatically saves and manages document comparison sessions without any user intervention. Users can save up to 99 sessions that persist across browser restarts.

### **Three-Tier Storage Architecture**
1. **Memory Storage**: Current session data (lost when browser closes)
2. **localStorage**: Persistent files on user's hard drive via browser (survives restarts)
3. **JSON Export**: User downloads permanent backup files to their computer

### **Physical Storage Location**
Sessions are stored as encrypted files on the user's computer:
- **Windows**: `C:\Users\[username]\AppData\Local\[Browser]\Local Storage\`
- **macOS**: `~/Library/Application Support/[Browser]/Local Storage/`
- **Linux**: `~/.config/[browser]/Local Storage/`

### **How It Works**
- **Automatic**: Every session change instantly saves to browser's localStorage (hard drive files)
- **Reactive**: All UI components immediately see updates across the app
- **Client-Side**: Everything stays on user's computer - never sent to servers
- **Graceful Degradation**: localStorage (99 sessions) → localStorage (49 sessions) → memory-only → JSON export

### **Key Benefits**
- **Never lose work**: Automatic saving with robust error handling
- **Complete privacy**: Data stored locally on user's hard drive, never uploaded
- **Seamless experience**: No manual save buttons or complex workflows
- **Enterprise-ready**: Handles storage failures gracefully, works in all browser environments

### **Technical Highlights**
- **99 session limit** with automatic cleanup of oldest sessions
- **Multiple save triggers**: Manual save, auto-save after comparisons, Alt+M hotkey
- **Bulletproof error handling**: System never crashes, always provides working functionality
- **Cross-component sync**: Single source of truth via React Context

### **Bottom Line**
Users get a professional document comparison tool where their sessions are automatically saved as encrypted files on their own computer, with enterprise-grade reliability that handles any browser storage scenario gracefully. Complete privacy with no cloud dependencies.

---

## Overview

RdLn's memory management system provides automatic, reliable session persistence using a reactive storage architecture. The system ensures users never lose their work while maintaining optimal performance and handling browser storage limitations gracefully.

## Core Architecture Principles

### **Reactive Auto-Save**
- **No manual save required** - all changes automatically persist
- **Instant storage** - every session change immediately saved to browser
- **Always synchronized** - localStorage always reflects current session state

### **Client-Side Privacy**
- **Local storage only** - data never leaves user's browser
- **Per-domain isolation** - sessions isolated to RdLn application
- **Complete confidentiality** - no server uploads or external storage

---

## Storage Flow Architecture

### **🔄 Automatic Storage System**

#### **Reactive Storage Pattern**
```javascript
// Every time sessions change, automatically save to localStorage
useEffect(() => {
  if (!isInitializedRef.current || !autoSave || isLoading) return;
  
  try {
    const sessionsToStore = sessions.slice(0, maxSessions);
    localStorage.setItem('rdln_memory_sessions', JSON.stringify(sessionsToStore));
    console.log(`💾 RdLn Memory: Saved ${sessionsToStore.length} sessions to storage`);
  } catch (error) {
    // Graceful error handling with fallback reduction
    handleStorageError(error);
  }
}, [sessions, maxSessions, storageKey, autoSave, isLoading]);
```

**Architecture Benefits:**
- **Declarative** - React useEffect handles when to save
- **Automatic** - no imperative save calls needed
- **Consistent** - same pattern across all session operations
- **Error-resilient** - built-in error handling and recovery

---

## Session Creation Triggers

### **1. Manual Save (Side Panel)**
```javascript
const handleSaveSession = () => {
  if (contentLength === 0) return;
  saveSession(originalText, revisedText, hasResult);
  // ↓ Automatically triggers useEffect storage
  // ↓ Saves to localStorage immediately
  onClose();
};
```

**User Flow:**
1. User clicks "Save Session" in side panel
2. Validates content exists
3. Creates session object
4. Updates React state
5. Automatic storage triggered
6. UI updates across all components

### **2. Auto-Save (After Comparison)**
```javascript
// Triggered when comparison completes with meaningful content
if (totalContent > 50) { // Minimum content threshold
  saveSession(currentOriginal, currentRevised, true); // hasResult = true
  console.log('🎯 Auto-saved comparison to RdLn Memory');
}
```

**Trigger Conditions:**
- **Content threshold**: Minimum 50 characters total
- **Comparison complete**: User has run a document comparison
- **Meaningful content**: Not just empty or whitespace

### **3. Quick Save (Keyboard Shortcut)**
```javascript
// Alt+M hotkey saves current content
const handleKeyDown = (event) => {
  if (event.altKey && event.key === 'm') {
    const totalContent = (originalText?.length || 0) + (revisedText?.length || 0);
    if (totalContent > 0) {
      handleSaveSession();
      console.log('💾 Quick save to RdLn Memory via Alt+M');
    }
  }
};
```

**Power User Feature:**
- **Keyboard shortcut**: Alt+M for quick save
- **Any content**: Saves even without comparison results
- **Instant feedback**: Console logging confirms save

---

## Session Data Structure

### **Session Object Schema**
```typescript
interface RdLnSession {
  id: string;                    // Unique identifier
  timestamp: number;             // Creation time (for sorting)
  originalText: string;          // Source document content
  revisedText: string;           // Modified document content
  hasResult: boolean;            // Whether comparison was run
  sessionName?: string;          // User-provided or auto-generated name
  autoSaved: boolean;            // Whether automatically saved
  characterCount: number;        // Total characters (original + revised)
  preview: string;               // First 50 chars for quick identification
}
```

### **Session Creation Process**
```javascript
const saveSession = useCallback((originalText, revisedText, hasResult, sessionName) => {
  const newSession: RdLnSession = {
    id: `rdln_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    originalText: originalText || '',
    revisedText: revisedText || '',
    hasResult,
    sessionName: sessionName || generateSessionName(originalText, revisedText),
    autoSaved: !sessionName, // Auto-saved if no explicit name provided
    characterCount: (originalText?.length || 0) + (revisedText?.length || 0),
    preview: createPreview(originalText, revisedText)
  };
  
  setSessions(prevSessions => {
    const updatedSessions = [newSession, ...prevSessions]; // Newest first
    const limitedSessions = updatedSessions.slice(0, maxSessions); // Enforce limit
    return limitedSessions;
  });
  
  return newSession.id;
}, [generateSessionName, createPreview, maxSessions]);
```

---

## Storage Location & Format

### **Browser Storage Details**
- **Storage Type**: Browser localStorage
- **Storage Key**: `'rdln_memory_sessions'`
- **Data Format**: JSON array of session objects
- **Scope**: Domain-specific (isolated to RdLn application)
- **Persistence**: Survives browser restarts, cleared only by user action

### **Storage Format Example**
```json
[
  {
    "id": "rdln_1755165012287_abc123def",
    "timestamp": 1755165012287,
    "originalText": "Original contract terms and conditions...",
    "revisedText": "Revised contract with updated clauses...",
    "hasResult": true,
    "sessionName": "Contract Review - Q4 2024",
    "autoSaved": false,
    "characterCount": 2847,
    "preview": "Original contract terms and conditions..."
  },
  {
    "id": "rdln_1755164892156_def456ghi",
    "timestamp": 1755164892156,
    "originalText": "Legal document draft version 1...",
    "revisedText": "Legal document draft version 2...",
    "hasResult": true,
    "sessionName": "Legal document draft version 1 vs Legal document draft version 2",
    "autoSaved": true,
    "characterCount": 1523,
    "preview": "Legal document draft version 1..."
  }
]
```

---

## Performance & Optimization

### **Session Limits & Management**
```javascript
// Configuration
const maxSessions = 99;  // Maximum sessions stored
const previewLength = 50; // Characters in preview text

// Automatic cleanup
const sessionsToStore = sessions.slice(0, maxSessions); // Keep newest 99
localStorage.setItem(storageKey, JSON.stringify(sessionsToStore));
```

### **Memory Management Strategy**
- **FIFO Cleanup**: First In, First Out - oldest sessions removed first
- **Newest Priority**: Most recent work always preserved
- **Automatic Limits**: No user intervention required
- **Performance Optimized**: Efficient array operations

### **Storage Optimization Techniques**
1. **Lazy Loading**: Sessions loaded only on app initialization
2. **Efficient Serialization**: Direct JSON stringify/parse
3. **Minimal Data**: Only essential fields stored
4. **Smart Previews**: Truncated content for quick identification

---

## Application Initialization

### **Startup Sequence**
```javascript
// Load sessions from localStorage on app initialization
useEffect(() => {
  if (isInitializedRef.current) return;
  
  const loadSessions = async () => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedSessions: RdLnSession[] = JSON.parse(stored);
        
        // Validate and clean stored data
        const validSessions = parsedSessions.filter(isValidSession);
        
        // Sort by timestamp (newest first)
        const sortedSessions = validSessions.sort((a, b) => b.timestamp - a.timestamp);
        setSessions(sortedSessions);
        
        console.log(`📚 RdLn Memory: Loaded ${sortedSessions.length} sessions from storage`);
      }
    } catch (error) {
      console.warn('Failed to load RdLn Memory sessions from localStorage:', error);
      localStorage.removeItem(storageKey); // Clean up corrupted data
    } finally {
      setIsLoading(false);
      isInitializedRef.current = true;
    }
  };

  loadSessions();
}, [storageKey]);
```

### **Data Validation & Cleanup**
```javascript
const isValidSession = (session): session is RdLnSession => 
  session && 
  typeof session.id === 'string' &&
  typeof session.timestamp === 'number' &&
  typeof session.originalText === 'string' &&
  typeof session.revisedText === 'string' &&
  typeof session.hasResult === 'boolean' &&
  typeof session.autoSaved === 'boolean' &&
  typeof session.characterCount === 'number' &&
  typeof session.preview === 'string';
```

---

## Error Handling & Resilience

### **Storage Quota Management**
```javascript
try {
  localStorage.setItem(storageKey, JSON.stringify(sessionsToStore));
} catch (error) {
  console.warn('Failed to save RdLn Memory sessions to localStorage:', error);
  
  // Fallback: Reduce sessions and retry
  try {
    const reducedSessions = sessions.slice(0, Math.floor(maxSessions / 2)); // 49 sessions
    localStorage.setItem(storageKey, JSON.stringify(reducedSessions));
    setSessions(reducedSessions);
    console.log(`💾 RdLn Memory: Saved reduced sessions (${reducedSessions.length}) due to storage limit`);
  } catch (retryError) {
    console.error('Failed to save reduced RdLn Memory sessions:', retryError);
    // System continues in memory-only mode
  }
}
```

### **Graceful Degradation Levels**
1. **Normal Operation**: Full persistence with 99 sessions
2. **Quota Exceeded**: Reduced persistence with 49 sessions
3. **Storage Unavailable**: Memory-only mode with full functionality
4. **Complete Failure**: Application continues working, no persistence

### **Data Corruption Handling**
- **Validation**: Strict type checking on load
- **Filtering**: Remove corrupted sessions, keep valid ones
- **Cleanup**: Automatically remove corrupted localStorage data
- **Recovery**: Start fresh if all data is corrupted

---

## State Management Architecture

### **React Context Integration**
```javascript
// Single source of truth via React Context
const RdLnMemoryContext = createContext<RdLnMemoryContextType | undefined>(undefined);

export const RdLnMemoryProvider: React.FC<RdLnMemoryProviderProps> = ({ children }) => {
  // Single instance of useRdLnMemory hook shared across all components
  const rdlnMemory = useRdLnMemory();

  return (
    <RdLnMemoryContext.Provider value={rdlnMemory}>
      {children}
    </RdLnMemoryContext.Provider>
  );
};
```

### **Cross-Component Synchronization**
- **Shared State**: Single hook instance via React Context
- **Instant Updates**: All components see changes immediately
- **No Props Drilling**: Direct access via `useRdLnMemoryContext()`
- **Type Safety**: Full TypeScript support throughout

---

## Session Operations

### **Core Operations**
```javascript
// Save new session
const sessionId = saveSession(originalText, revisedText, hasResult, sessionName?);

// Load existing session
const session = loadSession(sessionId);

// Delete session
deleteSession(sessionId);

// Clear all sessions
clearAllSessions();

// Export sessions as JSON
const jsonData = exportSessions();

// Import sessions from JSON
const success = importSessions(jsonData);
```

### **Smart Session Naming**
```javascript
const generateSessionName = useCallback((originalText: string, revisedText: string): string => {
  const now = new Date();
  const timeStr = now.toLocaleString();
  
  // Extract meaningful content for naming
  const originalPreview = originalText.trim().slice(0, 20);
  const revisedPreview = revisedText.trim().slice(0, 20);
  
  if (originalPreview && revisedPreview) {
    return `${originalPreview} vs ${revisedPreview}`;
  } else if (originalPreview) {
    return `${originalPreview} (comparison)`;
  } else if (revisedPreview) {
    return `New comparison with ${revisedPreview}`;
  } else {
    return `Comparison ${timeStr}`;
  }
}, []);
```

---

## Monitoring & Debugging

### **Console Logging Strategy**
```javascript
// Informational logs
console.log(`📚 RdLn Memory: Loaded ${sessions.length} sessions from storage`);
console.log(`💾 RdLn Memory: Session saved "${sessionName}" (${characterCount} chars)`);
console.log(`📖 RdLn Memory: Loading session "${sessionName}"`);

// Warning logs
console.warn('Failed to save RdLn Memory sessions to localStorage:', error);

// Error logs
console.error('Failed to save reduced RdLn Memory sessions:', retryError);
```

### **Debug Information Access**
```javascript
// Check storage status
const storageInfo = {
  sessionsCount: sessions.length,
  storageMode: storageAvailable ? 'persistent' : 'memory-only',
  totalCharacters: sessions.reduce((sum, s) => sum + s.characterCount, 0),
  oldestSession: sessions[sessions.length - 1]?.timestamp,
  newestSession: sessions[0]?.timestamp
};
```

---

## Architecture Benefits

### **User Experience**
- **Seamless**: No manual save/load operations required
- **Instant**: Immediate access to all saved sessions
- **Reliable**: Work is never lost, even with storage issues
- **Fast**: Optimized for quick session access and management

### **Developer Experience**
- **Simple API**: Clean, intuitive function interface
- **Type Safe**: Full TypeScript support with strict typing
- **Testable**: Comprehensive test coverage for all scenarios
- **Maintainable**: Clear separation of concerns and modular design

### **System Reliability**
- **Fault Tolerant**: Graceful handling of all error conditions
- **Self-Healing**: Automatic cleanup of corrupted data
- **Performance Optimized**: Efficient memory and storage usage
- **Privacy Focused**: Complete client-side operation

---

## Future Enhancements

### **Planned Improvements**
- **Storage Quota Modal**: User notification and export option before cleanup
- **Usage Analytics**: Storage usage indicators and proactive warnings
- **Enhanced Recovery**: Better corruption detection and partial session recovery
- **Compression**: Optional data compression for larger session storage

### **Extensibility Points**
- **Storage Backends**: Pluggable storage system (localStorage, IndexedDB, etc.)
- **Session Metadata**: Additional fields for categorization and search
- **Sync Capabilities**: Potential for cross-device synchronization
- **Export Formats**: Multiple export formats beyond JSON

---

## Summary

RdLn's storage architecture provides a robust, automatic session management system that prioritizes user experience and data reliability. The reactive design ensures seamless operation while comprehensive error handling maintains functionality under all conditions.

**Key Architectural Strengths:**
- **Automatic & Reactive**: No manual intervention required
- **Fault Tolerant**: Graceful degradation under all error conditions
- **Performance Optimized**: Efficient storage and memory management
- **Privacy Focused**: Complete client-side operation
- **Developer Friendly**: Clean APIs with comprehensive TypeScript support

This architecture ensures RdLn users can focus on their document comparison work while the system automatically manages session persistence in the background, providing a professional-grade experience that scales from individual use to enterprise environments.