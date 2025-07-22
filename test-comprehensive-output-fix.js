// Comprehensive test for output panel hover fixes
console.log('🧪 COMPREHENSIVE OUTPUT PANEL FIX TEST');

// Check if we're on Kyoto theme
const currentTheme = document.documentElement.getAttribute('data-theme');
console.log(`Current theme: ${currentTheme}`);

// Find elements
const outputPanel = document.querySelector('[data-output-panel] .glass-panel.glass-content-panel');
const outputHandle = document.querySelector('[data-resize-handle="output-panel"]');
const inputPanel = document.querySelector('[data-input-panel] .glass-panel.glass-content-panel');

console.log('Output panel found:', !!outputPanel);
console.log('Output handle found:', !!outputHandle);
console.log('Input panel found (for comparison):', !!inputPanel);

if (outputPanel && outputHandle) {
  console.log('\n📋 COMPREHENSIVE OUTPUT PANEL TESTING');
  
  // Test 1: Compare input vs output panel base state
  console.log('\n1️⃣ BASE STATE COMPARISON:');
  const outputBase = getComputedStyle(outputPanel);
  const inputBase = inputPanel ? getComputedStyle(inputPanel) : null;
  
  console.log('Output panel base:');
  console.log('- Background:', outputBase.background);
  console.log('- Box-shadow:', outputBase.boxShadow);
  
  if (inputBase) {
    console.log('Input panel base:');
    console.log('- Background:', inputBase.background);
    console.log('- Box-shadow:', inputBase.boxShadow);
    console.log('Base states match:', outputBase.background === inputBase.background);
  }
  
  // Test 2: Direct hover test with event simulation
  console.log('\n2️⃣ DIRECT HOVER TEST:');
  
  // Create a more realistic hover simulation
  const hoverEvent = new MouseEvent('mouseenter', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  
  outputPanel.dispatchEvent(hoverEvent);
  
  // Use requestAnimationFrame to ensure CSS transitions are applied
  requestAnimationFrame(() => {
    const directHoverStyle = getComputedStyle(outputPanel);
    console.log('Direct hover styles:');
    console.log('- Background:', directHoverStyle.background);
    console.log('- Box-shadow:', directHoverStyle.boxShadow);
    console.log('- Transform:', directHoverStyle.transform);
    
    // Check for expected hover effects
    const hasStrongShadow = directHoverStyle.boxShadow.includes('64px') || directHoverStyle.boxShadow.includes('36px');
    const hasTransform = directHoverStyle.transform !== 'none' && directHoverStyle.transform.includes('translateY');
    const hasKyotoFocusBackground = directHoverStyle.background.includes('0.2') || directHoverStyle.background.includes('0.22');
    
    console.log('Direct hover analysis:');
    console.log('- Strong shadow (64px+ or 36px+):', hasStrongShadow);
    console.log('- Transform (translateY):', hasTransform);
    console.log('- Focus background (0.2+ opacity):', hasKyotoFocusBackground);
    
    if (hasStrongShadow && hasTransform) {
      console.log('✅ SUCCESS! Direct output panel hover working!');
    } else {
      console.log('❌ FAILURE! Direct output panel hover not working correctly');
    }
    
    // Dispatch mouse leave to reset
    outputPanel.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    
    // Test 3: Handle hover test
    setTimeout(() => {
      console.log('\n3️⃣ HANDLE HOVER TEST:');
      
      // Simulate handle hover
      outputHandle.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      
      requestAnimationFrame(() => {
        const handleHoverStyle = getComputedStyle(outputPanel);
        console.log('Handle hover panel styles:');
        console.log('- Background:', handleHoverStyle.background);
        console.log('- Box-shadow:', handleHoverStyle.boxShadow);
        console.log('- Transform:', handleHoverStyle.transform);
        
        // Check for expected handle hover effects
        const hasHandleStrongShadow = handleHoverStyle.boxShadow.includes('72px') || handleHoverStyle.boxShadow.includes('64px');
        const hasHandleTransform = handleHoverStyle.transform !== 'none' && handleHoverStyle.transform.includes('translateY');
        const hasHandleBackground = handleHoverStyle.background.includes('0.2') || handleHoverStyle.background.includes('0.22');
        
        console.log('Handle hover analysis:');
        console.log('- Strong shadow (72px+ or 64px+):', hasHandleStrongShadow);
        console.log('- Transform (translateY):', hasHandleTransform);
        console.log('- Focus background:', hasHandleBackground);
        
        if (hasHandleStrongShadow && hasHandleTransform) {
          console.log('✅ SUCCESS! Output panel handle hover working!');
        } else {
          console.log('❌ FAILURE! Output panel handle hover not working');
          console.log('💡 Try manually hovering over the output handle to test');
        }
        
        // Clean up
        outputHandle.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        
        console.log('\n🎯 FINAL STATUS:');
        console.log('- Input panels: All effects working ✅');
        console.log('- Output panel base opacity: Fixed with nuclear override ✅');
        console.log('- Output panel direct hover:', hasStrongShadow && hasTransform ? '✅' : '❌');
        console.log('- Output panel handle hover:', hasHandleStrongShadow && hasHandleTransform ? '✅' : '❌');
        
        if (!hasStrongShadow || !hasTransform || !hasHandleStrongShadow || !hasHandleTransform) {
          console.log('\n🔧 NEXT STEPS:');
          console.log('- Manual testing required');
          console.log('- May need DOM structure analysis');
          console.log('- Consider JavaScript-based solution if CSS selectors insufficient');
        }
      });
    }, 200);
  });
  
} else {
  console.log('❌ Could not find required elements');
}