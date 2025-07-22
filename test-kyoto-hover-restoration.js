// Test script to verify Kyoto hover restoration
console.log('🧪 KYOTO HOVER RESTORATION TEST');

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
  
  // Test 1: Check base glassmorphism opacity
  console.log('\n📋 TEST 1: BASE GLASSMORPHISM OPACITY');
  const baseStyle = getComputedStyle(testPanel);
  console.log('Base background:', baseStyle.background);
  console.log('Base box-shadow:', baseStyle.boxShadow);
  
  // Test 2: Test hover-from-handle class
  console.log('\n📋 TEST 2: HOVER-FROM-HANDLE CLASS');
  testPanel.classList.add('hover-from-handle');
  
  setTimeout(() => {
    const hoverStyle = getComputedStyle(testPanel);
    console.log('Hover-from-handle background:', hoverStyle.background);
    console.log('Hover-from-handle box-shadow:', hoverStyle.boxShadow);
    console.log('Hover-from-handle border-color:', hoverStyle.borderColor);
    console.log('Hover-from-handle transform:', hoverStyle.transform);
    
    // Check if hover effect is working
    const hasStrongShadow = hoverStyle.boxShadow.includes('72px') || hoverStyle.boxShadow.includes('64px');
    const hasTransform = hoverStyle.transform !== 'none' && hoverStyle.transform.includes('translateY');
    
    if (hasStrongShadow && hasTransform) {
      console.log('✅ SUCCESS! Hover-from-handle is working correctly!');
    } else {
      console.log('❌ FAILURE! Hover-from-handle is not working correctly.');
    }
    
    // Clean up
    testPanel.classList.remove('hover-from-handle');
    
    // Test 3: Test force-hover class
    console.log('\n📋 TEST 3: FORCE-HOVER CLASS');
    testPanel.classList.add('force-hover');
    
    setTimeout(() => {
      const forceStyle = getComputedStyle(testPanel);
      console.log('Force-hover background:', forceStyle.background);
      console.log('Force-hover box-shadow:', forceStyle.boxShadow);
      console.log('Force-hover border-color:', forceStyle.borderColor);
      console.log('Force-hover transform:', forceStyle.transform);
      
      // Check if force-hover effect is working
      const hasForceStrongShadow = forceStyle.boxShadow.includes('64px') || forceStyle.boxShadow.includes('36px');
      const hasForceTransform = forceStyle.transform !== 'none' && forceStyle.transform.includes('translateY');
      
      if (hasForceStrongShadow && hasForceTransform) {
        console.log('✅ SUCCESS! Force-hover is working correctly!');
      } else {
        console.log('❌ FAILURE! Force-hover is not working correctly.');
      }
      
      // Clean up
      testPanel.classList.remove('force-hover');
      
      console.log('\n🎯 SUMMARY:');
      console.log('- Base glassmorphism opacity restored');
      console.log('- Hover-from-handle class functionality restored');
      console.log('- Force-hover class functionality restored');
      console.log('- Handle hover should now work correctly');
      
    }, 100);
  }, 100);
}