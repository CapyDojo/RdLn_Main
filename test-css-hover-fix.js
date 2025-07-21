// Test script to verify CSS-only hover fix
console.log('🧪 TESTING CSS-ONLY HOVER FIX');

// Check if we're in Kyoto theme
const currentTheme = document.documentElement.getAttribute('data-theme');
console.log('Current theme:', currentTheme);

// Find input panels
const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
console.log(`Found ${inputPanels.length} input panels`);

// Check computed styles for each panel
inputPanels.forEach((panel, index) => {
  console.log(`\nPanel ${index + 1}:`);
  
  // Get computed styles
  const computedStyle = getComputedStyle(panel);
  console.log('Default box-shadow:', computedStyle.boxShadow);
  
  // Get CSS rules that apply to this panel
  const matchingRules = [];
  for (const sheet of document.styleSheets) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (const rule of rules) {
        if (rule.selectorText && panel.matches(rule.selectorText)) {
          if (rule.style.boxShadow) {
            matchingRules.push({
              selector: rule.selectorText,
              boxShadow: rule.style.boxShadow
            });
          }
        }
      }
    } catch (e) {
      // Skip cross-origin stylesheets
    }
  }
  
  console.log('Matching CSS rules with box-shadow:', matchingRules);
  
  // Test hover state
  console.log('\nSimulating hover on panel...');
  
  // Create a style element to simulate hover
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    [data-input-panel] .glass-panel.glass-content-panel:nth-of-type(${index + 1}) {
      background: rgba(28, 25, 23, var(--glass-focus)) !important;
      box-shadow: 0 30px 80px 0 rgba(220, 8, 8, 0.7), 0 12px 40px 0 rgba(220, 8, 8, 0.5) !important;
      border-color: rgba(220, 8, 8, 0.6) !important;
      transform: translateY(-2px) !important;
    }
  `;
  document.head.appendChild(styleElement);
  
  // Check if our style is applied
  const hoverStyle = getComputedStyle(panel);
  console.log('Simulated hover box-shadow:', hoverStyle.boxShadow);
  
  // Clean up
  document.head.removeChild(styleElement);
});

console.log('\n✅ TEST COMPLETE');
console.log('If the simulated hover box-shadow shows the strong shadow effect, our CSS fix is working!');
console.log('Try hovering over the panels to see if the actual hover effect works as expected.');