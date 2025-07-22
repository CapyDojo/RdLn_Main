// Test script to verify surgical fix maintains both opacity and hover
console.log('🧪 SURGICAL FIX TEST - FINAL ATTEMPT');

// Check if we're on Kyoto theme
const currentTheme = document.documentElement.getAttribute('data-theme');
console.log(`Current theme: ${currentTheme}`);

if (currentTheme !== 'kyoto') {
  console.log('❌ Not on Kyoto theme. Please switch to Kyoto theme first.');
} else {
  console.log('✅ Kyoto theme detected');
}

// Find input panels
const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
console.log(`Found ${inputPanels.length} input panels`);

if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  
  // Test 1: Check base styles (should have Kyoto dark background)
  console.log('\n📋 TEST 1: BASE STYLES (SURGICAL OVERRIDE)');
  const baseStyle = getComputedStyle(testPanel);
  console.log('Base background:', baseStyle.background);
  console.log('Base box-shadow:', baseStyle.boxShadow);
  
  // Check if we have the correct Kyoto dark background
  const hasKyotoBackground = baseStyle.background.includes('28, 25, 23') || baseStyle.background.includes('rgba(28, 25, 23');
  if (hasKyotoBackground) {
    console.log('✅ SUCCESS! Kyoto dark background detected (surgical override working)');
  } else {
    console.log('❌ FAILURE! Still showing default theme background');
  }
  
  // Test 2: Test direct hover
  console.log('\n📋 TEST 2: DIRECT HOVER TEST');
  let directHoverTested = false;
  
  const directHoverHandler = () => {
    directHoverTested = true;
    const hoverStyle = getComputedStyle(testPanel);
    console.log('🖱️ DIRECT HOVER DETECTED!');
    console.log('Direct hover background:', hoverStyle.background);
    console.log('Direct hover box-shadow:', hoverStyle.boxShadow);
    console.log('Direct hover transform:', hoverStyle.transform);
    
    // Check if direct hover is working (should have stronger shadow and transform)
    const hasStrongShadow = hoverStyle.boxShadow.includes('80px') || hoverStyle.boxShadow.includes('64px');
    const hasTransform = hoverStyle.transform !== 'none' && hoverStyle.transform.includes('translateY');
    
    if (hasStrongShadow && hasTransform) {
      console.log('✅ SUCCESS! Direct hover working with surgical fix!');
    } else {
      console.log('❌ FAILURE! Direct hover not working correctly.');
      console.log('Expected strong shadow (64px+ or 80px+) and translateY transform');
    }
  };
  
  testPanel.addEventListener('mouseenter', directHoverHandler);
  
  // Test 3: Test hover-from-handle class
  console.log('\n📋 TEST 3: HOVER-FROM-HANDLE CLASS');
  testPanel.classList.add('hover-from-handle');
  
  setTimeout(() => {
    const handleHoverStyle = getComputedStyle(testPanel);
    console.log('Handle hover background:', handleHoverStyle.background);
    console.log('Handle hover box-shadow:', handleHoverStyle.boxShadow);
    console.log('Handle hover transform:', handleHoverStyle.transform);
    
    // Check if handle hover is working (should have strong shadow from current-layout.css)
    const hasHandleStrongShadow = handleHoverStyle.boxShadow.includes('72px') || handleHoverStyle.boxShadow.includes('64px') || handleHoverStyle.boxShadow.includes('28px');
    const hasHandleTransform = handleHoverStyle.transform !== 'none' && handleHoverStyle.transform.includes('translateY');
    
    if (hasHandleStrongShadow && hasHandleTransform) {
      console.log('✅ SUCCESS! Handle hover working with surgical fix!');
    } else {
      console.log('❌ FAILURE! Handle hover not working correctly.');
      console.log('Expected strong shadow (28px+ or 64px+) and translateY transform');
    }
    
    // Clean up
    testPanel.classList.remove('hover-from-handle');
    
    // Test 4: Test force-hover class
    console.log('\n📋 TEST 4: FORCE-HOVER CLASS');
    testPanel.classList.add('force-hover');
    
    setTimeout(() => {
      const forceStyle = getComputedStyle(testPanel);
      console.log('Force-hover background:', forceStyle.background);
      console.log('Force-hover box-shadow:', forceStyle.boxShadow);
      console.log('Force-hover transform:', forceStyle.transform);
      
      // Check if force-hover is working (should have strong shadow)
      const hasForceStrongShadow = forceStyle.boxShadow.includes('64px') || forceStyle.boxShadow.includes('36px') || forceStyle.boxShadow.includes('24px');
      const hasForceTransform = forceStyle.transform !== 'none' && forceStyle.transform.includes('translateY');
      
      if (hasForceStrongShadow && hasForceTransform) {
        console.log('✅ SUCCESS! Force-hover working with surgical fix!');
      } else {
        console.log('❌ FAILURE! Force-hover not working correctly.');
        console.log('Expected strong shadow (24px+ or 64px+) and translateY transform');
      }
      
      // Clean up
      testPanel.classList.remove('force-hover');
      testPanel.removeEventListener('mouseenter', directHoverHandler);
      
      console.log('\n🎯 FINAL SUMMARY - SURGICAL APPROACH:');
      console.log('- Base glassmorphism opacity: ' + (hasKyotoBackground ? '✅ VIVID' : '❌ WHITISH'));
      console.log('- Surgical override: Uses :not() selectors to preserve hover states');
      console.log('- All hover effects: Should work with consistent !important declarations');
      console.log('- Approach: Target base state only, let hover states override naturally');
      
      if (!directHoverTested) {
        console.log('\n🖱️ Please hover over an input panel to test direct hover effects!');
      }
      
    }, 100);
  }, 100);
}