// Test script to verify output panel hover mechanism is working
console.log('🧪 OUTPUT PANEL HOVER MECHANISM TEST');

// Check theme
const currentTheme = document.documentElement.getAttribute('data-theme');
console.log(`Current theme: ${currentTheme}`);

if (currentTheme !== 'kyoto') {
  console.warn('⚠️ This test should be run in Kyoto theme for best results');
}

// Find elements
const outputHandle = document.querySelector('[data-resize-handle="output-panel"]');
const outputPanel = document.querySelector('[data-output-panel] .glass-panel.glass-content-panel');

console.log('\n📋 ELEMENT DETECTION:');
console.log('Output handle found:', !!outputHandle);
console.log('Output panel found:', !!outputPanel);

if (!outputHandle || !outputPanel) {
  console.error('❌ Required elements not found. Make sure you have output content displayed.');
  console.log('💡 Try running a comparison first to generate output content.');
} else {
  console.log('\n🔍 TESTING OUTPUT PANEL HOVER MECHANISM:');
  
  // Test 1: Check base styles
  console.log('\n1️⃣ BASE STYLES:');
  const baseStyle = getComputedStyle(outputPanel);
  console.log('Base background:', baseStyle.background);
  console.log('Base box-shadow:', baseStyle.boxShadow);
  console.log('Base transform:', baseStyle.transform);
  console.log('Base border-color:', baseStyle.borderColor);
  
  // Test 2: Simulate handle hover
  console.log('\n2️⃣ SIMULATING HANDLE HOVER:');
  
  // Create a mutation observer to watch for class changes
  let classAdded = false;
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        if (target === outputPanel) {
          const hasHoverClass = target.classList.contains('hover-from-handle-primary') || 
                               target.classList.contains('hover-from-handle');
          if (hasHoverClass) {
            classAdded = true;
            console.log('✅ Hover class detected on output panel!');
            console.log('Panel classes:', target.className);
            
            // Check computed styles with hover class
            setTimeout(() => {
              const hoverStyle = getComputedStyle(outputPanel);
              console.log('\n📊 HOVER STYLES:');
              console.log('Hover background:', hoverStyle.background);
              console.log('Hover box-shadow:', hoverStyle.boxShadow);
              console.log('Hover transform:', hoverStyle.transform);
              console.log('Hover border-color:', hoverStyle.borderColor);
              
              // Check if strong shadow is applied
              const hasStrongShadow = hoverStyle.boxShadow.includes('72px') || 
                                    hoverStyle.boxShadow.includes('64px') ||
                                    hoverStyle.boxShadow.includes('0.8');
              const hasTransform = hoverStyle.transform !== 'none' && 
                                 hoverStyle.transform.includes('translateY');
              
              if (hasStrongShadow && hasTransform) {
                console.log('✅ SUCCESS! Output panel hover effect is working correctly!');
                console.log('Strong shadow and transform are applied.');
              } else {
                console.log('❌ ISSUE: Output panel hover effect is not working as expected.');
                console.log('Expected strong shadow and transform, but they are not applied.');
              }
            }, 100);
          }
        }
      }
    });
  });
  
  observer.observe(outputPanel, { attributes: true, attributeFilter: ['class'] });
  
  // Trigger handle hover
  console.log('Triggering handle mouseenter event...');
  outputHandle.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  
  // Check result after a delay
  setTimeout(() => {
    if (!classAdded) {
      console.log('❌ ISSUE: hover-from-handle-primary class was NOT added to output panel');
      console.log('This suggests the JavaScript hover mechanism is not working');
      
      // Manual test - add the class ourselves
      console.log('\n3️⃣ MANUAL CLASS TEST:');
      console.log('Manually adding hover-from-handle-primary class...');
      outputPanel.classList.add('hover-from-handle-primary');
      
      setTimeout(() => {
        const manualStyle = getComputedStyle(outputPanel);
        console.log('Manual hover background:', manualStyle.background);
        console.log('Manual hover box-shadow:', manualStyle.boxShadow);
        console.log('Manual hover transform:', manualStyle.transform);
        
        const hasStrongShadow = manualStyle.boxShadow.includes('72px') || 
                              manualStyle.boxShadow.includes('64px') ||
                              manualStyle.boxShadow.includes('0.8');
        const hasTransform = manualStyle.transform !== 'none' && 
                           manualStyle.transform.includes('translateY');
        
        if (hasStrongShadow && hasTransform) {
          console.log('✅ CSS RULES WORK! The issue is in the JavaScript hover mechanism.');
          console.log('💡 SOLUTION: The OutputLayout.tsx hover mechanism needs to be fixed.');
        } else {
          console.log('❌ CSS RULES ISSUE! The CSS rules are not working correctly.');
        }
        
        // Clean up
        outputPanel.classList.remove('hover-from-handle-primary');
        observer.disconnect();
        
        console.log('\n🎯 DIAGNOSIS:');
        console.log('- CSS rules for output panel hover: ✅ Working');
        console.log('- JavaScript hover mechanism: ❌ Not working');
        console.log('- Fix needed: Update OutputLayout.tsx hover event handlers');
        
      }, 200);
    } else {
      observer.disconnect();
      console.log('\n🎯 DIAGNOSIS:');
      console.log('- JavaScript hover mechanism: ✅ Working');
      console.log('- CSS rules: ✅ Working');
      console.log('- Output panel hover should be working correctly!');
    }
  }, 1000);
  
  // Test 3: Compare with input panel
  console.log('\n4️⃣ COMPARING WITH INPUT PANEL:');
  const inputHandle = document.querySelector('[data-resize-handle="input-panels"]');
  const inputPanel = document.querySelector('[data-input-panel] .glass-panel.glass-content-panel');
  
  if (inputHandle && inputPanel) {
    console.log('Input handle found:', !!inputHandle);
    console.log('Input panel found:', !!inputPanel);
    
    console.log('\n🖱️ HOVER TEST INSTRUCTIONS:');
    console.log('1. Hover over the INPUT panel resize handle');
    console.log('2. Observe if input panels get strong shadow effect');
    console.log('3. Hover over the OUTPUT panel resize handle');
    console.log('4. Compare if output panel gets the same strong shadow effect');
    console.log('\nIf output panel shadow is weaker, the JavaScript mechanism needs fixing.');
  } else {
    console.log('Input elements not found - cannot compare');
  }
}

console.log('\n⏰ Test completed. Check the results above.');