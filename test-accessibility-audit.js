// Accessibility Audit for Unified Filing Cabinet
// Tests focus management, keyboard navigation, and screen reader compatibility

console.log('🔍 ACCESSIBILITY AUDIT: Unified Filing Cabinet Components');

// Test 1: Focus Management and Visibility
console.log('\n=== FOCUS MANAGEMENT TEST ===');

// Find filing cabinet components
const tabElements = document.querySelectorAll('[class*="filing-cabinet-tab"]');
const panelElements = document.querySelectorAll('[class*="filing-cabinet-panel"]');
const buttons = document.querySelectorAll('button[aria-label*="filing cabinet"], button[title*="RdLn Memory"]');

console.log(`Found ${tabElements.length} tab elements`);
console.log(`Found ${panelElements.length} panel elements`);
console.log(`Found ${buttons.length} filing cabinet buttons`);

// Test focus visibility
buttons.forEach((button, i) => {
  console.log(`Button ${i + 1}:`, {
    hasAriaLabel: !!button.getAttribute('aria-label'),
    ariaLabel: button.getAttribute('aria-label'),
    hasTitle: !!button.getAttribute('title'),
    title: button.getAttribute('title'),
    disabled: button.disabled,
    tabIndex: button.tabIndex,
    focusable: button.tabIndex !== -1 && !button.disabled
  });
});

// Test 2: Keyboard Navigation
console.log('\n=== KEYBOARD NAVIGATION TEST ===');

// Check for keyboard event handlers
const elementsWithKeyHandlers = document.querySelectorAll('[onkeydown], [onkeyup], [onkeypress]');
console.log(`Elements with keyboard handlers: ${elementsWithKeyHandlers.length}`);

// Check for escape key handling
const escapeHandlers = Array.from(document.querySelectorAll('*')).filter(el => {
  const listeners = getEventListeners ? getEventListeners(el) : {};
  return listeners.keydown && listeners.keydown.some(l => 
    l.listener.toString().includes('Escape') || 
    l.listener.toString().includes('key === "Escape"')
  );
});
console.log(`Elements with escape key handlers: ${escapeHandlers.length}`);

// Test 3: ARIA Labels and Screen Reader Support
console.log('\n=== ARIA LABELS AND SCREEN READER TEST ===');

// Check ARIA attributes on filing cabinet elements
const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role]');
console.log(`Elements with ARIA attributes: ${ariaElements.length}`);

ariaElements.forEach((el, i) => {
  if (el.className.includes('filing-cabinet') || el.getAttribute('aria-label')?.includes('filing cabinet')) {
    console.log(`ARIA Element ${i + 1}:`, {
      tagName: el.tagName,
      ariaLabel: el.getAttribute('aria-label'),
      ariaLabelledby: el.getAttribute('aria-labelledby'),
      ariaDescribedby: el.getAttribute('aria-describedby'),
      role: el.getAttribute('role'),
      ariaHidden: el.getAttribute('aria-hidden'),
      className: el.className
    });
  }
});

// Test 4: Focus States and Visual Indicators
console.log('\n=== FOCUS STATES TEST ===');

// Check for focus styles
const focusableElements = document.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
console.log(`Total focusable elements: ${focusableElements.length}`);

// Test focus visibility by temporarily focusing elements
const testFocusVisibility = (element) => {
  element.focus();
  const computedStyle = window.getComputedStyle(element, ':focus');
  const hasFocusOutline = computedStyle.outline !== 'none' && computedStyle.outline !== '';
  const hasFocusRing = computedStyle.boxShadow.includes('ring') || 
                       element.className.includes('focus:ring') ||
                       element.className.includes('focus:outline');
  element.blur();
  
  return {
    hasFocusOutline,
    hasFocusRing,
    focusVisible: hasFocusOutline || hasFocusRing
  };
};

// Test filing cabinet specific elements
const filingCabinetFocusable = Array.from(focusableElements).filter(el => 
  el.className.includes('filing-cabinet') || 
  el.getAttribute('aria-label')?.includes('filing cabinet') ||
  el.getAttribute('title')?.includes('RdLn Memory')
);

