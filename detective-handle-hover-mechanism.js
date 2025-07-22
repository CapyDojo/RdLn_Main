// Detective script to investigate why handle hover works for input but not output
console.log('🕵️ DETECTIVE: HANDLE HOVER MECHANISM INVESTIGATION');

// Find all handles and panels
const inputHandles = document.querySelectorAll('[data-resize-handle="input-panels"]');
const outputHandle = document.querySelector('[data-resize-handle="output-panel"]');
const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
const outputPanel = document.querySelector('[data-output-panel] .glass-panel.glass-content-panel');

console.log(`Found ${inputHandles.length} input handles`);
console.log('Found output handle:', !!outputHandle);
console.log(`Found ${inputPanels.length} input panels`);
console.log('Found output panel:', !!outputPanel);

if (inputHandles.length > 0 && outputHandle && inputPanels.length > 0 && outputPanel) {
  
  console.log('\n📋 PART 1: HANDLE COMPARISON');
  
  const inputHandle = inputHandles[0]; // Use first input handle for comparison
  
  // Compare handle properties
  console.log('\n🔧 HANDLE BASICS:');
  console.log('Input handle tag:', inputHandle.tagName);
  console.log('Output handle tag:', outputHandle.tagName);
  console.log('Input handle classes:', inputHandle.className);
  console.log('Output handle classes:', outputHandle.className);
  
  // Compare handle attributes
  console.log('\n🏷️ HANDLE ATTRIBUTES:');
  const inputAttrs = Array.from(inputHandle.attributes).map(a => `${a.name}="${a.value}"`);
  const outputAttrs = Array.from(outputHandle.attributes).map(a => `${a.name}="${a.value}"`);
  
  console.log('Input handle attributes:', inputAttrs);
  console.log('Output handle attributes:', outputAttrs);
  
  // Find attribute differences
  const inputAttrNames = inputAttrs.map(a => a.split('=')[0]);
  const outputAttrNames = outputAttrs.map(a => a.split('=')[0]);
  
  const inputOnlyAttrs = inputAttrNames.filter(a => !outputAttrNames.includes(a));
  const outputOnlyAttrs = outputAttrNames.filter(a => !inputAttrNames.includes(a));
  
  if (inputOnlyAttrs.length > 0) {
    console.log('🔴 Attributes ONLY on input handle:', inputOnlyAttrs);
  }
  if (outputOnlyAttrs.length > 0) {
    console.log('🔵 Attributes ONLY on output handle:', outputOnlyAttrs);
  }
  
  console.log('\n📋 PART 2: EVENT LISTENER INVESTIGATION');
  
  // Function to detect event listeners (limited by browser security)
  function analyzeEventListeners(element, name) {
    console.log(`\n🎧 ${name} EVENT LISTENERS:`);
    
    // Check for common event properties
    const eventProps = ['onmouseenter', 'onmouseleave', 'onmouseover', 'onmouseout', 'onclick'];
    eventProps.forEach(prop => {
      if (element[prop]) {
        console.log(`  ${prop}: Function attached`);
      }
    });
    
    // Try to detect React event listeners (they're usually on a property starting with __)
    const props = Object.getOwnPropertyNames(element);
    const reactProps = props.filter(p => p.startsWith('__react'));
    if (reactProps.length > 0) {
      console.log(`  React properties found: ${reactProps.length}`);
    }
  }
  
  analyzeEventListeners(inputHandle, 'INPUT HANDLE');
  analyzeEventListeners(outputHandle, 'OUTPUT HANDLE');
  
  console.log('\n📋 PART 3: HOVER BEHAVIOR TESTING');
  
  // Track class changes on panels during handle hover
  let inputPanelClassChanges = [];
  let outputPanelClassChanges = [];
  
  // Monitor input panel class changes
  const inputPanel = inputPanels[0];
  const inputObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const newClasses = Array.from(mutation.target.classList);
        inputPanelClassChanges.push({
          timestamp: Date.now(),
          classes: newClasses,
          added: newClasses.filter(c => !mutation.oldValue?.includes(c)),
          removed: mutation.oldValue ? mutation.oldValue.split(' ').filter(c => !newClasses.includes(c)) : []
        });
        console.log('🔴 INPUT PANEL class change:', {
          added: inputPanelClassChanges[inputPanelClassChanges.length - 1].added,
          removed: inputPanelClassChanges[inputPanelClassChanges.length - 1].removed
        });
      }
    });
  });
  
  // Monitor output panel class changes
  const outputObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const newClasses = Array.from(mutation.target.classList);
        outputPanelClassChanges.push({
          timestamp: Date.now(),
          classes: newClasses,
          added: newClasses.filter(c => !mutation.oldValue?.includes(c)),
          removed: mutation.oldValue ? mutation.oldValue.split(' ').filter(c => !newClasses.includes(c)) : []
        });
        console.log('🔵 OUTPUT PANEL class change:', {
          added: outputPanelClassChanges[outputPanelClassChanges.length - 1].added,
          removed: outputPanelClassChanges[outputPanelClassChanges.length - 1].removed
        });
      }
    });
  });
  
  inputObserver.observe(inputPanel, { 
    attributes: true, 
    attributeFilter: ['class'],
    attributeOldValue: true 
  });
  
  outputObserver.observe(outputPanel, { 
    attributes: true, 
    attributeFilter: ['class'],
    attributeOldValue: true 
  });
  
  console.log('\n🖱️ HOVER TEST INSTRUCTIONS:');
  console.log('1. Hover over an INPUT HANDLE (drag handle below input panels)');
  console.log('2. Then hover over the OUTPUT HANDLE (drag handle below output panel)');
  console.log('3. Watch for class changes logged above');
  console.log('4. Test will auto-complete in 15 seconds');
  
  // Auto-complete test after 15 seconds
  setTimeout(() => {
    inputObserver.disconnect();
    outputObserver.disconnect();
    
    console.log('\n📋 PART 4: HOVER TEST RESULTS');
    
    console.log('\n🔴 INPUT HANDLE HOVER RESULTS:');
    if (inputPanelClassChanges.length > 0) {
      console.log(`✅ Input panel had ${inputPanelClassChanges.length} class changes`);
      inputPanelClassChanges.forEach((change, i) => {
        console.log(`  Change ${i + 1}:`, change.added.length > 0 ? `+${change.added.join(', ')}` : '', change.removed.length > 0 ? `-${change.removed.join(', ')}` : '');
      });
      
      // Check for hover-from-handle class
      const hoverFromHandleAdded = inputPanelClassChanges.some(c => c.added.includes('hover-from-handle'));
      if (hoverFromHandleAdded) {
        console.log('✅ SUCCESS: hover-from-handle class was added to input panel!');
      } else {
        console.log('❌ FAILURE: hover-from-handle class was NOT added to input panel');
      }
    } else {
      console.log('❌ No class changes detected on input panel during handle hover');
    }
    
    console.log('\n🔵 OUTPUT HANDLE HOVER RESULTS:');
    if (outputPanelClassChanges.length > 0) {
      console.log(`✅ Output panel had ${outputPanelClassChanges.length} class changes`);
      outputPanelClassChanges.forEach((change, i) => {
        console.log(`  Change ${i + 1}:`, change.added.length > 0 ? `+${change.added.join(', ')}` : '', change.removed.length > 0 ? `-${change.removed.join(', ')}` : '');
      });
      
      // Check for hover-from-handle class
      const hoverFromHandleAdded = outputPanelClassChanges.some(c => c.added.includes('hover-from-handle'));
      if (hoverFromHandleAdded) {
        console.log('✅ SUCCESS: hover-from-handle class was added to output panel!');
      } else {
        console.log('❌ FAILURE: hover-from-handle class was NOT added to output panel');
      }
    } else {
      console.log('❌ No class changes detected on output panel during handle hover');
    }
    
    console.log('\n📋 PART 5: MANUAL VERIFICATION');
    
    // Test if manually adding the class works
    console.log('\n🧪 MANUAL CLASS TEST:');
    console.log('Testing if manually adding hover-from-handle class works...');
    
    outputPanel.classList.add('hover-from-handle');
    
    setTimeout(() => {
      const style = getComputedStyle(outputPanel);
      const hasStrongShadow = style.boxShadow.includes('72px') || style.boxShadow.includes('64px');
      const hasTransform = style.transform !== 'none' && style.transform.includes('translateY');
      
      console.log('Manual hover-from-handle test:');
      console.log('- Background:', style.background);
      console.log('- Box-shadow:', style.boxShadow);
      console.log('- Transform:', style.transform);
      console.log('- Strong shadow:', hasStrongShadow);
      console.log('- Transform effect:', hasTransform);
      
      if (hasStrongShadow && hasTransform) {
        console.log('✅ CSS WORKS: Output panel CAN display hover effect when class is added manually');
        console.log('💡 CONCLUSION: The issue is that JavaScript is not adding the class, not that CSS is broken');
      } else {
        console.log('❌ CSS ISSUE: Output panel hover-from-handle class is not working properly');
      }
      
      // Clean up
      outputPanel.classList.remove('hover-from-handle');
      
      console.log('\n🎯 FINAL DIAGNOSIS:');
      console.log('Input handle → input panel class changes:', inputPanelClassChanges.length > 0 ? '✅' : '❌');
      console.log('Output handle → output panel class changes:', outputPanelClassChanges.length > 0 ? '✅' : '❌');
      console.log('Output panel CSS ready for hover-from-handle:', hasStrongShadow && hasTransform ? '✅' : '❌');
      
      console.log('\n💡 NEXT STEPS:');
      if (inputPanelClassChanges.length > 0 && outputPanelClassChanges.length === 0) {
        console.log('🎯 ROOT CAUSE: JavaScript handle hover mechanism is different for input vs output');
        console.log('🔧 SOLUTION: Need to make output handle hover apply hover-from-handle class to output panel');
      } else if (outputPanelClassChanges.length > 0 && !(hasStrongShadow && hasTransform)) {
        console.log('🎯 ROOT CAUSE: CSS hover-from-handle rules not working for output panel');
        console.log('🔧 SOLUTION: Need to fix CSS specificity for output panel hover-from-handle class');
      } else {
        console.log('🎯 ROOT CAUSE: Unclear - need more investigation');
      }
      
    }, 100);
    
  }, 15000);
  
} else {
  console.log('❌ Could not find all required elements');
  console.log('Missing:', {
    inputHandles: inputHandles.length === 0,
    outputHandle: !outputHandle,
    inputPanels: inputPanels.length === 0,
    outputPanel: !outputPanel
  });
}