// Test the "hole in overlay" approach
console.log('🧪 Testing Hole in Overlay Approach');

function testHoleApproach() {
  console.log('\n=== Step 1: Find OCR Elements ===');
  
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
    console.log('Available buttons:', allButtons.map(b => b.textContent?.trim()).filter(Boolean));
    return;
  }
  
  console.log('✅ Found OCR elements');
  
  // Ensure we're in manual mode with dropdown open
  const isAutoActive = ocrAutoButton.classList.contains('active');
  if (isAutoActive) {
    console.log('Switching to manual mode...');
    ocrManualButton.click();
    
    setTimeout(() => {
      testAutoButtonAccess(ocrAutoButton, segmentedControl);
    }, 500);
  } else {
    // Check if dropdown is open
    const dropdown = document.querySelector('.glass-panel');
    if (!dropdown) {
      console.log('Opening dropdown...');
      ocrManualButton.click();
      setTimeout(() => {
        testAutoButtonAccess(ocrAutoButton, segmentedControl);
      }, 500);
    } else {
      testAutoButtonAccess(ocrAutoButton, segmentedControl);
    }
  }
}

function testAutoButtonAccess(autoButton, segmentedControl) {
  console.log('\n=== Step 2: Test Auto Button Access ===');
  
  // Verify dropdown is open
  const dropdown = document.querySelector('.glass-panel');
  if (!dropdown) {
    console.log('❌ Dropdown not open');
    return;
  }
  
  console.log('✅ Dropdown is open');
  
  // Test element at auto button center
  const buttonRect = autoButton.getBoundingClientRect();
  const centerX = buttonRect.left + buttonRect.width / 2;
  const centerY = buttonRect.top + buttonRect.height / 2;
  
  const elementAtCenter = document.elementFromPoint(centerX, centerY);
  
  console.log('Element at auto button center:', {
    tag: elementAtCenter?.tagName,
    className: elementAtCenter?.className,
    isAutoButton: elementAtCenter === autoButton,
    isInSegmentedControl: segmentedControl.contains(elementAtCenter)
  });
  
  // Test hover effect
  console.log('\n=== Step 3: Test Hover Effect ===');
  
  // Add hover listener to detect if hover works
  let hoverTriggered = false;
  const hoverListener = () => {
    hoverTriggered = true;
    console.log('✅ Hover event triggered!');
  };
  
  autoButton.addEventListener('mouseenter', hoverListener, { once: true });
  
  // Simulate hover
  const hoverEvent = new MouseEvent('mouseenter', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  
  autoButton.dispatchEvent(hoverEvent);
  
  setTimeout(() => {
    if (hoverTriggered) {
      console.log('✅ Hover effect working');
      testAutoButtonClick(autoButton);
    } else {
      console.log('❌ Hover effect not working - button still blocked');
    }
  }, 100);
}

function testAutoButtonClick(autoButton) {
  console.log('\n=== Step 4: Test Auto Button Click ===');
  
  // Record state before click
  const beforeState = {
    autoActive: autoButton.classList.contains('active'),
    dropdownExists: !!document.querySelector('.glass-panel')
  };
  
  console.log('Before click:', beforeState);
  
  // Add click listener
  let clickTriggered = false;
  const clickListener = () => {
    clickTriggered = true;
    console.log('✅ Click event triggered!');
  };
  
  autoButton.addEventListener('click', clickListener, { once: true });
  
  // Click the button
  console.log('Clicking auto button...');
  autoButton.click();
  
  // Check results
  setTimeout(() => {
    const afterState = {
      autoActive: autoButton.classList.contains('active'),
      dropdownExists: !!document.querySelector('.glass-panel'),
      clickTriggered: clickTriggered
    };
    
    console.log('After click:', afterState);
    
    if (afterState.autoActive && !afterState.dropdownExists && afterState.clickTriggered) {
      console.log('🎉 SUCCESS: Auto button works in one click!');
    } else if (afterState.clickTriggered) {
      console.log('⚠️ PARTIAL: Click registered but not fully working');
      if (!afterState.autoActive) console.log('   - Auto not activated');
      if (afterState.dropdownExists) console.log('   - Dropdown still open');
    } else {
      console.log('❌ FAILED: Click not registering - button still blocked');
    }
  }, 200);
}

// Run the test
testHoleApproach();

console.log('\n📋 This test will:');
console.log('1. Find OCR elements');
console.log('2. Ensure dropdown is open');
console.log('3. Test if auto button is accessible');
console.log('4. Test hover and click functionality');