// Final test for overlay exclusion approach
console.log('🧪 Final Test: Overlay Exclusion Approach');

function runFinalTest() {
  console.log('\n=== Finding OCR Elements ===');
  
  // Find OCR elements
  const allButtons = Array.from(document.querySelectorAll('button'));
  const autoButtons = allButtons.filter(btn => btn.textContent?.includes('🤖 Auto'));
  
  let ocrAutoButton = null;
  let ocrManualButton = null;
  let segmentedControl = null;
  
  for (const autoBtn of autoButtons) {
    const parent = autoBtn.parentElement;
    if (parent && parent.classList.contains('segmented-control')) {
      const manualBtn = parent.querySelector('button:last-child');
      if (manualBtn && manualBtn.textContent?.includes('☰')) {
        ocrAutoButton = autoBtn;
        ocrManualButton = manualBtn;
        segmentedControl = parent;
        break;
      }
    }
  }
  
  if (!ocrAutoButton || !ocrManualButton || !segmentedControl) {
    console.log('❌ Could not find OCR elements');
    return;
  }
  
  console.log('✅ Found OCR elements');
  
  // Test the complete flow
  testCompleteFlow(ocrAutoButton, ocrManualButton, segmentedControl);
}

function testCompleteFlow(autoButton, manualButton, segmentedControl) {
  console.log('\n=== Testing Complete Flow ===');
  
  // Step 1: Ensure we start in Auto mode
  const isAutoActive = autoButton.classList.contains('active');
  if (!isAutoActive) {
    console.log('Switching to Auto mode first...');
    autoButton.click();
    setTimeout(() => continueTest(), 200);
  } else {
    continueTest();
  }
  
  function continueTest() {
    console.log('✅ Starting in Auto mode');
    
    // Step 2: Switch to Manual mode (open dropdown)
    console.log('Switching to Manual mode (opening dropdown)...');
    manualButton.click();
    
    setTimeout(() => {
      // Step 3: Verify dropdown is open
      const dropdown = document.querySelector('.glass-panel');
      if (!dropdown) {
        console.log('❌ Dropdown did not open');
        return;
      }
      
      console.log('✅ Dropdown opened');
      
      // Step 4: Test Auto button accessibility
      testAutoButtonAccessibility(autoButton, segmentedControl);
      
    }, 300);
  }
}

function testAutoButtonAccessibility(autoButton, segmentedControl) {
  console.log('\n=== Testing Auto Button Accessibility ===');
  
  // Test element detection at auto button
  const buttonRect = autoButton.getBoundingClientRect();
  const centerX = buttonRect.left + buttonRect.width / 2;
  const centerY = buttonRect.top + buttonRect.height / 2;
  
  const elementAtCenter = document.elementFromPoint(centerX, centerY);
  
  console.log('Auto button rect:', {
    left: Math.round(buttonRect.left),
    top: Math.round(buttonRect.top),
    width: Math.round(buttonRect.width),
    height: Math.round(buttonRect.height)
  });
  
  console.log('Element at center:', {
    tag: elementAtCenter?.tagName,
    isAutoButton: elementAtCenter === autoButton,
    isInControl: segmentedControl.contains(elementAtCenter)
  });
  
  // Test hover
  console.log('\n=== Testing Hover ===');
  let hoverWorked = false;
  
  const hoverListener = () => {
    hoverWorked = true;
    console.log('✅ Hover event fired');
  };
  
  autoButton.addEventListener('mouseenter', hoverListener, { once: true });
  
  // Dispatch hover event
  autoButton.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  
  setTimeout(() => {
    if (hoverWorked) {
      console.log('✅ Hover is working');
      testFinalClick(autoButton);
    } else {
      console.log('❌ Hover not working');
      // Try click anyway
      testFinalClick(autoButton);
    }
  }, 100);
}

function testFinalClick(autoButton) {
  console.log('\n=== Final Click Test ===');
  
  // Record before state
  const beforeState = {
    autoActive: autoButton.classList.contains('active'),
    dropdownExists: !!document.querySelector('.glass-panel')
  };
  
  console.log('Before click:', beforeState);
  
  // Add click listener
  let clickFired = false;
  const clickListener = () => {
    clickFired = true;
    console.log('✅ Click event fired');
  };
  
  autoButton.addEventListener('click', clickListener, { once: true });
  
  // Click the button
  console.log('Clicking Auto button...');
  autoButton.click();
  
  // Check results
  setTimeout(() => {
    const afterState = {
      autoActive: autoButton.classList.contains('active'),
      dropdownExists: !!document.querySelector('.glass-panel'),
      clickFired: clickFired
    };
    
    console.log('After click:', afterState);
    
    // Evaluate success
    const success = afterState.autoActive && !afterState.dropdownExists && afterState.clickFired;
    
    if (success) {
      console.log('🎉 COMPLETE SUCCESS!');
      console.log('   ✅ Auto button activated');
      console.log('   ✅ Dropdown closed');
      console.log('   ✅ Click event fired');
      console.log('   ✅ One-click operation achieved!');
    } else {
      console.log('Results analysis:');
      console.log(`   ${afterState.clickFired ? '✅' : '❌'} Click event fired`);
      console.log(`   ${afterState.autoActive ? '✅' : '❌'} Auto activated`);
      console.log(`   ${!afterState.dropdownExists ? '✅' : '❌'} Dropdown closed`);
      
      if (afterState.clickFired && afterState.autoActive && afterState.dropdownExists) {
        console.log('⚠️ Auto activated but dropdown still open');
      } else if (afterState.clickFired && !afterState.autoActive && !afterState.dropdownExists) {
        console.log('⚠️ Dropdown closed but auto not activated');
      } else if (!afterState.clickFired) {
        console.log('❌ Click not firing - button still blocked');
      }
    }
  }, 200);
}

// Run the test
runFinalTest();

console.log('\n📋 This comprehensive test will:');
console.log('1. Find OCR elements');
console.log('2. Start in Auto mode');
console.log('3. Switch to Manual (open dropdown)');
console.log('4. Test Auto button accessibility');
console.log('5. Test hover functionality');
console.log('6. Test one-click Auto activation');