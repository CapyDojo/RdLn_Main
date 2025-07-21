// Check what Tailwind's shadow-lg class generates
console.log('🔍 CHECKING TAILWIND SHADOW-LG');

const testElement = document.createElement('div');
testElement.className = 'shadow-lg';
document.body.appendChild(testElement);

const computedStyle = getComputedStyle(testElement);
console.log('Tailwind shadow-lg box-shadow:', computedStyle.boxShadow);

// Check if it has important
const cssRules = Array.from(document.styleSheets)
  .flatMap(sheet => {
    try {
      return Array.from(sheet.cssRules || []);
    } catch (e) {
      return [];
    }
  })
  .filter(rule => rule.selectorText && rule.selectorText.includes('shadow-lg'));

console.log('Found shadow-lg CSS rules:', cssRules.length);
cssRules.forEach((rule, index) => {
  console.log(`Rule ${index + 1}:`, rule.cssText);
});

document.body.removeChild(testElement);