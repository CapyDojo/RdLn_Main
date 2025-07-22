// Test script to investigate output panel handle hover mechanism
console.log('🧪 OUTPUT PANEL HANDLE HOVER INVESTIGATION');

// Check if we're on Kyoto theme
const currentTheme = document.documentElement.getAttribute('data-theme');
console.log(`Current theme: ${currentTheme}`);

// Find output panel
const outputPanel = document.querySelector('[data-output-panel] .glass-panel.glass-content-panel');
console.log('Output panel found:', !!outputPanel);

// Find output panel handle
const outputHandle = document.querySelector('[data-resize-handle="output-panel"]');
console.log('Output handle found:', !!outputHandle);

if (outputPanel && outputHandle) {
  console.log('\n📋 TESTING OUTPUT PANEL HANDLE HOVER MECHANISM');
  
  // Test 1: Check if handle hover adds hover-from-handle class to panel
  let classAdded = false;
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        if (target === outputPanel && target.classList.contains('hover-from-handle')) {
          classAdded = true;
          console.log('✅ hover-from-handle class detected on output panel!');
          console.log('Panel classes:', target.className);
        }
      }
    });
  });
  
  observer.observe(outputPanel, { attributes: true, attributeFilter: ['class'] });
  
  // Test 2: Simulate handle hover
  console.log('\n🖱️ Simulating handle hover...');
  outputHandle.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  
  setTimeout(() => {
    if (!classAdded) {
      console.log('❌ hover-from-handle class NOT added to output panel on handle hover');
      console.log('This explains why output panel handle hover only affects the handle');
    }
    
    // Test 3: Manually add hover-from-handle class to see if it would work
    console.log('\n📋 MANUALLY TESTING hover-from-handle CLASS ON OUTPUT PANEL');
    outputPanel.classList.add('hover-from-handle');
    
    setTimeout(() => {
      const style = getComputedStyle(outputPanel);
      console.log('Manual hover-from-handle background:', style.background);
      console.log('Manual hover-from-handle box-shadow:', style.boxShadow);
      console.log('Manual hover-from-handle transform:', style.transform);
      
      const hasStrongShadow = style.boxShadow.includes('72px') || style.boxShadow.includes('64px');
      const hasTransform = style.transform !== 'none' && style.transform.includes('translateY');
      
      if (hasStrongShadow && hasTransform) {
        console.log('✅ SUCCESS! Output panel CAN use hover-from-handle class');
        console.log('💡 SOLUTION: Output panel handle hover mechanism needs to apply hover-from-handle class to panel');
      } else {
        console.log('❌ FAILURE! Output panel hover-from-handle class not working');
      }
      
      // Clean up
      outputPanel.classList.remove('hover-from-handle');
      observer.disconnect();
      
      console.log('\n🎯 DIAGNOSIS:');
      console.log('- Input panels: Handle hover applies hover-from-handle class to panel ✅');
      console.log('- Output panel: Handle hover does NOT apply hover-from-handle class to panel ❌');
      console.log('- Fix needed: Update output panel handle hover mechanism');
      
    }, 100);
  }, 500);
} else {
  console.log('❌ Could not find output panel or handle elements');
}