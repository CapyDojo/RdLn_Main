# Auto Paragraph Breaks Feature Plan

## Overview
Implement automatic paragraph break insertion before key legal phrases in document text inputs to improve readability.

## Implementation Approach
1. **Wrapper Component Architecture**
   - Create `TextInputWithFormatting.tsx` to wrap existing `TextInputPanel`
   - Add toggle checkbox for enabling/disabling auto-formatting
   - Maintain all existing functionality while adding new feature

2. **Formatting Logic**
   - Create `paragraphFormatting.ts` utility with:
     - List of legal phrases that trigger breaks (e.g. "IN WITNESS WHEREOF")
     - Function to process text and insert breaks before phrases
     - Configurable spacing options (single/double line breaks)

3. **Integration Points**
   - Replace `TextInputPanel` usage in:
     - `MobileInputLayout.tsx`
     - `DesktopInputLayout.tsx`
   - Ensure proper TypeScript prop forwarding

4. **User Interface**
   - Toggle control below text area
   - Tooltip explaining feature
   - Visual indicator when active

## Technical Considerations
- Preserve original text for diffing/redlining
- Performance with large documents
- Localization of legal phrases
- Undo/redo support

## Testing Plan
1. Unit tests for formatting utility
2. Integration tests with wrapper component
3. Manual verification:
   - Toggle functionality
   - Break insertion accuracy
   - Performance with large inputs
   - Mobile/desktop behavior

## Documentation
- Update user guide with new feature
- Add developer comments
- Create feature flag if needed

## Future Enhancements
- Custom phrase dictionary
- User-defined formatting rules
- AI-assisted break detection
- Formatting presets

## Rollout Strategy
1. Develop behind feature flag
2. Internal testing
3. Limited beta release
4. Full deployment after validation
