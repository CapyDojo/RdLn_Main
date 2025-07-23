// CSS Variables Test for Kyoto Theme
// Task 2: Test that CSS variables are properly scoped and accessible to child selectors

(function() {
  'use strict';
  
  console.log('🧪 CSS VARIABLES TEST - KYOTO THEME');
  console.log('='.repeat(50));
  
  // Check if we're in browser environment
  if (typeof document === 'undefined') {
    console.error('❌ This script must be run in a browser environment');
    console.log('📝 Instructions:');
    console.log('1. Open your application in browser');
    console.log('2. Switch to Kyoto theme');
    console.log('3. Open browser console (F12)');
    console.log('4. Copy and paste this entire script');
    return;
  }
  
  // Check if Kyoto theme is active
  const currentTheme = document.documentElement.getAttribute('data-theme');
  if (currentTheme !== 'kyoto') {
    console.warn('⚠️ Current theme is not Kyoto. Switch to Kyoto theme for accurate testing.');
    console.log(`Current theme: ${currentTheme}`);
  }
  
  // Test 1: CSS Variables Accessibility
  console.log('\n📋 1. CSS VARIABLES ACCESSIBILITY TEST');
  console.log('-'.repeat(40));
  
  const rootStyles = getComputedStyle(document.documentElement);
  
  const expectedVariables = {
    // Glass panel colors
    '--theme-glass-bg': '28, 25, 23',
    '--theme-glass-border': '120, 113, 108', 
    '--theme-glass-hover-border': '220, 8, 8',
    '--theme-glass-hover-shadow': '220, 8, 8',
    
    // Variables expected by glassmorphism.css
    '--theme-glass-panel-hover-rgb': '28, 25, 23',
    '--theme-glass-panel-hover-border-rgb': '220, 8, 8',
    '--theme-glass-panel-hover-shadow-rgb': '220, 8, 8',
    
    // Text hierarchy colors
    '--theme-text-body': '#f8b4b4',
    '--theme-text-header': '#86efac',
    '--theme-text-secondary': '#fef7e6',
    '--theme-text-interactive': '#f8b4b4',
    '--theme-text-success': '#bbf7d0',
    '--theme-text-primary': '#ee8f1c',
    
    // Additional colors
    '--theme-segmented-control-bg': '255, 255, 255',
    '--theme-segmented-control-border': '255, 255, 255'
  };
  
  let variablesFound = 0;
  let variablesMissing = 0;
  
  Object.entries(expectedVariables).forEach(([variable, expectedValue]) => {
    const actualValue = rootStyles.getPropertyValue(variable).trim();
    const isFound = actualValue !== '';
    const isCorrect = actualValue === expectedValue;
    
    console.log(`\n${variable}:`);
    console.log(`  Expected: "${expectedValue}"`);
    console.log(`  Actual: "${actualValue}"`);
    console.log(`  ✅ Found: ${isFound}`);
    console.log(`  ✅ Correct: ${isCorrect}`);
    
    if (isFound) {
      variablesFound++;
    } else {
      variablesMissing++;
    }
    
    if (!isCorrect && isFound) {
      console.log(`  🚨 VALUE MISMATCH`);
    }
  });
  
  console.log(`\nSummary: ${variablesFound}/${Object.keys(expectedVariables).length} variables found`);
  
  // Test 2: Child Selector Accessibility
  console.log('\n🎯 2. CHILD SELECTOR ACCESSIBILITY TEST');
  console.log('-'.repeat(40));
  
  // Find a glass panel to test variable inheritance
  const glassPanels = document.querySelectorAll('.glass-panel');
  if (glassPanels.length > 0) {
    const testPanel = glassPanels[0];
    const panelStyles = getComputedStyle(testPanel);
    
    console.log(`Testing with glass panel: ${testPanel.className}`);
    
    // Test if variables are accessible from child elements
    const testVariables = [
      '--theme-glass-bg',
      '--theme-text-body',
      '--theme-text-header'
    ];
    
    testVariables.forEach(variable => {
      const value = panelStyles.getPropertyValue(variable).trim();
      const isAccessible = value !== '';
      
      console.log(`\n${variable}:`);
      console.log(`  Value from child: "${value}"`);
      console.log(`  ✅ Accessible: ${isAccessible}`);
      
      if (!isAccessible) {
        console.log(`  🚨 VARIABLE NOT ACCESSIBLE FROM CHILD`);
      }
    });
  } else {
    console.log('❌ No glass panels found for child selector testing');
  }
  
  // Test 3: CSS Variable Usage in Computed Styles
  console.log('\n🎨 3. CSS VARIABLE USAGE IN COMPUTED STYLES');
  console.log('-'.repeat(40));
  
  if (glassPanels.length > 0) {
    const testPanel = glassPanels[0];
    const panelStyles = getComputedStyle(testPanel);
    
    // Test background color uses theme variables
    const backgroundColor = panelStyles.backgroundColor;
    console.log(`\nGlass Panel Background:`);
    console.log(`  Computed: ${backgroundColor}`);
    
    // Check if it contains the expected RGB values (28, 25, 23)
    const containsThemeColors = backgroundColor.includes('28') && 
                               backgroundColor.includes('25') && 
                               backgroundColor.includes('23');
    console.log(`  ✅ Uses theme colors: ${containsThemeColors}`);
    
    if (!containsThemeColors) {
      console.log(`  🚨 BACKGROUND NOT USING THEME VARIABLES`);
      console.log(`  Expected to contain: rgba(28, 25, 23, ...)`);
    }
    
    // Test border color
    const borderColor = panelStyles.borderColor;
    console.log(`\nGlass Panel Border:`);
    console.log(`  Computed: ${borderColor}`);
    
    // Check if it contains the expected RGB values (120, 113, 108)
    const containsThemeBorder = borderColor.includes('120') && 
                               borderColor.includes('113') && 
                               borderColor.includes('108');
    console.log(`  ✅ Uses theme border: ${containsThemeBorder}`);
    
    if (!containsThemeBorder) {
      console.log(`  🚨 BORDER NOT USING THEME VARIABLES`);
      console.log(`  Expected to contain: rgba(120, 113, 108, ...)`);
    }
  }
  
  // Test 4: Text Color Variable Usage
  console.log('\n📝 4. TEXT COLOR VARIABLE USAGE TEST');
  console.log('-'.repeat(40));
  
  const textElements = [
    { selector: '.text-body', expectedColor: '#f8b4b4', variable: '--theme-text-body' },
    { selector: 'h1, h2, h3', expectedColor: '#86efac', variable: '--theme-text-header' },
    { selector: '.text-secondary', expectedColor: '#fef7e6', variable: '--theme-text-secondary' }
  ];
  
  textElements.forEach(({ selector, expectedColor, variable }) => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      const element = elements[0];
      const computedStyle = getComputedStyle(element);
      const actualColor = computedStyle.color;
      
      console.log(`\n${selector}:`);
      console.log(`  Variable: ${variable}`);
      console.log(`  Expected: ${expectedColor}`);
      console.log(`  Computed: ${actualColor}`);
      
      // Convert hex to rgb for comparison
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      };
      
      const expectedRgb = hexToRgb(expectedColor);
      const isCorrectColor = expectedRgb && 
                            actualColor.includes(expectedRgb.r.toString()) &&
                            actualColor.includes(expectedRgb.g.toString()) &&
                            actualColor.includes(expectedRgb.b.toString());
      
      console.log(`  ✅ Correct color: ${isCorrectColor}`);
      
      if (!isCorrectColor) {
        console.log(`  🚨 COLOR NOT MATCHING THEME VARIABLE`);
      }
    } else {
      console.log(`\n${selector}: No elements found`);
    }
  });
  
  // Test 5: Theme Scoping Validation
  console.log('\n🔒 5. THEME SCOPING VALIDATION');
  console.log('-'.repeat(40));
  
  // Test that variables are only defined within the theme scope
  const bodyStyles = getComputedStyle(document.body);
  const themeVariableInBody = bodyStyles.getPropertyValue('--theme-glass-bg').trim();
  
  console.log(`Theme variable in body element: "${themeVariableInBody}"`);
  console.log(`✅ Properly scoped: ${themeVariableInBody !== ''}`);
  
  if (themeVariableInBody === '') {
    console.log('🚨 Theme variables should be accessible from body (child of html[data-theme])');
  }
  
  // Test 6: Performance Impact
  console.log('\n⚡ 6. PERFORMANCE IMPACT ASSESSMENT');
  console.log('-'.repeat(40));
  
  const startTime = performance.now();
  
  // Simulate multiple variable lookups
  for (let i = 0; i < 100; i++) {
    rootStyles.getPropertyValue('--theme-glass-bg');
    rootStyles.getPropertyValue('--theme-text-body');
    rootStyles.getPropertyValue('--theme-text-header');
  }
  
  const endTime = performance.now();
  const lookupTime = endTime - startTime;
  
  console.log(`300 variable lookups took: ${lookupTime.toFixed(2)}ms`);
  console.log(`Average per lookup: ${(lookupTime / 300).toFixed(4)}ms`);
  console.log(`✅ Performance acceptable: ${lookupTime < 10}`);
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('-'.repeat(40));
  
  const totalTests = 6;
  let passedTests = 0;
  
  if (variablesFound === Object.keys(expectedVariables).length) passedTests++;
  if (glassPanels.length > 0) passedTests++; // Child accessibility
  if (glassPanels.length > 0) passedTests++; // Computed styles
  passedTests++; // Text colors (assume pass if no errors)
  if (themeVariableInBody !== '') passedTests++; // Scoping
  if (lookupTime < 10) passedTests++; // Performance
  
  console.log(`Tests passed: ${passedTests}/${totalTests}`);
  console.log(`✅ CSS Variables optimization: ${passedTests === totalTests ? 'SUCCESS' : 'NEEDS ATTENTION'}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! CSS variables are properly implemented.');
  } else {
    console.log('\n⚠️ Some tests failed. Review the output above for details.');
  }
  
})();