# 🧩 Component Design Template
*Use this template for systematic UI component development following ECI methodology*

## Component Information
**Component Name**: [Enter component name]  
**Purpose**: [What does this component do?]  
**Date Started**: [Date]  
**Designer/Developer**: [Name/Team]  
**Context**: [Where will this component be used?]

---

## Phase 1: EXPLORE 🔍

### Problem Definition
**User Need**: [What user problem does this component solve?]  
**Functional Requirements**: 
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

**Technical Requirements**:
- [Technical constraint/requirement 1]
- [Technical constraint/requirement 2]
- [Technical constraint/requirement 3]

**Success Criteria**: 
- [ ] Usability: [How will we measure usability success?]
- [ ] Accessibility: [Accessibility requirements]
- [ ] Performance: [Performance requirements]
- [ ] Visual Integration: [How should it fit with existing design?]

### Design Exploration

#### Approach A: [Design Philosophy]
**Layout Concept**: [Describe the layout approach]  
**Interaction Pattern**: [How users interact with it]  
**Visual Style**: [Appearance and styling approach]  
**Technical Implementation**: [How it would be built]

**Pros**:
- [Benefit 1]
- [Benefit 2]

**Cons**:
- [Limitation 1]
- [Limitation 2]

#### Approach B: [Design Philosophy]
**Layout Concept**: [Describe the layout approach]  
**Interaction Pattern**: [How users interact with it]  
**Visual Style**: [Appearance and styling approach]  
**Technical Implementation**: [How it would be built]

**Pros**:
- [Benefit 1]
- [Benefit 2]

**Cons**:
- [Limitation 1]
- [Limitation 2]

#### Approach C: [Design Philosophy]
**Layout Concept**: [Describe the layout approach]  
**Interaction Pattern**: [How users interact with it]  
**Visual Style**: [Appearance and styling approach]  
**Technical Implementation**: [How it would be built]

**Pros**:
- [Benefit 1]
- [Benefit 2]

**Cons**:
- [Limitation 1]
- [Limitation 2]

### Prototyping Checklist
- [ ] Created interactive prototype for Approach A
- [ ] Created interactive prototype for Approach B
- [ ] Created interactive prototype for Approach C
- [ ] Tested prototypes with realistic data
- [ ] Validated accessibility with screen readers
- [ ] Tested responsive behavior across devices

---

## Phase 2: COMPARE ⚖️

### Comparison Matrix
| Criteria | Approach A | Approach B | Approach C |
|----------|------------|------------|------------|
| **Usability** | | | |
| **Accessibility** | | | |
| **Visual Impact** | | | |
| **Development Complexity** | | | |
| **Performance** | | | |
| **Maintainability** | | | |
| **Reusability** | | | |
| **User Testing Score** | | | |

### Detailed Analysis

#### Approach A Evaluation
**Usability**: [How intuitive and easy to use?]  
**Accessibility**: [Screen reader support, keyboard navigation, etc.]  
**Performance**: [Rendering speed, memory usage, etc.]  
**Integration**: [How well does it fit with existing components?]  
**Edge Cases**: [How does it handle unusual scenarios?]

#### Approach B Evaluation
**Usability**: [How intuitive and easy to use?]  
**Accessibility**: [Screen reader support, keyboard navigation, etc.]  
**Performance**: [Rendering speed, memory usage, etc.]  
**Integration**: [How well does it fit with existing components?]  
**Edge Cases**: [How does it handle unusual scenarios?]

#### Approach C Evaluation
**Usability**: [How intuitive and easy to use?]  
**Accessibility**: [Screen reader support, keyboard navigation, etc.]  
**Performance**: [Rendering speed, memory usage, etc.]  
**Integration**: [How well does it fit with existing components?]  
**Edge Cases**: [How does it handle unusual scenarios?]

### User Testing Results
**Testing Method**: [How was user feedback gathered?]  
**Participants**: [Who tested the component?]  
**Key Findings**: 
- [Finding 1]
- [Finding 2]
- [Finding 3]

### Selection Decision
**Selected Approach**: **Approach [Letter]: [Name]**  
**Selection Rationale**: [Why was this approach chosen?]  
**Trade-offs Accepted**: [What compromises were made and why?]

---

## Phase 3: IMPLEMENT 🚀

### Component Specification

#### Props Interface
```typescript
interface [ComponentName]Props {
  // Required props
  [propName]: [type];
  
  // Optional props
  [propName]?: [type];
  
  // Event handlers
  on[EventName]?: ([parameters]) => void;
  
  // Styling props
  className?: string;
  style?: React.CSSProperties;
}
```

#### State Management
```typescript
// Internal state structure
interface [ComponentName]State {
  [stateName]: [type];
}

// State management approach
// [ ] useState for simple state
// [ ] useReducer for complex state
// [ ] Context for shared state
// [ ] External state management
```

