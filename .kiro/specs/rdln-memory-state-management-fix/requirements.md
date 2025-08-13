# Requirements Document

## Introduction

The RdLn Memory session management system has a simple but critical bug: multiple components are using separate instances of the `useRdLnMemory` hook, causing sessions saved in one component to not appear in others until page reload.

**The Problem:**
- `ComparisonInterface`, `RdLnMemorySidePanel`, and `RdLnMemoryDropdown` each create their own session state
- When a user saves a session in the side panel, it doesn't appear in the dropdown immediately
- This breaks the core user experience of session management

**The Solution:**
Create a single shared state using React Context (following the existing `ThemeProvider` pattern), so all components see the same session data.

## Requirements

### Requirement 0: Architectural Simplicity Principle

**User Story:** As a developer, I want solutions that are simple, elegant, and focused on the core user experience, so that the codebase remains maintainable and the app's purpose is preserved.

#### Acceptance Criteria

1. WHEN implementing any solution THEN it SHALL use the simplest approach that solves the problem
2. WHEN choosing between options THEN the solution SHALL prioritize architectural elegance over feature complexity
3. WHEN making design decisions THEN the overall purpose and UX flows of the app SHALL be kept in mind
4. WHEN in doubt THEN the implementation SHALL avoid overengineering and focus on user value
5. WHEN building solutions THEN they SHALL be minimal working modules that can be built upon and expanded
6. WHEN avoiding complexity THEN the focus SHALL be on solutions that are easy to undo and debug later

### Requirement 1: Immediate Session Synchronization

**User Story:** As a user, I want my session operations (save, delete, load) to be immediately visible across all parts of the application, so that the interface feels responsive and consistent.

#### Acceptance Criteria

1. WHEN I save a session from the side panel THEN it SHALL appear immediately in the dropdown and other components
2. WHEN I delete a session from any component THEN it SHALL disappear immediately from all components
3. WHEN I load a session THEN the data SHALL be consistent across the application
4. WHEN I perform any session operation THEN no page reload SHALL be required

### Requirement 2: Single Shared State

**User Story:** As a developer, I want one shared session state following the existing app patterns, so that all components automatically stay in sync.

#### Acceptance Criteria

1. WHEN the application starts THEN there SHALL be exactly one `RdLnMemoryProvider` in `main.tsx`
2. WHEN components need session data THEN they SHALL use `useRdLnMemoryContext()` instead of `useRdLnMemory()`
3. WHEN the context is missing THEN components SHALL show a clear error
4. WHEN session data changes THEN all components SHALL update automatically

### Requirement 3: Preserve Existing Functionality

**User Story:** As a user, I want all current session features to continue working exactly as before, so that nothing breaks during the fix.

#### Acceptance Criteria

1. WHEN I save sessions THEN they SHALL persist to localStorage as before
2. WHEN I reload the page THEN my sessions SHALL be restored
3. WHEN I export/import sessions THEN the functionality SHALL work unchanged
4. WHEN localStorage fails THEN the existing error handling SHALL continue to work

### Requirement 4: Simple Migration

**User Story:** As a developer, I want a straightforward migration path that doesn't require complex refactoring, so that the fix can be implemented quickly and safely.

#### Acceptance Criteria

1. WHEN creating the context provider THEN it SHALL wrap the existing `useRdLnMemory` hook
2. WHEN updating components THEN only the hook import SHALL need to change
3. WHEN the migration is complete THEN the existing `useRdLnMemory` hook SHALL remain unchanged
4. WHEN testing the fix THEN existing sessions SHALL continue to work