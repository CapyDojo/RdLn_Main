// Test z-index fix for OCR Auto button
console.log('🧪 Testing Z-Index Fix for OCR Auto Button');

function testZIndexFix() {
  console.log('\n=== Z-Index Analysis ===');
  
  // Find all segmented controls
  const segmentedControls = document.querySelectorAll('.segmented-control');
  console.log('Found segmented controls:', segmentedControls.length);
  
  segmentedControls.forEach((control, i) => {
    const style = window.getComputedStyle(control);
    const zIndex = style.zIndex;
    const position = style.position;
    
    console.log(`Control ${i + 1}:`);
    console.log('  z-index:', zIndex);
    console.log('  position:', position);
    console.log('  classes:', control.className);
    
    // Check if this is the OCR control
    const autoButton = control.querySelector('button');
    if (autoButton && autoButton.textContent?.includes('Auto')) {
      console.log('  ✅ This is the OCR control');
      testOCRControl(control, autoButton);
    }
  });
}

function testOCRControl(control, autoButton) {
  console.log('\n=== OCR Control Test ===');
  
  // Check if manual button exists
  const manualButton = control.querySelector('button:last-child');
  if (!manualButton) {
    console.log('❌ Manual button not found');
    return;
  }
  
  console.log('Auto button text:', autoButton.textContent?.trim());
  console.log('Manual button text:', manualButton.textContent?.trim());
  
  // Check current state
  const isAutoActive = autoButton.classList.contains('active');
  console.log('Auto currently active:', isAutoActive);
  
  // If auto is active, switch to manual to open dropdown
  if (isAutoActive) {
    console.log('Switching to manual to test...');
    manualButton.click();
    
    setTimeout(() => {
      testAutoClickWithDropdown(control, autoButton);
    }, 300);
  } else {
    // Check if dropdown is already open
    const dropdown = document.querySelector('.glass-panel');
    if (dropdown) {
      testAutoClickWithDropdown(control, autoButton);
    } else {
      console.log('Opening dropdown...');
      manualButton.click();
      setTimeout(() => {
        testAutoClickWithDropdown(control, autoButton);
      }, 300);
    }
  }
}

function testAutoClickWithDropdown(control, autoButton) {
  console.log('\n=== Testing Auto Click with Dropdown Open ===');
  
  // Check z-index hierarchy
  const controlStyle = window.getComputedStyle(control);
  const controlZIndex = controlStyle.zIndex;
  
  const dropdown = document.querySelector('.glass-panel');
  const overlay = document.querySelector('[class*="fixed inset-0"]');
  
  console.log('Control z-index:', controlZIndex);
  
  if (overlay) {
    const overlayStyle = window.getComputedStyle(overlay);
    console.log('Overlay z-index:', overlayStyle.zIndex);
    console.log('Overlay pointer-events:', overlayStyle.pointerEvents);
  }
  
  if (dropdown) {
    const dropdownStyle = window.getComputedStyle(dropdown);
    console.log('Dropdown z-index:', dropdownStyle.zIndex);
  }
  
  // Test what element is at the auto button position
  const buttonRect = autoButton.getBoundingClientRect();
  const centerX = buttonRect.left + buttonRect.width / 2;
  const centerY = buttonRect.top + buttonRect.height / 2;
  const elementAtCenter = document.elementFromPoint(centerX, centerY);
  
  console.log('Element at auto button center:', elementAtCenter?.tagName, elementAtCenter?.textContent?.trim());
  console.log('Is it the auto button?', elementAtCenter === autoButton);
  
  // Test the click
  console.log('\nTesting auto button click...');
  
  const beforeState = {
    autoActive: autoButton.classList.contains('active'),
    dropdownExists: !!document.querySelector('.glass-panel')
  };
  
  console.log('Before click:', beforeState);
  
  // Add event listener
  let clickFired = false;
  const clickListener = () => {
    clickFired = true;
    console.log('✅ Auto button click event fired!');
  };
  
  autoButton.addEventListener('click', clickListener, { once: true });
  
  // Click the button
  autoButton.click();
  
  // Check results
  setTimeout(() => {
    const afterState = {
      autoActive: autoButton.classList.contains('active'),
      dropdownExists: !!document.querySelector('.glass-panel'),
      clickFired: clickFired
    };
    
    console.log('After click:', afterState);
    
    if (afterState.autoActive && !afterState.dropdownExists && afterState.clickFired) {
      console.log('🎉 SUCCESS: Auto button works in one click!');
    } else if (afterState.clickFired) {
      console.log('⚠️ PARTIAL: Click fired but state not fully correct');
    } else {
      console.log('❌ FAILED: Click not firing');
    }
  }, 200);
}

// Run the test
testZIndexFix();

console.log('\n📋 Manual Test:');
console.log('1. Click Manual (☰) to open dropdown');
console.log('2. Click Auto button');
console.log('3. Should work in one click now!');