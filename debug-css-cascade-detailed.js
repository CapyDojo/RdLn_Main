// Detailed CSS Cascade Debug
// Find exactly which CSS rule is setting the white background

(function() {
  'use strict';
  
  console.log('🔍 DETAILED CSS CASCADE DEBUG');
  console.log('='.repeat(40));
  
  if (typeof document === 'undefined') {
    console.error('❌ Run in browser');
    return;
  }
  
  const glassPanels = document.querySelectorAll('.glass-panel');
  if (glassPanels.length === 0) {
    console.log('No glass panels found');
    return;
  }
  
  const testPanel = glassPanels[0];
  console.log(`Testing panel with classes: ${testPanel.className}`);
  
  // Get all stylesheets
  const stylesheets = Array.from(document.styleSheets);
  const matchingRules = [];
  
  stylesheets.forEach((stylesheet, sheetIndex) => {
    try {
      const rules = Array.from(stylesheet.cssRules || stylesheet.rules || []);
      rules.forEach((rule, ruleIndex) => {
        if (rule.selectorText && rule.style) {
          // Check if this rule matches our test panel
          try {
            if (testPanel.matches(rule.selectorText)) {
              // Check if this rule sets background
              const background = rule.style.getPropertyValue('background');
              const backgroundColor = rule.style.getPropertyValue('background-color');
              
              if (background || backgroundColor) {
                matchingRules.push({
                  selector: rule.selectorText,
                  background: background || backgroundColor,
                  priority: rule.style.getPropertyPriority('background') || rule.style.getPropertyPriority('background-color'),
                  stylesheet: stylesheet.href || 'inline',
                  sheetIndex,
                  ruleIndex
                });
              }
            }
          } catch (e) {
            // Ignore selector errors
          }
        }
      });
    } catch (e) {
      console.log(`Cannot access stylesheet ${sheetIndex}: ${e.message}`);
    }
  });
  
  console.log(`\nFound ${matchingRules.length} matching background rules:`);
  
  matchingRules.forEach((rule, index) => {
    console.log(`\n${index + 1}. ${rule.selector}`);
    console.log(`   Background: ${rule.background}`);
    console.log(`   Priority: ${rule.priority || 'normal'}`);
    console.log(`   File: ${rule.stylesheet}`);
    
    // Check if this is a white background rule
    if (rule.background.includes('255, 255, 255')) {
      console.log(`   🚨 WHITE BACKGROUND RULE - This might be the culprit!`);
    }
    
    // Check if this is a theme rule
    if (rule.selector.includes('data-theme="kyoto"')) {
      console.log(`   ✅ THEME RULE`);
    } else if (rule.selector.includes(':not([data-theme])')) {
      console.log(`   ⚠️ THEME-CONDITIONAL BASE RULE`);
    } else {
      console.log(`   ❌ UNCONDITIONAL BASE RULE - This should be theme-conditional!`);
    }
  });
  
  // Also check computed style
  const computedStyle = getComputedStyle(testPanel);
  const actualBackground = computedStyle.backgroundColor;
  
  console.log(`\nActual computed background: ${actualBackground}`);
  
  // Try to find which rule is winning
  console.log('\n🎯 WINNING RULE ANALYSIS:');
  
  // Check if there are any rules without theme conditions
  const unconditionalRules = matchingRules.filter(rule => 
    !rule.selector.includes(':not([data-theme])') && 
    !rule.selector.includes('[data-theme="kyoto"]') &&
    !rule.selector.includes('[data-theme=""]')
  );
  
  if (unconditionalRules.length > 0) {
    console.log(`Found ${unconditionalRules.length} unconditional rules that might be overriding theme:`);
    unconditionalRules.forEach(rule => {
      console.log(`  - ${rule.selector}: ${rule.background}`);
    });
  }
  
  // Check theme attribute
  const themeAttr = document.documentElement.getAttribute('data-theme');
  console.log(`\nTheme attribute: "${themeAttr}"`);
  
  // Test if :not([data-theme]) should match
  const shouldMatchNot = !themeAttr || themeAttr === '';
  console.log(`Should :not([data-theme]) match: ${shouldMatchNot}`);
  
})();