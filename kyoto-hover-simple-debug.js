// Kyoto Hover Simple Debug
// This script performs a simplified analysis of hover styles

console.log('🔬 KYOTO HOVER SIMPLE DEBUG');

// STEP 1: Environment Check
console.log('\n📋 STEP 1: ENVIRONMENT CHECK');
const currentTheme = document.documentElement.getAttribute('data-theme');
console.log('Current theme:', currentTheme);

if (currentTheme !== 'kyoto') {
  console.warn('⚠️ Not in Kyoto theme! This test should be run in Kyoto theme.');
}

// STEP 2: Find input panels
console.log('\n📋 STEP 2: FINDING INPUT PANELS');
const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
console.log(`Found ${inputPanels.length} input panels`);

// STEP 3: Check computed styles
console.log('\n📋 STEP 3: CHECKING COMPUTED STYLES');

if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  const computedStyle = getComputedStyle(testPanel);
  
  console.log('Default computed styles:');
  console.log('- Box-shadow:', computedStyle.boxShadow);
  console.log('- Transform:', computedStyle.transform);
  console.log('- Border-color:', computedStyle.borderColor);
  console.log('- Background:', computedStyle.background);
  console.log('- Transition:', computedStyle.transition);
}

// STEP 4: Test direct style application
console.log('\n📋 STEP 4: TESTING DIRECT STYLE APPLICATION');

if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  console.log('Applying hover styles directly to first panel...');
  
  // Save original styles
  const originalBoxShadow = testPanel.style.boxShadow;
  const originalTransform = testPanel.style.transform;
  const originalBorderColor = testPanel.style.borderColor;
  
  // Apply hover styles directly
  testPanel.style.boxShadow = 'rgba(220, 8, 8, 0.7) 0px 30px 80px 0px, rgba(220, 8, 8, 0.5) 0px 12px 40px 0px';
  testPanel.style.transform = 'translateY(-2px)';
  testPanel.style.borderColor = 'rgba(220, 8, 8, 0.6)';
  
  // Check the computed styles after applying direct styles
  setTimeout(() => {
    const directStyle = getComputedStyle(testPanel);
    console.log('\nDirect style application computed styles:');
    console.log('- Box-shadow:', directStyle.boxShadow);
    console.log('- Transform:', directStyle.transform);
    console.log('- Border-color:', directStyle.borderColor);
    
    // Restore original styles
    testPanel.style.boxShadow = originalBoxShadow;
    testPanel.style.transform = originalTransform;
    testPanel.style.borderColor = originalBorderColor;
    console.log('\n🧹 Original styles restored');
  }, 1000);
}

// STEP 5: Test !important style application
console.log('\n📋 STEP 5: TESTING !IMPORTANT STYLE APPLICATION');

if (inputPanels.length > 0) {
  const testPanel = inputPanels[1] || inputPanels[0];
  console.log('Applying hover styles with !important to second panel...');
  
  // Save original styles
  const originalBoxShadow = testPanel.style.boxShadow;
  const originalTransform = testPanel.style.transform;
  const originalBorderColor = testPanel.style.borderColor;
  
  // Apply hover styles with !important
  testPanel.style.setProperty('box-shadow', 'rgba(220, 8, 8, 0.7) 0px 30px 80px 0px, rgba(220, 8, 8, 0.5) 0px 12px 40px 0px', 'important');
  testPanel.style.setProperty('transform', 'translateY(-2px)', 'important');
  testPanel.style.setProperty('border-color', 'rgba(220, 8, 8, 0.6)', 'important');
  
  // Check the computed styles after applying !important styles
  setTimeout(() => {
    const importantStyle = getComputedStyle(testPanel);
    console.log('\n!important style application computed styles:');
    console.log('- Box-shadow:', importantStyle.boxShadow);
    console.log('- Transform:', importantStyle.transform);
    console.log('- Border-color:', importantStyle.borderColor);
    
    // Restore original styles
    testPanel.style.boxShadow = originalBoxShadow;
    testPanel.style.transform = originalTransform;
    testPanel.style.borderColor = originalBorderColor;
    console.log('\n🧹 Original styles restored');
  }, 2000);
}

// STEP 6: Test inline style element
console.log('\n📋 STEP 6: TESTING INLINE STYLE ELEMENT');

// Create a test style element
const testStyle = document.createElement('style');
testStyle.id = 'kyoto-hover-debug-style';
testStyle.textContent = `
  /* Target specific panels with very high specificity */
  html[data-theme="kyoto"] [data-input-panel]:nth-child(1) .glass-panel.glass-content-panel,
  html[data-theme="kyoto"] [data-input-panel]:nth-child(2) .glass-panel.glass-content-panel,
  html[data-theme="kyoto"] [data-input-panel]:nth-child(3) .glass-panel.glass-content-panel,
  html[data-theme="kyoto"] [data-input-panel]:nth-child(4) .glass-panel.glass-content-panel {
    box-shadow: rgba(220, 8, 8, 0.7) 0px 30px 80px 0px, rgba(220, 8, 8, 0.5) 0px 12px 40px 0px !important;
    transform: translateY(-2px) !important;
    border-color: rgba(220, 8, 8, 0.6) !important;
  }
`;

document.head.appendChild(testStyle);
console.log('Added inline style element with high specificity selectors and !important declarations');

// Check the computed styles after adding the inline style
setTimeout(() => {
  if (inputPanels.length > 0) {
    const testPanel = inputPanels[0];
    const inlineStyle = getComputedStyle(testPanel);
    console.log('\nInline style element computed styles:');
    console.log('- Box-shadow:', inlineStyle.boxShadow);
    console.log('- Transform:', inlineStyle.transform);
    console.log('- Border-color:', inlineStyle.borderColor);
  }
  
  // Remove the test style element
  document.head.removeChild(testStyle);
  console.log('\n🧹 Inline style element removed');
}, 3000);

// STEP 7: Test nuclear option - direct DOM manipulation
console.log('\n📋 STEP 7: TESTING NUCLEAR OPTION - DIRECT DOM MANIPULATION');

setTimeout(() => {
  if (inputPanels.length > 0) {
    const testPanel = inputPanels[0];
    console.log('Applying hover styles using direct DOM manipulation...');
    
    // Create a new style attribute with !important declarations
    const newStyle = `
      box-shadow: rgba(220, 8, 8, 0.7) 0px 30px 80px 0px, rgba(220, 8, 8, 0.5) 0px 12px 40px 0px !important;
      transform: translateY(-2px) !important;
      border-color: rgba(220, 8, 8, 0.6) !important;
    `;
    
    // Save original style attribute
    const originalStyle = testPanel.getAttribute('style') || '';
    
    // Apply new style attribute
    testPanel.setAttribute('style', originalStyle + newStyle);
    
    // Check the computed styles after direct DOM manipulation
    setTimeout(() => {
      const nuclearStyle = getComputedStyle(testPanel);
      console.log('\nNuclear option computed styles:');
      console.log('- Box-shadow:', nuclearStyle.boxShadow);
      console.log('- Transform:', nuclearStyle.transform);
      console.log('- Border-color:', nuclearStyle.borderColor);
      
      // Restore original style attribute
      testPanel.setAttribute('style', originalStyle);
      console.log('\n🧹 Original style attribute restored');
    }, 1000);
  }
}, 4000);

console.log('\n⏰ Debug script will run for 5 seconds');
console.log('Please wait while the tests are running...');