#### Styling Implementation
```css
/* Component-specific styles */
.[component-name] {
  /* Base styles */
}

.[component-name]--[variant] {
  /* Variant styles */
}

.[component-name]__[element] {
  /* Element styles */
}

/* Responsive design */
@media (max-width: 768px) {
  .[component-name] {
    /* Mobile styles */
  }
}
```

### Accessibility Implementation
- [ ] **Keyboard Navigation**: All interactive elements are keyboard accessible
- [ ] **Screen Reader Support**: Proper ARIA labels and descriptions
- [ ] **Focus Management**: Clear focus indicators and logical tab order
- [ ] **Color Contrast**: Meets WCAG AA standards (4.5:1 minimum)
- [ ] **Text Scaling**: Remains usable at 200% zoom
- [ ] **Reduced Motion**: Respects prefers-reduced-motion setting

### Testing Strategy

#### Unit Tests
- [ ] Component renders correctly
- [ ] Props are handled properly
- [ ] Event handlers work as expected
- [ ] Edge cases are handled gracefully

#### Integration Tests
- [ ] Works properly within larger components
- [ ] State management integrates correctly
- [ ] Styling doesn't conflict with other components

#### Accessibility Tests
- [ ] Screen reader testing completed
- [ ] Keyboard navigation verified
- [ ] Color contrast validated
- [ ] Focus management tested

#### Performance Tests
- [ ] Rendering performance measured
- [ ] Memory usage evaluated
- [ ] Large dataset handling tested (if applicable)

---

## Documentation & Integration

### Usage Documentation
```typescript
// Basic usage example
import { [ComponentName] } from './[ComponentName]';

function ExampleUsage() {
  return (
    <[ComponentName]
      [requiredProp]={value}
      on[EventName]={(data) => handleEvent(data)}
    />
  );
}
```

### Integration Points
**Parent Components**: [List components that will use this component]  
**Child Components**: [List components this component will contain]  
**Context Dependencies**: [Any context providers this component needs]  
**Theme Integration**: [How this component integrates with the theme system]

### Pattern Library Addition
- [ ] **New Pattern Identified**: [What reusable pattern emerged?]
- [ ] **Pattern Documented**: Added to design pattern library
- [ ] **Usage Guidelines**: Created guidelines for when/how to use this pattern
- [ ] **Variations**: Documented possible variations of this pattern

---

## Results & Learnings

### Performance Metrics
**Rendering Time**: [Measured rendering performance]  
**Bundle Size Impact**: [How much did this add to bundle size?]  
**Memory Usage**: [Memory consumption under normal use]  
**User Interaction Response**: [How quickly does it respond to user input?]

### User Feedback
**Initial Reactions**: [First impressions from users]  
**Usability Issues**: [Any usability problems discovered]  
**Accessibility Feedback**: [Feedback from users with disabilities]  
**Suggestions**: [User suggestions for improvement]

### Development Experience
**Code Maintainability**: [How easy is this component to maintain?]  
**Testing Experience**: [Were tests easy to write and maintain?]  
**Documentation Quality**: [Is the component well-documented?]  
**Reusability**: [How easily can this be reused in other contexts?]

### Key Learnings
**Design Insights**: [What did we learn about component design?]  
**Technical Discoveries**: [New technical approaches or solutions]  
**Process Improvements**: [How can we improve the component design process?]  
**Accessibility Learnings**: [Accessibility insights gained]

### Future Opportunities
**Enhancement Ideas**: [Ideas for improving this component]  
**Related Components**: [Other components this work suggests we need]  
**Pattern Generalizations**: [How can patterns from this work be applied elsewhere?]  
**Performance Optimizations**: [Opportunities for performance improvements]

---

## Files Created
- [ ] `src/components/[ComponentName]/[ComponentName].tsx`
- [ ] `src/components/[ComponentName]/[ComponentName].module.css`
- [ ] `src/components/[ComponentName]/[ComponentName].test.tsx`
- [ ] `src/components/[ComponentName]/[ComponentName].stories.tsx` *(if using Storybook)*
- [ ] `src/components/[ComponentName]/index.ts`
- [ ] `docs/components/[ComponentName].md` *(usage documentation)*

## Quality Assurance Checklist
- [ ] **Code Review**: Code reviewed by team member
- [ ] **Design Review**: Design approved by design team
- [ ] **Accessibility Review**: Accessibility validated by accessibility expert
- [ ] **Performance Review**: Performance impact assessed
- [ ] **Documentation Review**: Documentation complete and accurate
- [ ] **Testing Review**: Test coverage meets requirements
- [ ] **Browser Testing**: Tested across target browsers
- [ ] **Device Testing**: Tested on mobile, tablet, and desktop

---

*Template based on successful component development practices*  
*Part of RdLn Design System - Follow ECI methodology for systematic component development*