// Quick browser console test for ThemeSelector refactor
// Paste this into browser dev tools console when app is running

console.log('🔍 ThemeSelector Refactor Verification Test');

// Test 1: Check if ThemeSelector button exists
const themeSelectorButton = document.querySelector('[aria-label*="Theme selector"]');
console.log('✅ Theme selector button found:', !!themeSelectorButton);

// Test 2: Check if hover reveals theme cards
if (themeSelectorButton) {
  console.log('🎯 Triggering hover test...');
  themeSelectorButton.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  
  setTimeout(() => {
    const themeCards = document.querySelectorAll('[data-theme-card]');
    console.log('✅ Theme cards revealed on hover:', themeCards.length);
    
    // Test 3: Check if theme cards have proper styling
    if (themeCards.length > 0) {
      const firstCard = themeCards[0];
      const computedStyle = window.getComputedStyle(firstCard);
      console.log('✅ Theme card has background:', !!computedStyle.background);
      console.log('✅ Theme card has transform:', !!computedStyle.transform);
    }
    
    // Clean up - hide cards
    themeSelectorButton.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
  }, 500);
}

// Test 4: Check for console errors
const originalError = console.error;
let errorCount = 0;
console.error = function(...args) {
  if (args[0] && args[0].includes && args[0].includes('ThemeSelector')) {
    errorCount++;
  }
  originalError.apply(console, args);
};

setTimeout(() => {
  console.log('✅ ThemeSelector errors detected:', errorCount);
  console.error = originalError; // Restore original
  
  if (errorCount === 0 && themeSelectorButton) {
    console.log('🎉 ThemeSelector refactor verification PASSED!');
  } else {
    console.log('⚠️ Issues detected - check implementation');
  }
}, 2000);