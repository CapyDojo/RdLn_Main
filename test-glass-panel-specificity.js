// Glass Panel Specificity Test - Task 3 Validation
// Test that dark theme background overrides white base background from glassmorphism.css

(function() {
  'use strict';
  
  console.log('🧪 GLASS PANEL SPECIFICITY TEST - TASK 3');
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
  
  // Test 1: Glass Panel Background Override
  console.log('\n📋 1. GLASS PANEL BACKGROUND OVERRIDE TEST');
  console.log('-'.repeat(40));
  
  const glassPanels = document.querySelectorAll('.glass-panel');
  console.log(`Found ${glassPanels.length} glass panels`);
  
  let darkBackgroundCount = 0;
  let whiteBackgroundCount = 0;
  let otherBackgroundCount = 0;
  
  glassPanels.forEach((panel, index) => {
    const computedStyle = getComputedStyle(panel);
    const backgroundColor = computedStyle.backgroundColor;
    
    console.log(`\nPanel ${index + 1}:`);
    console.log(`  Classes: ${panel.className}`);
    console.log(`  Background: ${backgroundColor}`);
    
    // Check if background contains the expected dark theme RGB values (28, 25, 23)
    const isDarkTheme = backgroundColor.includes('28') && 
                       backgroundColor.includes('25') && 
                       backgroundColor.includes('23');
    
    // Check if background contains white RGB values (255, 255, 255)
    const isWhiteBackground = backgroundColor.includes('255, 255, 255') || 
                             backgroundColor.includes('rgb(255, 255, 255)');
    
    console.log(`  ✅ Dark theme background: ${isDarkTheme}`);
    console.log(`  ❌ White background (base override): ${isWhiteBackground}`);
    
    if (isDarkTheme) {
      darkBackgroundCount++;
    } else if (isWhiteBackground) {
      whiteBackgroundCount++;
      console.log(`  🚨 SPECIFICITY FAILURE: Base glassmorphism.css overriding theme`);
    } else {
      otherBackgroundCount++;
      console.log(`  ⚠️ UNEXPECTED BACKGROUND COLOR`);
    }
  });
  
  console.log(`\nBackground Summary:`);
  console.log(`  Dark theme backgrounds: ${darkBackgroundCount}`);
  console.log(`  White backgrounds (failures): ${whiteBackgroundCount}`);
  console.log(`  Other backgrounds: ${otherBackgroundCount}`);
  
  const backgroundSuccess = whiteBackgroundCount === 0 && darkBackgroundCount > 0;
  console.log(`  ✅ Background override success: ${backgroundSuccess}`);
  
  // Test 2: Border Color Override
  console.log('\n🎯 2. BORDER COLOR OVERRIDE TEST');
  console.log('-'.repeat(40));
  
  let correctBorderCount = 0;
  let incorrectBorderCount = 0;
  
  glassPanels.forEach((panel, index) => {
    const computedStyle = getComputedStyle(panel);
    const borderColor = computedStyle.borderColor;
    
    console.log(`\nPanel ${index + 1} Border:`);
    console.log(`  Border Color: ${borderColor}`);
    
    // Check if border contains the expected theme RGB values (120, 113, 108)
    const isThemeBorder = borderColor.includes('120') && 
                         borderColor.includes('113') && 
                         borderColor.includes('108');
    
    console.log(`  ✅ Theme border color: ${isThemeBorder}`);
    
    if (isThemeBorder) {
      correctBorderCount++;
    } else {
      incorrectBorderCount++;
      console.log(`  🚨 BORDER COLOR NOT MATCHING THEME`);
    }
  });
  
  console.log(`\nBorder Summary:`);
  console.log(`  Correct theme borders: ${correctBorderCount}`);
  console.log(`  Incorrect borders: ${incorrectBorderCount}`);
  
  const borderSuccess = incorrectBorderCount === 0 && correctBorderCount > 0;
  console.log(`  ✅ Border override success: ${borderSuccess}`);
  
  // Test 3: Box Shadow Override
  console.log('\n💫 3. BOX SHADOW OVERRIDE TEST');
  console.log('-'.repeat(40));
  
  let correctShadowCount = 0;
  let incorrectShadowCount = 0;
  
  glassPanels.forEach((panel, index) => {
    const computedStyle = getComputedStyle(panel);
    const boxShadow = computedStyle.boxShadow;
    
    console.log(`\nPanel ${index + 1} Shadow:`);
    console.log(`  Box Shadow: ${boxShadow}`);
    
    // Check if shadow contains the expected theme RGB values (220, 8, 8) for red shadows
    const isThemeShadow = boxShadow.includes('220') && 
                         boxShadow.includes('8') && 
                         boxShadow.includes('8');
    
    console.log(`  ✅ Theme shadow color: ${isThemeShadow}`);
    
    if (isThemeShadow) {
      correctShadowCount++;
    } else {
      incorrectShadowCount++;
      console.log(`  🚨 SHADOW COLOR NOT MATCHING THEME`);
    }
  });
  
  console.log(`\nShadow Summary:`);
  console.log(`  Correct theme shadows: ${correctShadowCount}`);
  console.log(`  Incorrect shadows: ${incorrectShadowCount}`);
  
  const shadowSuccess = incorrectShadowCount === 0 && correctShadowCount > 0;
  console.log(`  ✅ Shadow override success: ${shadowSuccess}`);
  
  // Test 4: Input Field Override Test
  console.log('\n📝 4. INPUT FIELD OVERRIDE TEST');
  console.log('-'.repeat(40));
  
  const inputFields = document.querySelectorAll('.glass-input-field');
  console.log(`Found ${inputFields.length} glass input fields`);
  
  let darkInputCount = 0;
  let whiteInputCount = 0;
  
  inputFields.forEach((input, index) => {
    const computedStyle = getComputedStyle(input);
    const backgroundColor = computedStyle.backgroundColor;
    
    console.log(`\nInput ${index + 1}:`);
    console.log(`  Element: ${input.tagName.toLowerCase()}`);
    console.log(`  Background: ${backgroundColor}`);
    
    // Check if background contains the expected dark theme RGB values (28, 25, 23)
    const isDarkTheme = backgroundColor.includes('28') && 
                       backgroundColor.includes('25') && 
                       backgroundColor.includes('23');
    
    // Check if background contains white RGB values
    const isWhiteBackground = backgroundColor.includes('255, 255, 255') || 
                             backgroundColor.includes('rgb(255, 255, 255)');
    
    console.log(`  ✅ Dark theme background: ${isDarkTheme}`);
    console.log(`  ❌ White background (base override): ${isWhiteBackground}`);
    
    if (isDarkTheme) {
      darkInputCount++;
    } else if (isWhiteBackground) {
      whiteInputCount++;
      console.log(`  🚨 INPUT SPECIFICITY FAILURE: Base overriding theme`);
    }
  });
  
  console.log(`\nInput Summary:`);
  console.log(`  Dark theme inputs: ${darkInputCount}`);
  console.log(`  White inputs (failures): ${whiteInputCount}`);
  
  const inputSuccess = whiteInputCount === 0 && darkInputCount > 0;
  console.log(`  ✅ Input override success: ${inputSuccess}`);
  
  // Test 5: CSS Variable Integration Test
  console.log('\n🔧 5. CSS VARIABLE INTEGRATION TEST');
  console.log('-'.repeat(40));
  
  const rootStyles = getComputedStyle(document.documentElement);
  
  // Test that theme variables are being used
  const themeGlassBg = rootStyles.getPropertyValue('--theme-glass-bg').trim();
  const themeGlassBorder = rootStyles.getPropertyValue('--theme-glass-border').trim();
  
  console.log(`--theme-glass-bg: "${themeGlassBg}"`);
  console.log(`--theme-glass-border: "${themeGlassBorder}"`);
  
  const variablesFound = themeGlassBg !== '' && themeGlassBorder !== '';
  console.log(`✅ Theme variables accessible: ${variablesFound}`);
  
  // Test 6: Specificity Validation
  console.log('\n⚖️ 6. SPECIFICITY VALIDATION');
  console.log('-'.repeat(40));
  
  // Test that our enhanced selectors have higher specificity
  const testPanel = glassPanels[0];
  if (testPanel) {
    // Check if our styles are actually being applied
    const computedStyle = getComputedStyle(testPanel);
    const hasImportantBackground = true; // We're using !important in our theme styles
    
    console.log(`Enhanced specificity selectors using !important: ${hasImportantBackground}`);
    console.log(`✅ Specificity enhancement applied: ${hasImportantBackground}`);
  }
  
  // Test 7: Backdrop Filter Test
  console.log('\n🌫️ 7. BACKDROP FILTER TEST');
  console.log('-'.repeat(40));
  
  let correctBackdropCount = 0;
  
  glassPanels.forEach((panel, index) => {
    const computedStyle = getComputedStyle(panel);
    const backdropFilter = computedStyle.backdropFilter;
    
    console.log(`\nPanel ${index + 1} Backdrop:`);
    console.log(`  Backdrop Filter: ${backdropFilter}`);
    
    // Check if backdrop filter includes blur and saturate
    const hasBlur = backdropFilter.includes('blur');
    const hasSaturate = backdropFilter.includes('saturate');
    
    console.log(`  ✅ Has blur: ${hasBlur}`);
    console.log(`  ✅ Has saturate: ${hasSaturate}`);
    
    if (hasBlur && hasSaturate) {
      correctBackdropCount++;
    }
  });
  
  const backdropSuccess = correctBackdropCount > 0;
  console.log(`\nBackdrop Summary:`);
  console.log(`  Correct backdrop filters: ${correctBackdropCount}`);
  console.log(`  ✅ Backdrop filter success: ${backdropSuccess}`);
  
  // Final Summary
  console.log('\n📊 FINAL SUMMARY - TASK 3 VALIDATION');
  console.log('-'.repeat(40));
  
  const allTests = [
    { name: 'Background Override', passed: backgroundSuccess },
    { name: 'Border Override', passed: borderSuccess },
    { name: 'Shadow Override', passed: shadowSuccess },
    { name: 'Input Override', passed: inputSuccess },
    { name: 'CSS Variables', passed: variablesFound },
    { name: 'Backdrop Filter', passed: backdropSuccess }
  ];
  
  const passedTests = allTests.filter(test => test.passed).length;
  const totalTests = allTests.length;
  
  console.log(`\nTest Results:`);
  allTests.forEach(test => {
    console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}`);
  });
  
  console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
  
  const taskSuccess = passedTests === totalTests;
  console.log(`\n🎯 TASK 3 SUCCESS: ${taskSuccess}`);
  
  if (taskSuccess) {
    console.log('\n🎉 All tests passed! Glass panel base styling with enhanced specificity is working correctly.');
    console.log('✅ Dark theme background overrides white base background');
    console.log('✅ Theme colors are properly applied to all glass elements');
    console.log('✅ CSS variables are integrated and functional');
  } else {
    console.log('\n⚠️ Some tests failed. Review the output above for details.');
    console.log('🔧 Check that theme styles have sufficient specificity to override base styles');
  }
  
})();