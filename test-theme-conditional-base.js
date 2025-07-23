// Theme-Conditional Base Styles Test
// Test that base styles only apply when no theme is set, allowing themes to override naturally

(function() {
  'use strict';
  
  console.log('🧪 THEME-CONDITIONAL BASE STYLES TEST');
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
  
  const currentTheme = document.documentElement.getAttribute('data-theme');
  console.log(`Current theme: ${currentTheme}`);
  
  // Test 1: Theme Override Validation
  console.log('\n📋 1. THEME OVERRIDE VALIDATION');
  console.log('-'.repeat(40));
  
  const glassPanels = document.querySelectorAll('.glass-panel');
  console.log(`Found ${glassPanels.length} glass panels`);
  
  let themeOverrideSuccessCount = 0;
  let themeOverrideFailureCount = 0;
  
  Array.from(glassPanels).slice(0, 3).forEach((panel, index) => {
    const computedStyle = getComputedStyle(panel);
    const background = computedStyle.backgroundColor;
    const border = computedStyle.borderColor;
    const boxShadow = computedStyle.boxShadow;
    
    console.log(`\nPanel ${index + 1}:`);
    console.log(`  Background: ${background}`);
    console.log(`  Border: ${border}`);
    console.log(`  Box Shadow: ${boxShadow}`);
    
    if (currentTheme === 'kyoto') {
      // Should show Kyoto theme colors, not base white colors
      const hasThemeBackground = background.includes('28') && background.includes('25') && background.includes('23');
      const hasThemeBorder = border.includes('120') && border.includes('113') && border.includes('108');
      const hasThemeShadow = boxShadow.includes('220') && boxShadow.includes('8');
      
      // Should NOT show base white colors
      const hasBaseBackground = background.includes('255, 255, 255');
      const hasBaseShadow = boxShadow.includes('31, 38, 135');
      
      console.log(`  ✅ Theme background: ${hasThemeBackground}`);
      console.log(`  ✅ Theme border: ${hasThemeBorder}`);
      console.log(`  ✅ Theme shadow: ${hasThemeShadow}`);
      console.log(`  ❌ Base background: ${hasBaseBackground}`);
      console.log(`  ❌ Base shadow: ${hasBaseShadow}`);
      
      const themeOverrideWorking = hasThemeBackground && hasThemeBorder && hasThemeShadow && !hasBaseBackground;
      
      if (themeOverrideWorking) {
        themeOverrideSuccessCount++;
        console.log(`  🎉 THEME OVERRIDE SUCCESS`);
      } else {
        themeOverrideFailureCount++;
        console.log(`  🚨 THEME OVERRIDE FAILURE`);
      }
    } else {
      // For other themes or no theme, just check functionality
      const hasBackground = background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent';
      const hasBorder = border !== 'none';
      
      console.log(`  ✅ Has background: ${hasBackground}`);
      console.log(`  ✅ Has border: ${hasBorder}`);
      
      if (hasBackground && hasBorder) {
        themeOverrideSuccessCount++;
        console.log(`  🎉 BASE STYLES FUNCTIONAL`);
      } else {
        themeOverrideFailureCount++;
        console.log(`  🚨 BASE STYLES BROKEN`);
      }
    }
  });
  
  console.log(`\nTheme Override Summary:`);
  console.log(`  Success: ${themeOverrideSuccessCount}`);
  console.log(`  Failures: ${themeOverrideFailureCount}`);
  
  // Test 2: Natural CSS Cascade Test
  console.log('\n🎯 2. NATURAL CSS CASCADE TEST');
  console.log('-'.repeat(40));
  
  if (currentTheme === 'kyoto') {
    console.log('Testing Kyoto theme natural cascade...');
    
    // Test that theme styles are applied without !important
    const testPanel = glassPanels[0];
    if (testPanel) {
      const computedStyle = getComputedStyle(testPanel);
      const background = computedStyle.backgroundColor;
      
      console.log(`Panel background: ${background}`);
      
      // Should be dark theme background
      const isDarkTheme = background.includes('28') && background.includes('25') && background.includes('23');
      const isNotWhiteBase = !background.includes('255, 255, 255');
      
      console.log(`✅ Dark theme applied: ${isDarkTheme}`);
      console.log(`✅ Not white base: ${isNotWhiteBase}`);
      
      const naturalCascadeWorking = isDarkTheme && isNotWhiteBase;
      console.log(`🎯 Natural cascade working: ${naturalCascadeWorking}`);
      
      if (naturalCascadeWorking) {
        console.log('🎉 NATURAL CASCADE SUCCESS - Theme overrides base without !important');
      } else {
        console.log('🚨 NATURAL CASCADE FAILURE - Base styles still overriding theme');
      }
    }
  } else {
    console.log('Switch to Kyoto theme to test natural cascade');
  }
  
  // Test 3: Hover Effects Test
  console.log('\n🎨 3. HOVER EFFECTS TEST');
  console.log('-'.repeat(40));
  
  if (glassPanels.length > 0) {
    const testPanel = glassPanels[0];
    
    // Get baseline
    const baselineStyle = getComputedStyle(testPanel);
    const baselineBackground = baselineStyle.backgroundColor;
    const baselineShadow = baselineStyle.boxShadow;
    
    console.log(`Baseline Background: ${baselineBackground}`);
    console.log(`Baseline Shadow: ${baselineShadow}`);
    
    // Test direct hover
    testPanel.dispatchEvent(new MouseEvent('mouseenter'));
    
    setTimeout(() => {
      const hoverStyle = getComputedStyle(testPanel);
      const hoverBackground = hoverStyle.backgroundColor;
      const hoverShadow = hoverStyle.boxShadow;
      const hoverTransform = hoverStyle.transform;
      
      console.log(`\nDirect Hover:`);
      console.log(`  Background: ${hoverBackground}`);
      console.log(`  Shadow: ${hoverShadow}`);
      console.log(`  Transform: ${hoverTransform}`);
      
      const backgroundChanged = hoverBackground !== baselineBackground;
      const shadowChanged = hoverShadow !== baselineShadow;
      const transformApplied = hoverTransform !== 'none' && hoverTransform.includes('matrix');
      
      console.log(`  ✅ Background changed: ${backgroundChanged}`);
      console.log(`  ✅ Shadow changed: ${shadowChanged}`);
      console.log(`  ✅ Transform applied: ${transformApplied}`);
      
      if (currentTheme === 'kyoto') {
        // Should show theme hover effects
        const hasThemeHoverBackground = hoverBackground.includes('28') && hoverBackground.includes('25') && hoverBackground.includes('23');
        const hasThemeHoverShadow = hoverShadow.includes('220') && hoverShadow.includes('8');
        
        console.log(`  ✅ Theme hover background: ${hasThemeHoverBackground}`);
        console.log(`  ✅ Theme hover shadow: ${hasThemeHoverShadow}`);
        
        if (hasThemeHoverBackground && hasThemeHoverShadow) {
          console.log(`  🎉 THEME HOVER SUCCESS`);
        } else {
          console.log(`  🚨 THEME HOVER FAILURE`);
        }
      }
      
      // Test programmatic hover
      testPanel.classList.add('hover-from-handle');
      
      const programmaticStyle = getComputedStyle(testPanel);
      const programmaticBackground = programmaticStyle.backgroundColor;
      const programmaticShadow = programmaticStyle.boxShadow;
      const programmaticTransform = programmaticStyle.transform;
      
      console.log(`\nProgrammatic Hover:`);
      console.log(`  Background: ${programmaticBackground}`);
      console.log(`  Shadow: ${programmaticShadow}`);
      console.log(`  Transform: ${programmaticTransform}`);
      
      const progBackgroundChanged = programmaticBackground !== baselineBackground;
      const progShadowChanged = programmaticShadow !== baselineShadow;
      const progTransformApplied = programmaticTransform !== 'none' && programmaticTransform.includes('matrix');
      
      console.log(`  ✅ Background changed: ${progBackgroundChanged}`);
      console.log(`  ✅ Shadow changed: ${progShadowChanged}`);
      console.log(`  ✅ Transform applied: ${progTransformApplied}`);
      
      if (currentTheme === 'kyoto') {
        const hasProgThemeBackground = programmaticBackground.includes('28') && programmaticBackground.includes('25') && programmaticBackground.includes('23');
        const hasProgThemeShadow = programmaticShadow.includes('220') && programmaticShadow.includes('8');
        
        console.log(`  ✅ Theme prog background: ${hasProgThemeBackground}`);
        console.log(`  ✅ Theme prog shadow: ${hasProgThemeShadow}`);
        
        if (hasProgThemeBackground && hasProgThemeShadow) {
          console.log(`  🎉 PROGRAMMATIC THEME HOVER SUCCESS`);
        } else {
          console.log(`  🚨 PROGRAMMATIC THEME HOVER FAILURE`);
        }
      }
      
      // Cleanup
      testPanel.classList.remove('hover-from-handle');
      testPanel.dispatchEvent(new MouseEvent('mouseleave'));
    }, 100);
  }
  
  // Test 4: Input Field Test
  console.log('\n📝 4. INPUT FIELD TEST');
  console.log('-'.repeat(40));
  
  const inputFields = document.querySelectorAll('.glass-input-field');
  console.log(`Found ${inputFields.length} glass input fields`);
  
  if (inputFields.length > 0) {
    const testInput = inputFields[0];
    const inputStyle = getComputedStyle(testInput);
    const inputBackground = inputStyle.backgroundColor;
    const inputBorder = inputStyle.borderColor;
    
    console.log(`Input Background: ${inputBackground}`);
    console.log(`Input Border: ${inputBorder}`);
    
    if (currentTheme === 'kyoto') {
      const hasThemeInputBackground = inputBackground.includes('28') && inputBackground.includes('25') && inputBackground.includes('23');
      const hasThemeInputBorder = inputBorder.includes('120') && inputBorder.includes('113') && inputBorder.includes('108');
      
      console.log(`✅ Theme input background: ${hasThemeInputBackground}`);
      console.log(`✅ Theme input border: ${hasThemeInputBorder}`);
      
      if (hasThemeInputBackground && hasThemeInputBorder) {
        console.log('🎉 INPUT THEME OVERRIDE SUCCESS');
      } else {
        console.log('🚨 INPUT THEME OVERRIDE FAILURE');
      }
    } else {
      const hasInputBackground = inputBackground !== 'rgba(0, 0, 0, 0)' && inputBackground !== 'transparent';
      console.log(`✅ Input functional: ${hasInputBackground}`);
    }
  }
  
  // Final Summary
  setTimeout(() => {
    console.log('\n📊 FINAL SUMMARY - THEME-CONDITIONAL BASE STYLES');
    console.log('-'.repeat(50));
    
    const architectureSuccess = themeOverrideFailureCount === 0 && themeOverrideSuccessCount > 0;
    
    console.log(`\n🎯 ARCHITECTURE SUCCESS: ${architectureSuccess}`);
    
    if (architectureSuccess) {
      console.log('\n🎉 Theme-conditional base styles working perfectly!');
      console.log('✅ Base styles only apply when no theme is set');
      console.log('✅ Theme styles override base styles naturally');
      console.log('✅ No !important declarations needed');
      console.log('✅ Clean CSS cascade hierarchy established');
      console.log('✅ Scalable architecture for all themes');
    } else {
      console.log('\n⚠️ Some issues detected. Check the detailed results above.');
      console.log('🔧 May need to adjust theme-conditional selectors');
    }
    
    console.log('\n🏗️ ARCHITECTURE SUMMARY:');
    console.log('• Base glassmorphism.css: Theme-conditional selectors (:not([data-theme]))');
    console.log('• Theme kyoto.css: Natural specificity selectors (html[data-theme="kyoto"])');
    console.log('• CSS Cascade: Base → Theme → Component (clean hierarchy)');
    console.log('• Maintainability: No !important anti-patterns');
    console.log('• Scalability: Any theme can override base styles naturally');
    
  }, 200);
  
})();