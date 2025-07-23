// Test Simple Selectors with Theme-Conditional Base
// Now that base is theme-conditional, simple theme selectors should work

(function() {
  'use strict';
  
  console.log('🧪 SIMPLE SELECTORS TEST');
  console.log('='.repeat(30));
  
  if (typeof document === 'undefined') {
    console.error('❌ Run in browser');
    return;
  }
  
  const currentTheme = document.documentElement.getAttribute('data-theme');
  console.log(`Current theme: ${currentTheme}`);
  
  if (currentTheme !== 'kyoto') {
    console.log('⚠️ Switch to Kyoto theme for testing');
    return;
  }
  
  // Test glass panels
  const glassPanels = document.querySelectorAll('.glass-panel');
  console.log(`\nFound ${glassPanels.length} glass panels`);
  
  if (glassPanels.length > 0) {
    const testPanel = glassPanels[0];
    const computedStyle = getComputedStyle(testPanel);
    const background = computedStyle.backgroundColor;
    const border = computedStyle.borderColor;
    const boxShadow = computedStyle.boxShadow;
    
    console.log(`\nGlass Panel Test:`);
    console.log(`  Background: ${background}`);
    console.log(`  Border: ${border}`);
    console.log(`  Box Shadow: ${boxShadow}`);
    
    // Check for dark theme colors
    const isDarkBackground = background.includes('28') && background.includes('25') && background.includes('23');
    const isThemeBorder = border.includes('120') && border.includes('113') && border.includes('108');
    const isThemeShadow = boxShadow.includes('220') && boxShadow.includes('8');
    
    // Check NOT white base colors
    const isNotWhiteBackground = !background.includes('255, 255, 255');
    
    console.log(`  ✅ Dark theme background: ${isDarkBackground}`);
    console.log(`  ✅ Theme border: ${isThemeBorder}`);
    console.log(`  ✅ Theme shadow: ${isThemeShadow}`);
    console.log(`  ✅ Not white background: ${isNotWhiteBackground}`);
    
    const glassSuccess = isDarkBackground && isThemeBorder && isThemeShadow && isNotWhiteBackground;
    
    if (glassSuccess) {
      console.log(`  🎉 GLASS PANEL SUCCESS!`);
    } else {
      console.log(`  🚨 GLASS PANEL FAILURE`);
    }
  }
  
  // Test input fields
  const inputFields = document.querySelectorAll('.glass-input-field');
  console.log(`\nFound ${inputFields.length} input fields`);
  
  if (inputFields.length > 0) {
    const testInput = inputFields[0];
    const inputStyle = getComputedStyle(testInput);
    const inputBackground = inputStyle.backgroundColor;
    const inputBorder = inputStyle.borderColor;
    
    console.log(`\nInput Field Test:`);
    console.log(`  Background: ${inputBackground}`);
    console.log(`  Border: ${inputBorder}`);
    
    const isDarkInputBackground = inputBackground.includes('28') && inputBackground.includes('25') && inputBackground.includes('23');
    const isThemeInputBorder = inputBorder.includes('120') && inputBorder.includes('113') && inputBorder.includes('108');
    
    console.log(`  ✅ Dark theme background: ${isDarkInputBackground}`);
    console.log(`  ✅ Theme border: ${isThemeInputBorder}`);
    
    const inputSuccess = isDarkInputBackground && isThemeInputBorder;
    
    if (inputSuccess) {
      console.log(`  🎉 INPUT FIELD SUCCESS!`);
    } else {
      console.log(`  🚨 INPUT FIELD FAILURE`);
    }
  }
  
  console.log('\n🏗️ ARCHITECTURE SUMMARY:');
  console.log('• Base styles: Theme-conditional (:not([data-theme]))');
  console.log('• Theme styles: Simple selectors (html[data-theme="kyoto"])');
  console.log('• Result: Clean CSS cascade without complexity');
  
})();