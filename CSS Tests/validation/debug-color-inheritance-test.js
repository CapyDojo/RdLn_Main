// Targeted Color Inheritance Debug Test
// Testing why FontSizeSelector "Aa" text doesn't inherit --theme-text-body

console.log('🎯 TARGETED DEBUG: FontSizeSelector Color Inheritance');
console.log('===================================================');

// Set theme to classic-light for testing
document.documentElement.setAttribute('data-theme', 'classic-light');

// Wait for styles to apply
setTimeout(() => {
  console.log('\n📊 CSS VARIABLE VALUES');
  const htmlStyle = getComputedStyle(document.documentElement);
  const themeTextBody = htmlStyle.getPropertyValue('--theme-text-body').trim();
  console.log(`--theme-text-body: ${themeTextBody}`);
  
  // Create test elements to compare inheritance
  console.log('\n🧪 INHERITANCE TEST ELEMENTS');
  
  // Test 1: Direct theme inheritance
  const testDiv = document.createElement('div');
  testDiv.setAttribute('data-theme', 'classic-light');
  testDiv.textContent = 'Test text';
  testDiv.style.position = 'fixed';
  testDiv.style.top = '10px';
  testDiv.style.left = '10px';
  testDiv.style.zIndex = '9999';
  document.body.appendChild(testDiv);
  
  const testDivStyle = getComputedStyle(testDiv);
  console.log(`Test div color: ${testDivStyle.color}`);
  
  // Test 2: Button element (like FontSizeSelector)
  const testButton = document.createElement('button');
  testButton.className = 'segment';
  testButton.textContent = 'Test button';
  testButton.style.position = 'fixed';
  testButton.style.top = '50px';
  testButton.style.left = '10px';
  testButton.style.zIndex = '9999';
  document.body.appendChild(testButton);
  
  const testButtonStyle = getComputedStyle(testButton);
  console.log(`Test button color: ${testButtonStyle.color}`);
  
  // Test 3: Button with span (exact FontSizeSelector structure)
  const testButtonWithSpan = document.createElement('button');
  testButtonWithSpan.className = 'segment';
  const testSpan = document.createElement('span');
  testSpan.className = 'font-bold leading-none font-serif libertinus-math-text';
  testSpan.textContent = 'Aa';
  testButtonWithSpan.appendChild(testSpan);
  testButtonWithSpan.style.position = 'fixed';
  testButtonWithSpan.style.top = '90px';
  testButtonWithSpan.style.left = '10px';
  testButtonWithSpan.style.zIndex = '9999';
  document.body.appendChild(testButtonWithSpan);
  
  const testSpanStyle = getComputedStyle(testSpan);
  console.log(`Test span (Aa) color: ${testSpanStyle.color}`);
  
  // Test 4: Segmented control container
  const testSegmentedControl = document.createElement('div');
  testSegmentedControl.className = 'segmented-control font-size-control';
  const testSegmentButton = document.createElement('button');
  testSegmentButton.className = 'segment';
  const testSegmentSpan = document.createElement('span');
  testSegmentSpan.className = 'font-bold leading-none font-serif libertinus-math-text';
  testSegmentSpan.textContent = 'Aa';
  testSegmentButton.appendChild(testSegmentSpan);
  testSegmentedControl.appendChild(testSegmentButton);
  testSegmentedControl.style.position = 'fixed';
  testSegmentedControl.style.top = '130px';
  testSegmentedControl.style.left = '10px';
  testSegmentedControl.style.zIndex = '9999';
  document.body.appendChild(testSegmentedControl);
  
  const testSegmentedSpanStyle = getComputedStyle(testSegmentSpan);
  console.log(`Segmented control span color: ${testSegmentedSpanStyle.color}`);
  
  // Analysis
  console.log('\n🔍 INHERITANCE ANALYSIS');
  const expectedColor = themeTextBody;
  const colors = [
    { element: 'div', color: testDivStyle.color },
    { element: 'button', color: testButtonStyle.color },
    { element: 'span in button', color: testSpanStyle.color },
    { element: 'segmented span', color: testSegmentedSpanStyle.color }
  ];
  
  colors.forEach(item => {
    const inherits = item.color === expectedColor;
    console.log(`${inherits ? '✅' : '❌'} ${item.element}: ${item.color} ${inherits ? '(inherits)' : '(does not inherit)'}`);
  });
  
  // Check for browser default button styles
  console.log('\n🌐 BROWSER DEFAULT ANALYSIS');
  const defaultButton = document.createElement('button');
  document.body.appendChild(defaultButton);
  const defaultButtonStyle = getComputedStyle(defaultButton);
  console.log(`Default button color: ${defaultButtonStyle.color}`);
  document.body.removeChild(defaultButton);
  
  // Check actual FontSizeSelector if it exists
  console.log('\n🎯 ACTUAL FONTSIZESELECTOR ANALYSIS');
  const actualFontSizeSelector = document.querySelector('.font-size-control') || 
                                 Array.from(document.querySelectorAll('.segmented-control'))
                                      .find(el => el.textContent.includes('Aa'));
  
  if (actualFontSizeSelector) {
    const actualButtons = actualFontSizeSelector.querySelectorAll('button');
    actualButtons.forEach((button, i) => {
      if (button.textContent.includes('Aa')) {
        const buttonStyle = getComputedStyle(button);
        const span = button.querySelector('span');
        const spanStyle = span ? getComputedStyle(span) : null;
        
        console.log(`Actual Aa button ${i + 1}:`);
        console.log(`  Button color: ${buttonStyle.color}`);
        console.log(`  Button classes: ${button.className}`);
        if (spanStyle) {
          console.log(`  Span color: ${spanStyle.color}`);
          console.log(`  Span classes: ${span.className}`);
        }
      }
    });
  } else {
    console.log('❌ No actual FontSizeSelector found');
  }
  
  // Clean up test elements after 3 seconds
  setTimeout(() => {
    document.body.removeChild(testDiv);
    document.body.removeChild(testButton);
    document.body.removeChild(testButtonWithSpan);
    document.body.removeChild(testSegmentedControl);
    console.log('\n🧹 Test elements cleaned up');
  }, 3000);
  
  // Provide solution
  console.log('\n💡 SOLUTION RECOMMENDATION');
  if (testSpanStyle.color !== expectedColor) {
    console.log('The issue is that button elements have browser default colors that override inheritance.');
    console.log('Add this CSS to classic-light.css:');
    console.log('');
    console.log('/* Fix FontSizeSelector text color inheritance */');
    console.log('html[data-theme="classic-light"] .segmented-control button,');
    console.log('html[data-theme="classic-light"] .segmented-control .segment {');
    console.log('  color: var(--theme-text-body);');
    console.log('}');
    console.log('');
    console.log('html[data-theme="classic-light"] .segmented-control button span,');
    console.log('html[data-theme="classic-light"] .segmented-control .segment span {');
    console.log('  color: inherit;');
    console.log('}');
  } else {
    console.log('Color inheritance appears to be working correctly.');
  }
  
}, 100);

console.log('Debug script loaded. Results will appear in 100ms...');