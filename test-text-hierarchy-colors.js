// Text Hierarchy Colors Test - Task 5 Validation
// Test that orange headers (#86efac) and peach body text (#f8b4b4) display correctly

(function() {
  'use strict';
  
  console.log('🧪 TEXT HIERARCHY COLORS TEST - TASK 5');
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
  
  // Helper function to convert hex to RGB for comparison
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  // Helper function to check if computed color matches expected hex
  const colorMatches = (computedColor, expectedHex) => {
    const expectedRgb = hexToRgb(expectedHex);
    if (!expectedRgb) return false;
    
    return computedColor.includes(expectedRgb.r.toString()) &&
           computedColor.includes(expectedRgb.g.toString()) &&
           computedColor.includes(expectedRgb.b.toString());
  };
  
  // Test 1: Header Colors (Green #86efac)
  console.log('\n📋 1. HEADER COLORS TEST (Green #86efac)');
  console.log('-'.repeat(40));
  
  const headerSelectors = ['h1', 'h2', 'h3', '.text-header'];
  let headerSuccessCount = 0;
  let headerFailureCount = 0;
  
  headerSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`\n${selector}: Found ${elements.length} elements`);
    
    Array.from(elements).slice(0, 3).forEach((element, index) => {
      const computedStyle = getComputedStyle(element);
      const actualColor = computedStyle.color;
      const isCorrectColor = colorMatches(actualColor, '#86efac');
      
      console.log(`  Element ${index + 1}:`);
      console.log(`    Computed Color: ${actualColor}`);
      console.log(`    Expected: #86efac (134, 239, 172)`);
      console.log(`    ✅ Correct: ${isCorrectColor}`);
      
      if (isCorrectColor) {
        headerSuccessCount++;
      } else {
        headerFailureCount++;
        console.log(`    🚨 HEADER COLOR MISMATCH`);
      }
    });
  });
  
  console.log(`\nHeader Summary:`);
  console.log(`  Correct header colors: ${headerSuccessCount}`);
  console.log(`  Incorrect header colors: ${headerFailureCount}`);
  
  // Test 2: Body Text Colors (Peach #f8b4b4)
  console.log('\n📝 2. BODY TEXT COLORS TEST (Peach #f8b4b4)');
  console.log('-'.repeat(40));
  
  const bodySelectors = ['.text-body', 'textarea', 'input', 'p'];
  let bodySuccessCount = 0;
  let bodyFailureCount = 0;
  
  bodySelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`\n${selector}: Found ${elements.length} elements`);
    
    Array.from(elements).slice(0, 2).forEach((element, index) => {
      const computedStyle = getComputedStyle(element);
      const actualColor = computedStyle.color;
      const isCorrectColor = colorMatches(actualColor, '#f8b4b4');
      
      console.log(`  Element ${index + 1}:`);
      console.log(`    Computed Color: ${actualColor}`);
      console.log(`    Expected: #f8b4b4 (248, 180, 180)`);
      console.log(`    ✅ Correct: ${isCorrectColor}`);
      
      if (isCorrectColor) {
        bodySuccessCount++;
      } else {
        bodyFailureCount++;
        console.log(`    🚨 BODY TEXT COLOR MISMATCH`);
      }
    });
  });
  
  console.log(`\nBody Text Summary:`);
  console.log(`  Correct body text colors: ${bodySuccessCount}`);
  console.log(`  Incorrect body text colors: ${bodyFailureCount}`);
  
  // Test 3: Secondary Text Colors (Wheat #fef7e6)
  console.log('\n📄 3. SECONDARY TEXT COLORS TEST (Wheat #fef7e6)');
  console.log('-'.repeat(40));
  
  const secondarySelectors = ['.text-secondary', '.text-theme-neutral-600', '.text-sm', 'small'];
  let secondarySuccessCount = 0;
  let secondaryFailureCount = 0;
  
  secondarySelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`\n${selector}: Found ${elements.length} elements`);
    
    Array.from(elements).slice(0, 2).forEach((element, index) => {
      const computedStyle = getComputedStyle(element);
      const actualColor = computedStyle.color;
      const isCorrectColor = colorMatches(actualColor, '#fef7e6');
      
      console.log(`  Element ${index + 1}:`);
      console.log(`    Computed Color: ${actualColor}`);
      console.log(`    Expected: #fef7e6 (254, 247, 230)`);
      console.log(`    ✅ Correct: ${isCorrectColor}`);
      
      if (isCorrectColor) {
        secondarySuccessCount++;
      } else {
        secondaryFailureCount++;
        console.log(`    🚨 SECONDARY TEXT COLOR MISMATCH`);
      }
    });
  });
  
  console.log(`\nSecondary Text Summary:`);
  console.log(`  Correct secondary text colors: ${secondarySuccessCount}`);
  console.log(`  Incorrect secondary text colors: ${secondaryFailureCount}`);
  
  // Test 4: Interactive Text Colors (Peach #f8b4b4)
  console.log('\n🔗 4. INTERACTIVE TEXT COLORS TEST (Peach #f8b4b4)');
  console.log('-'.repeat(40));
  
  const interactiveSelectors = ['.text-interactive', 'a', 'button:not(.glass-panel)'];
  let interactiveSuccessCount = 0;
  let interactiveFailureCount = 0;
  
  interactiveSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`\n${selector}: Found ${elements.length} elements`);
    
    Array.from(elements).slice(0, 2).forEach((element, index) => {
      const computedStyle = getComputedStyle(element);
      const actualColor = computedStyle.color;
      const isCorrectColor = colorMatches(actualColor, '#f8b4b4');
      
      console.log(`  Element ${index + 1}:`);
      console.log(`    Computed Color: ${actualColor}`);
      console.log(`    Expected: #f8b4b4 (248, 180, 180)`);
      console.log(`    ✅ Correct: ${isCorrectColor}`);
      
      if (isCorrectColor) {
        interactiveSuccessCount++;
      } else {
        interactiveFailureCount++;
        console.log(`    🚨 INTERACTIVE TEXT COLOR MISMATCH`);
      }
    });
  });
  
  console.log(`\nInteractive Text Summary:`);
  console.log(`  Correct interactive text colors: ${interactiveSuccessCount}`);
  console.log(`  Incorrect interactive text colors: ${interactiveFailureCount}`);
  
  // Test 5: Glass Panel Context Test
  console.log('\n🪟 5. GLASS PANEL CONTEXT TEST');
  console.log('-'.repeat(40));
  
  const glassPanels = document.querySelectorAll('.glass-panel');
  let glassPanelTextSuccessCount = 0;
  let glassPanelTextFailureCount = 0;
  
  console.log(`Found ${glassPanels.length} glass panels`);
  
  Array.from(glassPanels).slice(0, 3).forEach((panel, panelIndex) => {
    console.log(`\nGlass Panel ${panelIndex + 1}:`);
    
    // Test headers within glass panels
    const headers = panel.querySelectorAll('h1, h2, h3, .text-header');
    headers.forEach((header, headerIndex) => {
      const computedStyle = getComputedStyle(header);
      const actualColor = computedStyle.color;
      const isCorrectColor = colorMatches(actualColor, '#86efac');
      
      console.log(`  Header ${headerIndex + 1}: ${actualColor} - ✅ ${isCorrectColor}`);
      
      if (isCorrectColor) {
        glassPanelTextSuccessCount++;
      } else {
        glassPanelTextFailureCount++;
      }
    });
    
    // Test body text within glass panels
    const bodyTexts = panel.querySelectorAll('p, .text-body, textarea, input');
    Array.from(bodyTexts).slice(0, 2).forEach((text, textIndex) => {
      const computedStyle = getComputedStyle(text);
      const actualColor = computedStyle.color;
      const isCorrectColor = colorMatches(actualColor, '#f8b4b4');
      
      console.log(`  Body Text ${textIndex + 1}: ${actualColor} - ✅ ${isCorrectColor}`);
      
      if (isCorrectColor) {
        glassPanelTextSuccessCount++;
      } else {
        glassPanelTextFailureCount++;
      }
    });
  });
  
  console.log(`\nGlass Panel Text Summary:`);
  console.log(`  Correct glass panel text colors: ${glassPanelTextSuccessCount}`);
  console.log(`  Incorrect glass panel text colors: ${glassPanelTextFailureCount}`);
  
  // Test 6: Input/Output Panel Context Test
  console.log('\n📥📤 6. INPUT/OUTPUT PANEL CONTEXT TEST');
  console.log('-'.repeat(40));
  
  const inputPanels = document.querySelectorAll('[data-input-panel]');
  const outputPanels = document.querySelectorAll('[data-output-panel]');
  let panelContextSuccessCount = 0;
  let panelContextFailureCount = 0;
  
  console.log(`Found ${inputPanels.length} input panels and ${outputPanels.length} output panels`);
  
  [...inputPanels, ...outputPanels].forEach((panel, index) => {
    const panelType = panel.hasAttribute('data-input-panel') ? 'Input' : 'Output';
    console.log(`\n${panelType} Panel ${index + 1}:`);
    
    // Test text elements within panels
    const textElements = panel.querySelectorAll('h1, h2, h3, p, .text-body, textarea, input');
    Array.from(textElements).slice(0, 3).forEach((element, elementIndex) => {
      const computedStyle = getComputedStyle(element);
      const actualColor = computedStyle.color;
      
      // Determine expected color based on element type
      const isHeader = element.matches('h1, h2, h3, .text-header');
      const expectedColor = isHeader ? '#86efac' : '#f8b4b4';
      const isCorrectColor = colorMatches(actualColor, expectedColor);
      
      console.log(`  ${isHeader ? 'Header' : 'Text'} ${elementIndex + 1}: ${actualColor} - ✅ ${isCorrectColor}`);
      
      if (isCorrectColor) {
        panelContextSuccessCount++;
      } else {
        panelContextFailureCount++;
      }
    });
  });
  
  console.log(`\nPanel Context Summary:`);
  console.log(`  Correct panel context colors: ${panelContextSuccessCount}`);
  console.log(`  Incorrect panel context colors: ${panelContextFailureCount}`);
  
  // Test 7: CSS Variables Integration Test
  console.log('\n🔧 7. CSS VARIABLES INTEGRATION TEST');
  console.log('-'.repeat(40));
  
  const rootStyles = getComputedStyle(document.documentElement);
  
  const expectedVariables = {
    '--theme-text-body': '#f8b4b4',
    '--theme-text-header': '#86efac',
    '--theme-text-secondary': '#fef7e6',
    '--theme-text-interactive': '#f8b4b4',
    '--theme-text-success': '#bbf7d0',
    '--theme-text-primary': '#ee8f1c'
  };
  
  let variableSuccessCount = 0;
  let variableFailureCount = 0;
  
  Object.entries(expectedVariables).forEach(([variable, expectedValue]) => {
    const actualValue = rootStyles.getPropertyValue(variable).trim();
    const isCorrect = actualValue === expectedValue;
    
    console.log(`\n${variable}:`);
    console.log(`  Expected: ${expectedValue}`);
    console.log(`  Actual: "${actualValue}"`);
    console.log(`  ✅ Correct: ${isCorrect}`);
    
    if (isCorrect) {
      variableSuccessCount++;
    } else {
      variableFailureCount++;
      console.log(`  🚨 VARIABLE VALUE MISMATCH`);
    }
  });
  
  console.log(`\nCSS Variables Summary:`);
  console.log(`  Correct variables: ${variableSuccessCount}`);
  console.log(`  Incorrect variables: ${variableFailureCount}`);
  
  // Final Summary
  console.log('\n📊 FINAL SUMMARY - TASK 5 VALIDATION');
  console.log('-'.repeat(40));
  
  const allTests = [
    { name: 'Header Colors (Green)', passed: headerFailureCount === 0 && headerSuccessCount > 0 },
    { name: 'Body Text Colors (Peach)', passed: bodyFailureCount === 0 && bodySuccessCount > 0 },
    { name: 'Secondary Text Colors (Wheat)', passed: secondaryFailureCount === 0 && secondarySuccessCount > 0 },
    { name: 'Interactive Text Colors (Peach)', passed: interactiveFailureCount === 0 && interactiveSuccessCount > 0 },
    { name: 'Glass Panel Context', passed: glassPanelTextFailureCount === 0 && glassPanelTextSuccessCount > 0 },
    { name: 'Panel Context', passed: panelContextFailureCount === 0 && panelContextSuccessCount > 0 },
    { name: 'CSS Variables', passed: variableFailureCount === 0 && variableSuccessCount > 0 }
  ];
  
  const passedTests = allTests.filter(test => test.passed).length;
  const totalTests = allTests.length;
  
  console.log(`\nTest Results:`);
  allTests.forEach(test => {
    console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}`);
  });
  
  console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
  
  const taskSuccess = passedTests === totalTests;
  console.log(`\n🎯 TASK 5 SUCCESS: ${taskSuccess}`);
  
  if (taskSuccess) {
    console.log('\n🎉 All text hierarchy colors are working correctly!');
    console.log('✅ Headers show vibrant green (#86efac)');
    console.log('✅ Body text shows peach color (#f8b4b4)');
    console.log('✅ Secondary text shows wheat color (#fef7e6)');
    console.log('✅ Interactive elements use correct colors');
    console.log('✅ Glass panel contexts maintain color hierarchy');
    console.log('✅ Input/output panel contexts work correctly');
    console.log('✅ CSS variables are properly integrated');
  } else {
    console.log('\n⚠️ Some text colors need attention. Check the detailed results above.');
    console.log('🔧 Ensure comprehensive selectors cover all text contexts');
  }
  
})();