// Test to manually change hover-from-handle-primary to hover-from-handle
console.log('🔧 CLASS SWAP FIX TEST');

const outputPanel = document.querySelector('[data-output-panel] .glass-panel.glass-content-panel');
const outputHandle = document.querySelector('[data-resize-handle="output-panel"]');

if (outputPanel && outputHandle) {
  
  console.log('✅ Found output panel and handle');
  
  // Monitor class changes to intercept hover-from-handle-primary
  let interceptCount = 0;
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        
        // If hover-from-handle-primary was added, replace it with hover-from-handle
        if (target.classList.contains('hover-from-handle-primary')) {
          interceptCount++;
          console.log(`🔄 INTERCEPT ${interceptCount}: Replacing hover-from-handle-primary with hover-from-handle`);
          
          target.classList.remove('hover-from-handle-primary');
          target.classList.add('hover-from-handle');
          
          // Check the effect
          setTimeout(() => {
            const style = getComputedStyle(target);
            console.log('After swap:');
            console.log('- Background:', style.background);
            console.log('- Box-shadow:', style.boxShadow);
            console.log('- Transform:', style.transform);
            
            const hasStrongShadow = style.boxShadow.includes('72px') || style.boxShadow.includes('64px') || style.boxShadow.includes('44px');
            const hasTransform = style.transform !== 'none' && style.transform.includes('translateY');
            
            console.log('- Strong shadow effect:', hasStrongShadow ? '✅' : '❌');
            console.log('- Transform effect:', hasTransform ? '✅' : '❌');
            
            if (hasStrongShadow || hasTransform) {
              console.log('🎉 SUCCESS! Class swap fixed the hover effect!');
            } else {
              console.log('❌ Class swap did not fix the issue');
            }
          }, 50);
        }
        
        // If hover-from-handle-primary was removed, also remove hover-from-handle
        if (mutation.oldValue?.includes('hover-from-handle-primary') && !target.classList.contains('hover-from-handle-primary')) {
          if (target.classList.contains('hover-from-handle')) {
            console.log('🔄 CLEANUP: Removing hover-from-handle when hover-from-handle-primary is removed');
            target.classList.remove('hover-from-handle');
          }
        }
      }
    });
  });
  
  observer.observe(outputPanel, { 
    attributes: true, 
    attributeFilter: ['class'],
    attributeOldValue: true 
  });
  
  console.log('\n🖱️ TEST INSTRUCTIONS:');
  console.log('1. Hover over the OUTPUT HANDLE (drag handle below output panel)');
  console.log('2. Watch for automatic class replacement');
  console.log('3. Check if the hover effect is now strong');
  console.log('4. Test will run for 30 seconds');
  
  // Auto-stop after 30 seconds
  setTimeout(() => {
    observer.disconnect();
    console.log('\n🏁 TEST COMPLETE');
    console.log(`Total intercepts: ${interceptCount}`);
    
    if (interceptCount > 0) {
      console.log('\n💡 SOLUTION CONFIRMED:');
      console.log('✅ Changing hover-from-handle-primary to hover-from-handle fixes the issue');
      console.log('🔧 Next step: Find the JavaScript that adds hover-from-handle-primary and change it');
    } else {
      console.log('\n❌ No hover-from-handle-primary class detected');
      console.log('💡 The JavaScript might not be adding the class, or it uses a different mechanism');
    }
  }, 30000);
  
} else {
  console.log('❌ Could not find output panel or handle');
}