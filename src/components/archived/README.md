# Archived Components

This directory contains components that are no longer actively used in production but are retained for potential future use.

## Legacy RdLn Memory Components

### RdLnMemoryButton.tsx
- **Archived**: 2025-08-19
- **Reason**: Replaced by RdLnMemoryEdgeTab + RdLnMemorySidePanel unified system
- **Description**: Compact button with dropdown for session management integration in toolbars
- **Dependencies**: RdLnMemoryDropdown
- **Status**: Fully functional, not used in current UI

### RdLnMemoryDropdown.tsx  
- **Archived**: 2025-08-19
- **Reason**: Replaced by RdLnMemorySidePanel for better UX
- **Description**: Popup dropdown menu for quick session management
- **Dependencies**: RdLnMemoryContext
- **Status**: Fully functional, not used in current UI

## Revival Instructions

To restore any of these components:
1. Move the component back to `src/components/`
2. Update imports in any files that need the component
3. Verify the component still works with current context providers
4. Update this README to reflect the restoration