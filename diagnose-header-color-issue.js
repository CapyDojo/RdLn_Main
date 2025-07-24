// Diagnose Header Color Issue - Find the Root Cause
console.log('🔍 DIAGNOSING HEADER COLOR ISSUE');
console.log('================================');

// Find the problematic header
const headers = document.querySelectorAll('h1, h2, h3');
if (headers.length === 0) {
  console.log('❌ No headers found');
} else {
  const header = headers[0];
  console.log(`\n📝 Analyzing header: ${header.tagName}`);
  console.log(`Classes: ${header.className}`);
  console.log(`Current color: ${window.getComputedStyle(header).color}`);
  
  // Get all CSS rules that apply to this element
  console.log('\n🔍 CSS Rules Analysis:');
  
  // Check what CSS variables are available
  const themeTextHeader = getComputedStyle(document.documentElement).getPropertyValue('--theme-text-header').trim();
  const themeTextInteractive = getComputedStyle(document.documentElement).getPropertyValue('--theme-text-interactive').trim();
  
  console.log(`--theme-text-header: ${themeTextHeader}`);
  console.log(`--theme-text-interactive: ${themeTextInteractive}`);
  
  // Test if our CSS rule is being applied
  console.log('\n🧪 Testing CSS Rule Application:');
  
  // Create a test element with same classes
  const testHeader = document.createElement('h3');
  testHeader.className = header.className;
  testHeader.style.display = 'none';
  testHeader.textContent = 'Test';
  document.body.appendChild(testHeader);
  
  const testColor = window.getComputedStyle(testHeader).color;
  console.log(`Test element color: ${testColor}`);
  
  // Remove test element
  document.body.removeChild(testHeader);
  
  // Check if there are any inline styles
  console.log(`Inline styles: ${header.style.cssText || 'none'}`);
  
  // Try to find the winning CSS rule
  console.log('\n🏆 Finding Winning CSS Rule:');
  
  // Check if removing classes fixes the color
  const originalClasses = header.className;
  header.className = '';
  const colorWithoutClasses = window.getComputedStyle(header).color;
  console.log(`Color without classes: ${colorWithoutClasses}`);
  
  // Restore classes
  header.className = originalClasses;
  
  // Test individual classes
  const classes = originalClasses.split(' ');
  console.log('\n🔍 Testing individual classes:');
  
  classes.forEach(className => {
    if (className.trim()) {
      header.className = className;
      const colorWithSingleClass = window.getComputedStyle(header).color;
      console.log(`With .${className}: ${colorWithSingleClass}`);
    }
  });
  
  // Restore original classes
  header.className = originalClasses;
  
  // Check computed style details
  console.log('\n📊 Computed Style Details:');
  const computedStyle = window.getComputedStyle(header);
  console.log(`Font weight: ${computedStyle.fontWeight}`);
  console.log(`Font size: ${computedStyle.fontSize}`);
  console.log(`Display: ${computedStyle.display}`);
  
  // Test our specific selector
  console.log('\n🎯 Testing Our Selector:');
  const ourSelector = `html[data-theme="professional"] h3.text-theme-primary-900`;
  console.log(`Our selector: ${ourSelector}`);
  
  // Check if element matches our selector
  const matchesOurSelector = header.matches('h3.text-theme-primary-900') && 
                            document.documentElement.getAttribute('data-theme') === 'professional';
  console.log(`Matches our selector: ${matchesOurSelector}`);
  
  // Final recommendation
  console.log('\n💡 RECOMMENDATIONS:');
  if (testColor !== window.getComputedStyle(header).color) {
    console.log('❌ CSS rule not applying correctly - specificity issue');
    console.log('🔧 Need higher specificity or different approach');
  } else {
    console.log('✅ CSS rule is applying');
    console.log('🔧 Issue might be elsewhere');
  }
}

console.log('\n✅ Diagnosis complete!');