console.log(`Filing cabinet focusable elements: ${filingCabinetFocusable.length}`);

filingCabinetFocusable.forEach((el, i) => {
  const focusTest = testFocusVisibility(el);
  console.log(`Focus Test ${i + 1}:`, {
    element: el.tagName,
    className: el.className.split(' ').filter(c => c.includes('filing-cabinet')).join(' '),
    ...focusTest
  });
});

// Test 5: Tab Order and Focus Trapping
console.log('\n=== TAB ORDER TEST ===');

const tabbableElements = Array.from(document.querySelectorAll(
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
)).filter(el => {
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
});

console.log(`Total tabbable elements: ${tabbableElements.length}`);

// Find filing cabinet elements in tab order
const filingCabinetInTabOrder = tabbableElements.filter(el => 
  el.className.includes('filing-cabinet') || 
  el.getAttribute('aria-label')?.includes('filing cabinet') ||
  el.getAttribute('title')?.includes('RdLn Memory')
);

console.log(`Filing cabinet elements in tab order: ${filingCabinetInTabOrder.length}`);

filingCabinetInTabOrder.forEach((el, i) => {
  const tabIndex = Array.from(tabbableElements).indexOf(el);
  console.log(`Tab Order ${i + 1}:`, {
    element: el.tagName,
    tabIndex: tabIndex + 1,
    explicitTabIndex: el.getAttribute('tabindex'),
    ariaLabel: el.getAttribute('aria-label'),
    title: el.getAttribute('title')
  });
});

// Test 6: Semantic Structure
console.log('\n=== SEMANTIC STRUCTURE TEST ===');

// Check for proper heading hierarchy
const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
const filingCabinetHeadings = Array.from(headings).filter(h => 
  h.textContent.includes('RdLn Memory') || 
  h.textContent.includes('Filing Cabinet') ||
  h.closest('[class*="filing-cabinet"]')
);

console.log(`Filing cabinet related headings: ${filingCabinetHeadings.length}`);

filingCabinetHeadings.forEach((h, i) => {
  console.log(`Heading ${i + 1}:`, {
    level: h.tagName,
    text: h.textContent.trim(),
    hasId: !!h.id,
    id: h.id
  });
});

// Check for proper landmarks
const landmarks = document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], [role="region"]');
console.log(`Total landmarks: ${landmarks.length}`);

// Test 7: Screen Reader Announcements
console.log('\n=== SCREEN READER ANNOUNCEMENTS TEST ===');

// Check for live regions
const liveRegions = document.querySelectorAll('[aria-live], [aria-atomic], [role="status"], [role="alert"]');
console.log(`Live regions found: ${liveRegions.length}`);

// Check for hidden content that should be announced
const srOnlyElements = document.querySelectorAll('.sr-only, .screen-reader-only, [class*="visually-hidden"]');
console.log(`Screen reader only elements: ${srOnlyElements.length}`);

// Test 8: Color Contrast and Visual Accessibility
console.log('\n=== VISUAL ACCESSIBILITY TEST ===');

// Check for reduced motion preferences
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
console.log(`User prefers reduced motion: ${prefersReducedMotion}`);

// Check for high contrast mode
const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
console.log(`User prefers high contrast: ${prefersHighContrast}`);

// Test glassmorphism accessibility
const glassElements = document.querySelectorAll('[class*="glass"], [class*="glassmorphism"]');
console.log(`Glassmorphism elements: ${glassElements.length}`);

// Check if glassmorphism affects readability
glassElements.forEach((el, i) => {
  if (el.className.includes('filing-cabinet')) {
    const style = window.getComputedStyle(el);
    console.log(`Glass Element ${i + 1}:`, {
      backdropFilter: style.backdropFilter,
      background: style.backgroundColor,
      opacity: style.opacity,
      hasText: el.textContent.trim().length > 0
    });
  }
});

// Summary
console.log('\n=== ACCESSIBILITY AUDIT SUMMARY ===');
console.log('✅ Tests completed. Review results above for accessibility compliance.');
console.log('🔍 Focus on elements that lack proper ARIA labels, focus indicators, or keyboard navigation.');
console.log('📱 Ensure all interactive elements are accessible via keyboard and screen readers.');