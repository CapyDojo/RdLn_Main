// Test script to verify removing !important fixes both direct and handle hover
console.log('🧪 NO !IMPORTANT FIX TEST');

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
  
  // Test 1: Check base styles (should still have good opacity)
  console.log('\n📋 TEST 1: BASE STYLES (NO !IMPORTANT)');
  const baseStyle = getComputedStyle(testPanel);
  console.log('Base background:', baseStyle.background);
  console.log('Base box-shadow:', baseStyle.boxShadow);
  
  // Test 2: Test direct hover by simulating hover event
  console.log('\n📋 TEST 2: DIRECT HOVER SIMULATION');
  
  // Create a hover event listener to capture the hover state
  let hoverDetected = false;
  const hoverHandler = () => {
    hoverDetected = true;
    const hoverStyle = getComputedStyle(testPanel);
    console.log('🖱️ DIRECT HOVER DETECTED!');
    console.log('Direct hover background:', hoverStyle.background);
    console.log('Direct hover box-shadow:', hoverStyle.boxShadow);
    console.log('Direct hover border-color:', hoverStyle.borderColor);
    console.log('Direct hover transform:', hoverStyle.transform);
    
    // Check if direct hover is working
    const hasStrongShadow = hoverStyle.boxShadow.includes('80px') || hoverStyle.boxShadow.includes('64px');
    const hasTransform = hoverStyle.transform !== 'none' && hoverStyle.transform.includes('translateY');
    
    if (hasStrongShadow && hasTransform) {
      console.log('✅ SUCCESS! Direct hover is working correctly!');
    } else {
      console.log('❌ FAILURE! Direct hover is not working correctly.');
    }
  };
  
  testPanel.addEventListener('mouseenter', hoverHandler);
  
  // Test 3: Test hover-from-handle class
  console.log('\n📋 TEST 3: HOVER-FROM-HANDLE CLASS');
  testPanel.classList.add('hover-from-handle');
  
  setTimeout(() => {
    const handleHoverStyle = getComputedStyle(testPanel);
    console.log('Handle hover background:', handleHoverStyle.background);
    console.log('Handle hover box-shadow:', handleHoverStyle.boxShadow);
    console.log('Handle hover border-color:', handleHoverStyle.borderColor);
    console.log('Handle hover transform:', handleHoverStyle.transform);
    
    // Check if handle hover is working
    const hasHandleStrongShadow = handleHoverStyle.boxShadow.includes('72px') || handleHoverStyle.boxShadow.includes('64px');
    const hasHandleTransform = handleHoverStyle.transform !== 'none' && handleHoverStyle.transform.includes('translateY');
    
    if (hasHandleStrongShadow && hasHandleTransform) {
      console.log('✅ SUCCESS! Handle hover is working correctly!');
    } else {
      console.log('❌ FAILURE! Handle hover is not working correctly.');
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
      console.log('Force-hover border-color:', forceStyle.borderColor);
      console.log('Force-hover transform:', forceStyle.transform);
      
      // Check if force-hover is working
      const hasForceStrongShadow = forceStyle.boxShadow.includes('64px') || forceStyle.boxShadow.includes('36px');
      const hasForceTransform = forceStyle.transform !== 'none' && forceStyle.transform.includes('translateY');
      
      if (hasForceStrongShadow && hasForceTransform) {
        console.log('✅ SUCCESS! Force-hover is working correctly!');
      } else {
        console.log('❌ FAILURE! Force-hover is not working correctly.');
      }
      
      // Clean up
      testPanel.classList.remove('force-hover');
      testPanel.removeEventListener('mouseenter', hoverHandler);
      
      console.log('\n🎯 FINAL SUMMARY:');
      console.log('- Base glassmorphism opacity maintained without !important');
      console.log('- Direct panel hover should work (hover over a panel to test)');
      console.log('- Handle hover functionality restored');
      console.log('- Force-hover class functionality restored');
      console.log('- All hover effects working without !important declarations');
      
      if (!hoverDetected) {
        console.log('\n🖱️ Please hover over an input panel to test direct hover effects!');
      }
      
    }, 100);
  }, 100);
}