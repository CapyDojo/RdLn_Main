// Test the overlay exclusion fix
console.log('🧪 Testing Overlay Exclusion Fix');

function testOverlayExclusion() {
  console.log('\n=== Finding OCR Elements ===');
  
  // Find OCR elements more reliably
  const allButtons = Array.from(document.querySelectorAll('button'));
  const autoButtons = allButtons.filter(btn => btn.textContent?.includes('🤖 Auto'));
  
  console.log('Found Auto buttons:', autoButtons.length);
  
  let ocrAutoButton = null;
  let ocrManualButton = null;
  let segmentedControl = null;
  
  // Find the OCR segmented control
  for (const autoBtn of autoButtons) {
    const parent = autoBtn.parentElement;
    if (parent && parent.classList.contains('segmented-control')) {
      const manualBtn = parent.querySelector('button:last-child');
      if (manualBtn && manualBtn.textContent?.includes('☰')) {
        ocrAutoButton = autoBtn;
        ocrManualButton = manualBtn;
        segmentedControl = parent;
        console.log('✅ Found OCR segmented control');
        break;
      }
    }
  }
  
  if (!ocrAutoButton || !ocrManualButton || !segmentedControl) {
    console.log('❌ Could not find OCR elements');
    return;
  }
  
  // Check current state
  const isAutoActive = ocrAutoButton.classList.contains('active');
  console.log('Current state - Auto active:', isAutoActive);
  
  if (isAutoActive) {
    console.log('Switching to manual mode to test...');
    ocrManualButton.click();
    
    setTimeout(() => {
      testAutoButtonAccessibility(ocrAutoButton, segmentedControl);
    }, 300);
  } else {
    testAutoButtonAccessibility(ocrAutoButton, segmentedControl);
  }
}

function testAutoButtonAccessibility(autoButton, segmentedControl) {
  console.log('\n=== Testing Auto Button Accessibility ===');
  
  // Check if dropdown is open
  const dropdown = document.querySelector('.glass-panel');
  console.log('Dropdown open:', !!dropdown);
  
  if (!dropdown) {
    console.log('❌ Dropdown not open - cannot test overlay exclusion');
    return;
  }
  
  // Test what element is at the auto button position
  const buttonRect = autoButton.getBoundingClientRect();
  const centerX = buttonRect.left + buttonRect.width / 2;
  const centerY = buttonRect.top + buttonRect.height / 2;
  
  console.log('Auto button rect:', {
    left: Math.round(buttonRect.left),
    top: Math.round(buttonRect.top),
    width: Math.round(buttonRect.width),
    height: Math.round(buttonRect.height)
  });
  
  const elementAtCenter = document.elementFromPoint(centerX, centerY);
  console.log('Element at auto button center:', elementAtCenter?.tagName, elementAtCenter?.className);
  console.log('Is it the auto button?', elementAtCenter === autoButton);
  console.log('Is it in segmented control?', segmentedControl.contains(elementAtCenter));
  
  // Test multiple points on the button
  const testPoints = [
    { x: buttonRect.left + 5, y: buttonRect.top + 5, name: 'top-left' },
    { x: buttonRect.right - 5, y: buttonRect.top + 5, name: 'top-right' },
    { x: centerX, y: centerY, name: 'center' },
    { x: buttonRect.left + 5, y: buttonRect.bottom - 5, name: 'bottom-left' },
    { x: buttonRect.right - 5, y: buttonRect.bottom - 5, name: 'bottom-right' }
  ];
  
  console.log('\nTesting multiple points on auto button:');
  let accessiblePoints = 0;
  
  testPoints.forEach(point => {
    const element = document.elementFromPoint(point.x, point.y);
    const isAccessible = element === autoButton || segmentedControl.contains(element);
    if (isAccessible) accessiblePoints++;
    
    console.log(`  ${point.name}: ${isAccessible ? '✅' : '❌'} ${element?.tagName || 'null'}`);
  });
  
  console.log(`\nAccessibility score: ${accessiblePoints}/${testPoints.length} points accessible`);
  
  if (accessiblePoints === testPoints.length) {
    console.log('🎉 SUCCESS: Auto button is fully accessible!');
    testHoverEffect(autoButton);
  } else if (accessiblePoints > 0) {
    console.log('⚠️ PARTIAL: Auto button partially accessible');
  } else {
    console.log('❌ FAILED: Auto button still blocked by overlay');
  }
}

function testHoverEffect(autoButton) {
  console.log('\n=== Testing Hover Effect ===');
  
  // Get initial styles
  const initialStyle = window.getComputedStyle(autoButton);
  const initialBackground = initialStyle.backgroundColor;
  const initialTransform = initialStyle.transform;
  
  console.log('Initial styles:', {
    background: initialBackground,
    transform: initialTransform
  });
  
  // Simulate mouseenter
  console.log('Simulating hover...');
  const mouseEnterEvent = new MouseEvent('mouseenter', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  
  autoButton.dispatchEvent(mouseEnterEvent);
  
  // Check if styles changed
  setTimeout(() => {
    const hoverStyle = window.getComputedStyle(autoButton);
    const hoverBackground = hoverStyle.backgroundColor;
    const hoverTransform = hoverStyle.transform;
    
    console.log('Hover styles:', {
      background: hoverBackground,
      transform: hoverTransform
    });
    
    const backgroundChanged = hoverBackground !== initialBackground;
    const transformChanged = hoverTransform !== initialTransform;
    
    if (backgroundChanged || transformChanged) {
      console.log('✅ Hover effect working!');
    } else {
      console.log('❌ Hover effect not working - button still blocked');
    }
    
    // Clean up - simulate mouseleave
    const mouseLeaveEvent = new MouseEvent('mouseleave', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    autoButton.dispatchEvent(mouseLeaveEvent);
  }, 100);
}

// Run the test
testOverlayExclusion();

console.log('\n📋 This test will:');
console.log('1. Find the OCR segmented control');
console.log('2. Open the dropdown if needed');
console.log('3. Test if the auto button is accessible');
console.log('4. Test if hover effects work');
console.log('5. Verify the overlay exclusion is working');