// Classic Dark Theme Header Components Test
// Tests FontSizeSelector "Aa" text and ThemeSelector button styling

console.log('🌑 CLASSIC DARK HEADER COMPONENTS TEST');
console.log('Testing FontSizeSelector and ThemeSelector styling consistency');

// Test 1: FontSizeSelector Text Color Inheritance
console.log('\n1️⃣ FONTSIZESELECTOR TEXT COLOR TEST:');

const fontSizeSelectors = document.querySelectorAll('.segmented-control.font-size-control');
console.log(`Found ${fontSizeSelectors.length} font size selector controls`);

if (fontSizeSelectors.length > 0) {
  const fontSelector = fontSizeSelectors[0];
  const segments = fontSelector.querySelectorAll('.segment');
  
  console.log(`Found ${segments.length} font size segments`);
  
  segments.forEach((segment, index) => {
    const segmentStyle = window.getComputedStyle(segment);
    const span = segment.querySelector('span');
    
    if (span) {
      const spanStyle = window.getComputedStyle(span);
      
      console.log(`Segment ${index + 1}:`);
      console.log(`  - Segment color: ${segmentStyle.color}`);
      console.log(`  - Span color: ${spanStyle.color}`);
      console.log(`  - Font size: ${spanStyle.fontSize}`);
      
      // Check if colors match theme success color
      const expectedColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-text-success').trim();
      console.log(`  - Expected theme success color: ${expectedColor}`);
      
      // Check color inheritance
      const colorsMatch = segmentStyle.color === spanStyle.color;
      console.log(`  - Color inheritance: ${colorsMatch ? '✅' : '❌'}`);
    }
  });
} else {
  console.log('⚠️ No font size selectors found');
}

// Test 2: ThemeSelector Button Styling
console.log('\n2️⃣ THEMESELECTOR BUTTON TEST:');

const themeSelectors = document.querySelectorAll('.segmented-control:not(.font-size-control)');
console.log(`Found ${themeSelectors.length} theme selector controls`);

if (themeSelectors.length > 0) {
  const themeSelector = themeSelectors[0];
  const themeButton = themeSelector.querySelector('.segment');
  
  if (themeButton) {
    const buttonStyle = window.getComputedStyle(themeButton);
    
    console.log('Theme Selector Button:');
    console.log(`  - Color: ${buttonStyle.color}`);
    console.log(`  - Background: ${buttonStyle.background}`);
    console.log(`  - Border: ${buttonStyle.border}`);
    
    // Check for palette icon
    const paletteIcon = themeButton.querySelector('svg');
    if (paletteIcon) {
      const iconStyle = window.getComputedStyle(paletteIcon);
      console.log(`  - Icon color: ${iconStyle.color || 'inherited'}`);
      console.log('✅ Palette icon found');
    } else {
      console.log('⚠️ Palette icon not found');
    }
  }
} else {
  console.log('⚠️ No theme selectors found');
}

// Test 3: Segmented Control Hover Effects
console.log('\n3️⃣ SEGMENTED CONTROL HOVER EFFECTS:');

const allSegmentedControls = document.querySelectorAll('.segmented-control');
console.log(`Found ${allSegmentedControls.length} segmented controls total`);

if (allSegmentedControls.length > 0) {
  const testControl = allSegmentedControls[0];
  const originalStyle = window.getComputedStyle(testControl);
  
  console.log('Original segmented control styles:');
  console.log(`  - Background: ${originalStyle.background}`);
  console.log(`  - Border: ${originalStyle.border}`);
  
  // Simulate hover
  testControl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  
  setTimeout(() => {
    const hoverStyle = window.getComputedStyle(testControl);
    
    console.log('Hover segmented control styles:');
    console.log(`  - Background: ${hoverStyle.background}`);
    console.log(`  - Border: ${hoverStyle.border}`);
    
    const backgroundChanged = originalStyle.background !== hoverStyle.background;
    const borderChanged = originalStyle.border !== hoverStyle.border;
    
    console.log(`  - Background changed: ${backgroundChanged ? '✅' : '❌'}`);
    console.log(`  - Border changed: ${borderChanged ? '✅' : '❌'}`);
    
    // Clean up
    testControl.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
  }, 100);
}

// Test 4: CSS Variable Integration
console.log('\n4️⃣ CSS VARIABLE INTEGRATION:');

const themeVariables = [
  '--theme-text-success',
  '--theme-glass-panel-hover-bg-rgb',
  '--theme-glass-panel-hover-border-rgb',
  '--theme-glass-panel-bg-rgb',
  '--theme-glass-panel-border-rgb'
];

const rootStyle = getComputedStyle(document.documentElement);

themeVariables.forEach(variable => {
  const value = rootStyle.getPropertyValue(variable);
  if (value && value.trim()) {
    console.log(`✅ ${variable}: ${value.trim()}`);
  } else {
    console.log(`❌ ${variable}: Not found or empty`);
  }
});

// Test 5: Theme Consistency Check
console.log('\n5️⃣ THEME CONSISTENCY CHECK:');

const currentTheme = document.documentElement.getAttribute('data-theme');
console.log(`Current theme: ${currentTheme}`);

if (currentTheme === 'classic-dark') {
  console.log('✅ Classic Dark theme is active');
  
  // Check if all segmented controls have consistent styling
  let consistentStyling = true;
  const referenceColor = rootStyle.getPropertyValue('--theme-text-success').trim();
  
  allSegmentedControls.forEach((control, index) => {
    const segments = control.querySelectorAll('.segment');
    segments.forEach((segment, segIndex) => {
      const segmentStyle = window.getComputedStyle(segment);
      
      // Check if segment uses theme success color (for active/interactive states)
      if (segment.classList.contains('active')) {
        const isUsingThemeColor = segmentStyle.color.includes('56, 189, 248') || // Light blue RGB
                                  segmentStyle.color.includes('#38bdf8'); // Light blue hex
        
        if (!isUsingThemeColor) {
          consistentStyling = false;
          console.log(`⚠️ Control ${index + 1}, Segment ${segIndex + 1}: Not using theme success color`);
        }
      }
    });
  });
  
  console.log(`Theme consistency: ${consistentStyling ? '✅ All controls styled consistently' : '❌ Styling inconsistencies found'}`);
} else {
  console.log('⚠️ Classic Dark theme is not active - test may not be accurate');
}

// Test 6: Accessibility Check
console.log('\n6️⃣ ACCESSIBILITY CHECK:');

allSegmentedControls.forEach((control, index) => {
  const segments = control.querySelectorAll('.segment');
  
  segments.forEach((segment, segIndex) => {
    const hasAriaLabel = segment.hasAttribute('aria-label') || segment.hasAttribute('aria-labelledby');
    const hasRole = segment.hasAttribute('role') || segment.tagName.toLowerCase() === 'button';
    const isFocusable = segment.tabIndex >= 0 || segment.tagName.toLowerCase() === 'button';
    
    console.log(`Control ${index + 1}, Segment ${segIndex + 1}:`);
    console.log(`  - Aria label: ${hasAriaLabel ? '✅' : '❌'}`);
    console.log(`  - Role/Button: ${hasRole ? '✅' : '❌'}`);
    console.log(`  - Focusable: ${isFocusable ? '✅' : '❌'}`);
  });
});

console.log('\n🏁 HEADER COMPONENTS TEST COMPLETE');
console.log('Classic Dark theme header components styling validated');