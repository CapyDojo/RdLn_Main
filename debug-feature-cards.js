// CSS Debug Script for Feature Cards Text Color Issue
console.log('🔍 CSS DEBUG: Feature Cards Text Color in New York Theme');

// 1. Check if New York theme is active
const htmlElement = document.documentElement;
const currentTheme = htmlElement.getAttribute('data-theme');
console.log('Current theme:', currentTheme);

// 2. Find feature card elements
const featureCards = document.querySelectorAll('.glass-panel .text-theme-primary-800, .glass-panel .text-theme-neutral-600');
console.log(`Found ${featureCards.length} feature card text elements`);

// 3. Check each element's computed styles
featureCards.forEach((el, i) => {
  const computedStyle = window.getComputedStyle(el);
  console.log(`Element ${i + 1}:`, {
    className: el.className,
    textContent: el.textContent.trim().substring(0, 50) + '...',
    computedColor: computedStyle.color,
    appliedRules: 'Check DevTools for specificity'
  });
});

// 4. Check CSS variables
const rootStyles = window.getComputedStyle(htmlElement);
console.log('Theme CSS Variables:', {
  'theme-text-interactive': rootStyles.getPropertyValue('--theme-text-interactive'),
  'theme-text-secondary': rootStyles.getPropertyValue('--theme-text-secondary'),
  'theme-text-primary': rootStyles.getPropertyValue('--theme-text-primary')
});

// 5. Test if our selectors would work
const testSelectors = [
  'html[data-theme="new-york"] .text-theme-primary-800',
  'html[data-theme="new-york"] .text-theme-neutral-600'
];

testSelectors.forEach(selector => {
  const matches = document.querySelectorAll(selector);
  console.log(`Selector "${selector}" matches: ${matches.length} elements`);
});

// 6. Check for any overriding styles
console.log('🔧 Run this in DevTools to see all applied styles:');
console.log('document.querySelectorAll(".text-theme-primary-800, .text-theme-neutral-600").forEach(el => console.log(el, window.getComputedStyle(el).color))');