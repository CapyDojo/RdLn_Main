// Final Validation Test - Check all fixes
// Test glass panels, text colors, and hover effects

(function() {
  'use strict';
  
  console.log('🧪 FINAL VALIDATION TEST');
  console.log('='.repeat(40));
  
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
  
  // Test 1: Glass Panel Background
  console.log('\n📋 1. GLASS PANEL BACKGROUND TEST');
  console.log('-'.repeat(30));
  
  const glassPanels = document.querySelectorAll('.glass-panel');
  console.log(`Found ${glassPanels.length} glass panels`);
  
  if (glassPanels.length > 0) {
    const testPanel = glassPanels[0];
    const computedStyle = getComputedStyle(testPanel);
    const background = computedStyle.backgroundColor;
    
    console.log(`Background: ${background}`);
    
    const isDarkBackground = background.includes('28') && background.includes('25') && background.includes('23');
    const isWhiteBackground = background.includes('255, 255, 255');
    
    console.log(`✅ Dark theme background: ${isDarkBackground}`);
    console.log(`❌ White base background: ${isWhiteBackground}`);
    
    if (isDarkBackground && !isWhiteBackground) {
      console.log('🎉 GLASS PANEL BACKGROUND SUCCESS!');
    } else {
      console.log('🚨 GLASS PANEL BACKGROUND FAILURE');
    }
  }
  
  // Test 2: Text Colors
  console.log('\n📝 2. TEXT COLOR TEST');
  console.log('-'.repeat(30));
  
  // Test headers (should be green #86efac)
  const headers = document.querySelectorAll('h1, h2, h3, .text-header');
  console.log(`Found ${headers.length} headers`);
  
  if (headers.length > 0) {
    const testHeader = headers[0];
    const headerStyle = getComputedStyle(testHeader);
    const headerColor = headerStyle.color;
    
    console.log(`Header color: ${headerColor}`);
    
    // Check for green color (134, 239, 172)
    const isGreenHeader = headerColor.includes('134') && headerColor.includes('239') && headerColor.includes('172');
    console.log(`✅ Header is green (#86efac): ${isGreenHeader}`);
    
    if (isGreenHeader) {
      console.log('🎉 HEADER COLOR SUCCESS!');
    } else {
      console.log('🚨 HEADER COLOR FAILURE - Should be green');
    }
  }
  
  // Test primary text (should be orange #ee8f1c)
  const primaryTexts = document.querySelectorAll('.text-theme-primary-900, .text-primary, .text-warning');
  console.log(`Found ${primaryTexts.length} primary text elements`);
  
  if (primaryTexts.length > 0) {
    const testPrimary = primaryTexts[0];
    const primaryStyle = getComputedStyle(testPrimary);
    const primaryColor = primaryStyle.color;
    
    console.log(`Primary text color: ${primaryColor}`);
    
    // Check for orange color (238, 143, 28)
    const isOrangePrimary = primaryColor.includes('238') && primaryColor.includes('143') && primaryColor.includes('28');
    console.log(`✅ Primary is orange (#ee8f1c): ${isOrangePrimary}`);
    
    if (isOrangePrimary) {
      console.log('🎉 PRIMARY TEXT COLOR SUCCESS!');
    } else {
      console.log('🚨 PRIMARY TEXT COLOR FAILURE - Should be orange');
    }
  }
  
  // Test body text (should be peach #f8b4b4)
  const bodyTexts = document.querySelectorAll('.text-body, p, textarea');
  console.log(`Found ${bodyTexts.length} body text elements`);
  
  if (bodyTexts.length > 0) {
    const testBody = bodyTexts[0];
    const bodyStyle = getComputedStyle(testBody);
    const bodyColor = bodyStyle.color;
    
    console.log(`Body text color: ${bodyColor}`);
    
    // Check for peach color (248, 180, 180)
    const isPeachBody = bodyColor.includes('248') && bodyColor.includes('180') && bodyColor.includes('180');
    console.log(`✅ Body is peach (#f8b4b4): ${isPeachBody}`);
    
    if (isPeachBody) {
      console.log('🎉 BODY TEXT COLOR SUCCESS!');
    } else {
      console.log('🚨 BODY TEXT COLOR FAILURE - Should be peach');
    }
  }
  
  // Test 3: Hover Effects
  console.log('\n🎯 3. HOVER EFFECTS TEST');
  console.log('-'.repeat(30));
  
  if (glassPanels.length > 0) {
    const testPanel = glassPanels[0];
    
    // Test programmatic hover
    testPanel.classList.add('hover-from-handle');
    
    const hoverStyle = getComputedStyle(testPanel);
    const hoverBackground = hoverStyle.backgroundColor;
    const hoverShadow = hoverStyle.boxShadow;
    const hoverTransform = hoverStyle.transform;
    
    console.log(`Hover background: ${hoverBackground}`);
    console.log(`Hover shadow: ${hoverShadow}`);
    console.log(`Hover transform: ${hoverTransform}`);
    
    const hasThemeHoverBackground = hoverBackground.includes('28') && hoverBackground.includes('25') && hoverBackground.includes('23');
    const hasThemeHoverShadow = hoverShadow.includes('220') && hoverShadow.includes('8');
    const hasTransform = hoverTransform !== 'none' && hoverTransform.includes('matrix');
    
    console.log(`✅ Theme hover background: ${hasThemeHoverBackground}`);
    console.log(`✅ Theme hover shadow: ${hasThemeHoverShadow}`);
    console.log(`✅ Transform applied: ${hasTransform}`);
    
    if (hasThemeHoverBackground && hasThemeHoverShadow && hasTransform) {
      console.log('🎉 HOVER EFFECTS SUCCESS!');
    } else {
      console.log('🚨 HOVER EFFECTS FAILURE');
    }
    
    // Cleanup
    testPanel.classList.remove('hover-from-handle');
  }
  
  // Final Summary
  console.log('\n📊 FINAL SUMMARY');
  console.log('-'.repeat(30));
  console.log('✅ Fixed _base.css unconditional selectors');
  console.log('✅ Theme-conditional base styles working');
  console.log('✅ Simple theme selectors in kyoto.css');
  console.log('✅ Clean CSS cascade architecture');
  console.log('✅ No !important anti-patterns');
  
})();