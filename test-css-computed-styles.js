// Test to see what CSS is actually being applied vs what should be applied
console.log('🔍 CSS COMPUTED STYLES INVESTIGATION');

const outputPanel = document.querySelector('[data-output-panel] .glass-panel.glass-content-panel');
const inputPanel = document.querySelector('[data-input-panel] .glass-panel.glass-content-panel');

if (outputPanel && inputPanel) {
  
  console.log('\n📋 PART 1: BASELINE COMPARISON');
  
  // Get baseline styles
  const outputBase = getComputedStyle(outputPanel);
  const inputBase = getComputedStyle(inputPanel);
  
  console.log('🔵 Output panel baseline:');
  console.log('- Background:', outputBase.background);
  console.log('- Box-shadow:', outputBase.boxShadow);
  console.log('- Transform:', outputBase.transform);
  
  console.log('\n🔴 Input panel baseline:');
  console.log('- Background:', inputBase.background);
  console.log('- Box-shadow:', inputBase.boxShadow);
  console.log('- Transform:', inputBase.transform);
  
  console.log('\n📋 PART 2: HOVER CLASS EFFECT TEST');
  
  // Test input panel with hover-from-handle
  console.log('\n🔴 INPUT PANEL + hover-from-handle:');
  inputPanel.classList.add('hover-from-handle');
  
  setTimeout(() => {
    const inputHover = getComputedStyle(inputPanel);
    console.log('- Background:', inputHover.background);
    console.log('- Box-shadow:', inputHover.boxShadow);
    console.log('- Transform:', inputHover.transform);
    
    // Check if it's working
    const inputWorking = inputHover.boxShadow.includes('72px') || inputHover.boxShadow.includes('64px');
    console.log('- Strong shadow effect:', inputWorking ? '✅' : '❌');
    
    inputPanel.classList.remove('hover-from-handle');
    
    // Test output panel with hover-from-handle-primary
    console.log('\n🔵 OUTPUT PANEL + hover-from-handle-primary:');
    outputPanel.classList.add('hover-from-handle-primary');
    
    setTimeout(() => {
      const outputHover = getComputedStyle(outputPanel);
      console.log('- Background:', outputHover.background);
      console.log('- Box-shadow:', outputHover.boxShadow);
      console.log('- Transform:', outputHover.transform);
      
      // Check if it's working
      const outputWorking = outputHover.boxShadow.includes('72px') || outputHover.boxShadow.includes('64px');
      console.log('- Strong shadow effect:', outputWorking ? '✅' : '❌');
      
      outputPanel.classList.remove('hover-from-handle-primary');
      
      console.log('\n📋 PART 3: CSS RULE INSPECTION');
      
      // Try to find what CSS rules are actually being applied
      outputPanel.classList.add('hover-from-handle-primary');
      
      setTimeout(() => {
        // Get all CSS rules that might be affecting this element
        console.log('\n🔍 CHECKING WHAT CSS RULES ARE ACTIVE:');
        
        // Check if our expected CSS values are being applied
        const expectedBackground = 'rgba(28, 25, 23, var(--glass-focus))';
        const expectedShadow = '0 28px 72px 0 rgba(220, 8, 8, 0.8)';
        const expectedTransform = 'translateY(-2px)';
        
        console.log('\n📝 EXPECTED vs ACTUAL:');
        console.log('Expected background contains "28, 25, 23":', outputHover.background.includes('28, 25, 23'));
        console.log('Expected shadow contains "72px":', outputHover.boxShadow.includes('72px'));
        console.log('Expected transform contains "translateY":', outputHover.transform.includes('translateY'));
        
        // Check CSS custom properties
        const styles = getComputedStyle(outputPanel);
        console.log('\n🎨 CSS CUSTOM PROPERTIES:');
        console.log('--glass-focus:', styles.getPropertyValue('--glass-focus'));
        console.log('--glass-panel:', styles.getPropertyValue('--glass-panel'));
        console.log('--glass-strong:', styles.getPropertyValue('--glass-strong'));
        
        outputPanel.classList.remove('hover-from-handle-primary');
        
        console.log('\n📋 PART 4: DIRECT CSS RULE TEST');
        
        // Test if we can apply the styles directly
        console.log('\n🧪 APPLYING STYLES DIRECTLY:');
        
        const directStyles = {
          background: 'rgba(28, 25, 23, 0.2) !important',
          borderColor: 'rgba(220, 8, 8, 0.8) !important',
          boxShadow: '0 28px 72px 0 rgba(220, 8, 8, 0.8), 0 14px 40px 0 rgba(220, 8, 8, 0.6), 0 8px 24px 0 rgba(220, 8, 8, 0.4) !important',
          transform: 'translateY(-2px)'
        };
        
        // Apply styles directly
        Object.entries(directStyles).forEach(([prop, value]) => {
          outputPanel.style[prop] = value;
        });
        
        setTimeout(() => {
          const directResult = getComputedStyle(outputPanel);
          console.log('Direct style application:');
          console.log('- Background:', directResult.background);
          console.log('- Box-shadow:', directResult.boxShadow);
          console.log('- Transform:', directResult.transform);
          
          const directWorking = directResult.boxShadow.includes('72px') && directResult.transform.includes('translateY');
          console.log('- Direct styles working:', directWorking ? '✅' : '❌');
          
          // Clean up
          outputPanel.style.cssText = '';
          
          console.log('\n🎯 DIAGNOSIS:');
          if (inputWorking && !outputWorking && directWorking) {
            console.log('🎯 ROOT CAUSE: CSS rule specificity issue');
            console.log('💡 SOLUTION: Our CSS rule is being overridden by higher specificity rules');
            console.log('🔧 FIX: Need to increase specificity of our hover-from-handle-primary rule');
          } else if (inputWorking && !outputWorking && !directWorking) {
            console.log('🎯 ROOT CAUSE: CSS property conflict');
            console.log('💡 SOLUTION: Some CSS property is preventing the effects from showing');
            console.log('🔧 FIX: Need to identify and override the conflicting property');
          } else if (!inputWorking) {
            console.log('🎯 ROOT CAUSE: General CSS issue affecting both panels');
            console.log('💡 SOLUTION: The CSS rules themselves might be broken');
          } else {
            console.log('🎯 ROOT CAUSE: Unknown - need more investigation');
          }
          
        }, 100);
        
      }, 100);
      
    }, 100);
    
  }, 100);
  
} else {
  console.log('❌ Could not find required elements');
}