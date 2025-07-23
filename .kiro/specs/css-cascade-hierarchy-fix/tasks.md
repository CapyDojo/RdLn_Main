# Implementation Plan

- [x] 1. Analyze current CSS cascade conflicts and create baseline





  - Create debugging script to identify specific cascade conflicts in Kyoto theme
  - Document current computed styles for glass panels, text elements, and hover states
  - Identify all selectors in glassmorphism.css that override Kyoto theme styles
  - Create specificity analysis report showing current hierarchy issues
  - _Requirements: 5.1, 5.2_

- [x] 2. Implement CSS custom properties optimization in Kyoto theme



  - Add theme-scoped CSS variables to html[data-theme="kyoto"] selector
  - Define --theme-glass-bg, --theme-glass-border, --theme-glass-hover-border variables
  - Define --theme-text-body, --theme-text-header, --theme-text-secondary variables
  - Test that CSS variables are properly scoped and accessible to child selectors
  - _Requirements: 5.1, 6.1_

- [x] 3. Fix glass panel base styling with enhanced specificity




  - Update html[data-theme="kyoto"] .glass-panel selector to use theme CSS variables
  - Ensure background uses rgba(var(--theme-glass-bg), var(--glass-panel)) pattern
  - Update border-color to use rgba(var(--theme-glass-border), var(--glass-focus))
  - Test that dark theme background overrides white base background from glassmorphism.css
  - _Requirements: 2.1, 2.2_


- [x] 4. Implement consolidated hover effects with proper specificity



  - Create single hover rule combining direct hover and programmatic hover states
  - Use html[data-theme="kyoto"] .glass-panel:hover selector with theme variables
  - Implement layered shadow effects using rgba(var(--theme-glass-hover-shadow), opacity)
  - Add transform: translateY(-2px) for subtle lift effect
  - Test both direct panel hover and hover-from-handle class application
  - _Requirements: 1.1, 1.2, 4.1, 4.2_

- [x] 5. Fix text hierarchy colors with comprehensive selectors



  - Create html[data-theme="kyoto"] .text-body selector using --theme-text-body variable
  - Add html[data-theme="kyoto"] .text-header selector using --theme-text-header variable
  - Include comprehensive selector coverage for textarea, input, and nested elements
  - Test that orange headers (#86efac) and peach body text (#f8b4b4) display correctly
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 6. Enhance layout-specific hover effects in current-layout.css
  - Update [data-theme="kyoto"] .layout-current .hover-from-handle selector
  - Use theme CSS variables for consistent color application
  - Implement stronger shadow effects for handle-triggered hover
  - Add specific rules for output panel handle hover edge cases
  - _Requirements: 1.3, 1.4, 4.3_

- [-] 7. Remove conflicting !important declarations from base styles

  - Identify !important declarations in glassmorphism.css that conflict with theme styles
  - Remove or replace with higher specificity selectors where appropriate
  - Ensure base styles still work for themes that don't override them
  - Test that removal doesn't break other themes' functionality
  - _Requirements: 5.3, 5.4_

- [ ] 8. Create comprehensive test suite for cascade hierarchy validation
  - Write automated test to verify theme styles override base styles
  - Create visual regression test for glass panel backgrounds and hover effects
  - Implement test for text color hierarchy across all text elements
  - Add performance test to ensure CSS changes don't impact rendering speed
  - _Requirements: 7.1, 7.2, 7.3, 8.4_

- [ ] 9. Validate handle hover mechanism functionality
  - Test that JavaScript correctly adds hover-from-handle class to panels
  - Verify CSS rules apply correctly when hover-from-handle class is present
  - Test both input panel handle hover and output panel handle hover
  - Ensure hover effects work consistently across different panel types
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 10. Document blueprint pattern for other themes
  - Create step-by-step guide for applying CSS hierarchy fixes to other themes
  - Document the CSS variable pattern and specificity enhancement strategy
  - Include color mapping process from TypeScript definitions to CSS variables
  - Create validation checklist for blueprint application success
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 11. Performance optimization and final validation
  - Measure CSS parsing performance before and after changes
  - Validate that theme switching works smoothly without visual glitches
  - Test all functionality across different browsers and devices
  - Confirm no regressions in existing theme functionality
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 12. Create blueprint application template
  - Extract reusable CSS patterns from fixed Kyoto theme
  - Create template CSS file with placeholder variables for other themes
  - Document the systematic approach for theme color mapping
  - Test template application on one additional theme as proof of concept
  - _Requirements: 6.2, 6.3, 6.4_