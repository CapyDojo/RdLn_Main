// Consolidated Hover Effects Test - Task 4 Validation
// Test both direct panel hover and hover-from-handle class application

(function() {
  'use strict';
  
  console.log('🧪 CONSOLIDATED HOVER EFFECTS TEST - TASK 4');
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
  
  // Test 1: Direct Hover Effects
  console.log('\n📋 1. DIRECT HOVER EFFECTS TEST');
  console.log('-'.repeat(40));
  
  const glassPanels = document.querySelectorAll('.glass-panel');
  console.log(`Found ${glassPanels.length} glass panels for direct hover testing`);
  
  let directHoverSuccessCount = 0;
  let directHoverFailureCount = 0;
  
  // Test first few panels for direct hover
  const testPanels = Array.from(glassPanels).slice(0, 3);
  
  testPanels.forEach((panel, index) => {
    console.log(`\nTesting Panel ${index + 1}:`);
    console.log(`  Classes: ${panel.className}`);
    
    // Get baseline styles
    const baselineStyle = getComputedStyle(panel);
    const baselineBackground = baselineStyle.backgroundColor;
    const baselineShadow = baselineStyle.boxShadow;
    const baselineTransform = baselineStyle.transform;
    
    console.log(`  Baseline Background: ${baselineBackground}`);
    console.log(`  Baseline Shadow: ${baselineShadow}`);
    console.log(`  Baseline Transform: ${baselineTransform}`);
    
    // Simulate hover
    panel.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    
    // Small delay to allow CSS transitions
    setTimeout(() => {
      const hoverStyle = getComputedStyle(panel);
      const hoverBackground = hoverStyle.backgroundColor;
      const hoverShadow = hoverStyle.boxShadow;
      const hoverTransform = hoverStyle.transform;
      
      console.log(`  Hover Background: ${hoverBackground}`);
      console.log(`  Hover Shadow: ${hoverShadow}`);
      console.log(`  Hover Transform: ${hoverTransform}`);
      
      // Check if hover effects are applied
      const backgroundChanged = hoverBackground !== baselineBackground;
      const shadowChanged = hoverShadow !== baselineShadow;
      const transformChanged = hoverTransform !== baselineTransform;
      
      // Check for theme-specific hover effects
      const hasThemeBackground = hoverBackground.includes('28') && hoverBackground.includes('25') && hoverBackground.includes('23');
      const hasThemeShadow = hoverShadow.includes('220') && hoverShadow.includes('8');
      const hasTransform = hoverTransform.includes('translateY') || hoverTransform.includes('matrix');
      
      console.log(`  ✅ Background changed: ${backgroundChanged}`);
      console.log(`  ✅ Shadow changed: ${shadowChanged}`);
      console.log(`  ✅ Transform changed: ${transformChanged}`);
      console.log(`  ✅ Theme background: ${hasThemeBackground}`);
      console.log(`  ✅ Theme shadow (red): ${hasThemeShadow}`);
      console.log(`  ✅ Transform applied: ${hasTransform}`);
      
      const hoverSuccess = hasThemeBackground && hasThemeShadow && hasTransform;
      
      if (hoverSuccess) {
        directHoverSuccessCount++;
        console.log(`  🎉 DIRECT HOVER SUCCESS`);
      } else {
        directHoverFailureCount++;
        console.log(`  🚨 DIRECT HOVER FAILURE`);
      }
      
      // Remove hover
      panel.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    }, 100);
  });
  
  // Test 2: Programmatic Hover (hover-from-handle) Effects
  console.log('\n🎯 2. PROGRAMMATIC HOVER (HOVER-FROM-HANDLE) TEST');
  console.log('-'.repeat(40));
  
  let programmaticHoverSuccessCount = 0;
  let programmaticHoverFailureCount = 0;
  
  testPanels.forEach((panel, index) => {
    console.log(`\nTesting Panel ${index + 1} Programmatic Hover:`);
    
    // Get baseline styles
    const baselineStyle = getComputedStyle(panel);
    const baselineBackground = baselineStyle.backgroundColor;
    const baselineShadow = baselineStyle.boxShadow;
    const baselineTransform = baselineStyle.transform;
    
    // Apply hover-from-handle class
    panel.classList.add('hover-from-handle');
    
    const programmaticStyle = getComputedStyle(panel);
    const programmaticBackground = programmaticStyle.backgroundColor;
    const programmaticShadow = programmaticStyle.boxShadow;
    const programmaticTransform = programmaticStyle.transform;
    
    console.log(`  Programmatic Background: ${programmaticBackground}`);
    console.log(`  Programmatic Shadow: ${programmaticShadow}`);
    console.log(`  Programmatic Transform: ${programmaticTransform}`);
    
    // Check for theme-specific hover effects
    const hasThemeBackground = programmaticBackground.includes('28') && programmaticBackground.includes('25') && programmaticBackground.includes('23');
    const hasThemeShadow = programmaticShadow.includes('220') && programmaticShadow.includes('8');
    const hasTransform = programmaticTransform.includes('translateY') || programmaticTransform.includes('matrix');
    
    console.log(`  ✅ Theme background: ${hasThemeBackground}`);
    console.log(`  ✅ Theme shadow (red): ${hasThemeShadow}`);
    console.log(`  ✅ Transform applied: ${hasTransform}`);
    
    const programmaticSuccess = hasThemeBackground && hasThemeShadow && hasTransform;
    
    if (programmaticSuccess) {
      programmaticHoverSuccessCount++;
      console.log(`  🎉 PROGRAMMATIC HOVER SUCCESS`);
    } else {
      programmaticHoverFailureCount++;
      console.log(`  🚨 PROGRAMMATIC HOVER FAILURE`);
    }
    
    // Remove hover-from-handle class
    panel.classList.remove('hover-from-handle');
  });
  
  // Test 3: Input Panel Specific Hover Test
  console.log('\n📝 3. INPUT PANEL SPECIFIC HOVER TEST');
  console.log('-'.repeat(40));
  
  const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel');
  console.log(`Found ${inputPanels.length} input panels`);
  
  let inputHoverSuccessCount = 0;
  let inputHoverFailureCount = 0;
  
  Array.from(inputPanels).slice(0, 2).forEach((panel, index) => {
    console.log(`\nTesting Input Panel ${index + 1}:`);
    
    // Test direct hover
    panel.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    
    setTimeout(() => {
      const hoverStyle = getComputedStyle(panel);
      const hoverShadow = hoverStyle.boxShadow;
      const hoverTransform = hoverStyle.transform;
      
      console.log(`  Input Hover Shadow: ${hoverShadow}`);
      console.log(`  Input Hover Transform: ${hoverTransform}`);
      
      const hasThemeShadow = hoverShadow.includes('220') && hoverShadow.includes('8');
      const hasTransform = hoverTransform.includes('translateY') || hoverTransform.includes('matrix');
      
      console.log(`  ✅ Theme shadow (red): ${hasThemeShadow}`);
      console.log(`  ✅ Transform applied: ${hasTransform}`);
      
      if (hasThemeShadow && hasTransform) {
        inputHoverSuccessCount++;
        console.log(`  🎉 INPUT PANEL HOVER SUCCESS`);
      } else {
        inputHoverFailureCount++;
        console.log(`  🚨 INPUT PANEL HOVER FAILURE`);
      }
      
      panel.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    }, 100);
  });
  
  // Test 4: Output Panel Specific Hover Test
  console.log('\n📤 4. OUTPUT PANEL SPECIFIC HOVER TEST');
  console.log('-'.repeat(40));
  
  const outputPanels = document.querySelectorAll('[data-output-panel] .glass-panel');
  console.log(`Found ${outputPanels.length} output panels`);
  
  let outputHoverSuccessCount = 0;
  let outputHoverFailureCount = 0;
  
  Array.from(outputPanels).slice(0, 1).forEach((panel, index) => {
    console.log(`\nTesting Output Panel ${index + 1}:`);
    
    // Test direct hover
    panel.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    
    setTimeout(() => {
      const hoverStyle = getComputedStyle(panel);
      const hoverShadow = hoverStyle.boxShadow;
      const hoverTransform = hoverStyle.transform;
      
      console.log(`  Output Hover Shadow: ${hoverShadow}`);
      console.log(`  Output Hover Transform: ${hoverTransform}`);
      
      const hasThemeShadow = hoverShadow.includes('220') && hoverShadow.includes('8');
      const hasTransform = hoverTransform.includes('translateY') || hoverTransform.includes('matrix');
      
      console.log(`  ✅ Theme shadow (red): ${hasThemeShadow}`);
      console.log(`  ✅ Transform applied: ${hasTransform}`);
      
      if (hasThemeShadow && hasTransform) {
        outputHoverSuccessCount++;
        console.log(`  🎉 OUTPUT PANEL HOVER SUCCESS`);
      } else {
        outputHoverFailureCount++;
        console.log(`  🚨 OUTPUT PANEL HOVER FAILURE`);
      }
      
      panel.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    }, 100);
  });
  
  // Test 5: Layered Shadow Effects Validation
  console.log('\n💫 5. LAYERED SHADOW EFFECTS VALIDATION');
  console.log('-'.repeat(40));
  
  if (testPanels.length > 0) {
    const testPanel = testPanels[0];
    testPanel.classList.add('hover-from-handle');
    
    const shadowStyle = getComputedStyle(testPanel);
    const boxShadow = shadowStyle.boxShadow;
    
    console.log(`Layered Shadow: ${boxShadow}`);
    
    // Check for multiple shadow layers
    const shadowLayers = boxShadow.split(',').length;
    const hasMultipleLayers = shadowLayers >= 2;
    const hasCorrectOpacity = boxShadow.includes('0.6') && boxShadow.includes('0.4');
    
    console.log(`  Shadow layers: ${shadowLayers}`);
    console.log(`  ✅ Multiple layers: ${hasMultipleLayers}`);
    console.log(`  ✅ Correct opacity values: ${hasCorrectOpacity}`);
    
    testPanel.classList.remove('hover-from-handle');
  }
  
  // Test 6: Transform Effect Validation
  console.log('\n🚀 6. TRANSFORM EFFECT VALIDATION');
  console.log('-'.repeat(40));
  
  if (testPanels.length > 0) {
    const testPanel = testPanels[0];
    
    // Test translateY(-2px) effect
    testPanel.classList.add('hover-from-handle');
    
    const transformStyle = getComputedStyle(testPanel);
    const transform = transformStyle.transform;
    
    console.log(`Transform: ${transform}`);
    
    const hasTranslateY = transform.includes('translateY') || (transform.includes('matrix') && transform !== 'none');
    console.log(`  ✅ Transform applied: ${hasTranslateY}`);
    
    testPanel.classList.remove('hover-from-handle');
  }
  
  // Final Summary
  setTimeout(() => {
    console.log('\n📊 FINAL SUMMARY - TASK 4 VALIDATION');
    console.log('-'.repeat(40));
    
    const totalTests = testPanels.length;
    
    console.log(`\nTest Results:`);
    console.log(`  Direct Hover Success: ${directHoverSuccessCount}/${totalTests}`);
    console.log(`  Programmatic Hover Success: ${programmaticHoverSuccessCount}/${totalTests}`);
    console.log(`  Input Panel Hover Success: ${inputHoverSuccessCount}/${Math.min(2, inputPanels.length)}`);
    console.log(`  Output Panel Hover Success: ${outputHoverSuccessCount}/${Math.min(1, outputPanels.length)}`);
    
    const allTestsPassed = (directHoverSuccessCount === totalTests) && 
                          (programmaticHoverSuccessCount === totalTests) &&
                          (inputHoverSuccessCount > 0) &&
                          (outputHoverSuccessCount > 0);
    
    console.log(`\n🎯 TASK 4 SUCCESS: ${allTestsPassed}`);
    
    if (allTestsPassed) {
      console.log('\n🎉 All hover effects are working correctly!');
      console.log('✅ Direct panel hover shows vivid red shadows');
      console.log('✅ Programmatic hover (hover-from-handle) works consistently');
      console.log('✅ Input and output panels respond to hover');
      console.log('✅ Transform effects (translateY) are applied');
      console.log('✅ Layered shadow effects create depth');
    } else {
      console.log('\n⚠️ Some hover effects need attention. Check the detailed results above.');
      console.log('🔧 Ensure theme styles have sufficient specificity to override base styles');
    }
  }, 500);
  
})();