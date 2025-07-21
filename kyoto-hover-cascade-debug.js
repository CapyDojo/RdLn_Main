// Kyoto Hover Cascade Debug
// This script performs a detailed analysis of the CSS cascade

console.log('🔬 KYOTO HOVER CASCADE DEBUG');

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

// STEP 3: Detailed CSS Rule Analysis
console.log('\n📋 STEP 3: DETAILED CSS RULE ANALYSIS');

// Get all CSS rules
function getAllCSSRules() {
  const allRules = [];
  
  for (const sheet of document.styleSheets) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (const rule of rules) {
        if (rule.selectorText) {
          // Calculate rough specificity
          const specificity = calculateSpecificity(rule.selectorText);
          
          allRules.push({
            selector: rule.selectorText,
            specificity: specificity,
            cssText: rule.cssText,
            style: {
              background: rule.style.background,
              backgroundColor: rule.style.backgroundColor,
              borderColor: rule.style.borderColor,
              boxShadow: rule.style.boxShadow,
              transform: rule.style.transform,
              transition: rule.style.transition
            },
            important: {
              background: rule.style.getPropertyPriority('background') === 'important',
              backgroundColor: rule.style.getPropertyPriority('background-color') === 'important',
              borderColor: rule.style.getPropertyPriority('border-color') === 'important',
              boxShadow: rule.style.getPropertyPriority('box-shadow') === 'important',
              transform: rule.style.getPropertyPriority('transform') === 'important',
              transition: rule.style.getPropertyPriority('transition') === 'important'
            },
            source: sheet.href || 'inline'
          });
        }
      }
    } catch (e) {
      // Skip cross-origin stylesheets
    }
  }
  
  return allRules;
}

// Calculate specificity (rough approximation)
function calculateSpecificity(selector) {
  // Count IDs
  const idCount = (selector.match(/#[a-zA-Z0-9_-]+/g) || []).length;
  
  // Count classes, attributes, and pseudo-classes
  const classCount = (selector.match(/\.[a-zA-Z0-9_-]+/g) || []).length;
  const attrCount = (selector.match(/\[[^\]]*\]/g) || []).length;
  const pseudoClassCount = (selector.match(/:[a-zA-Z0-9_-]+/g) || []).length;
  
  // Count elements
  const elementCount = (selector.match(/[a-zA-Z0-9_-]+/g) || []).length - 
                      idCount - classCount - attrCount - pseudoClassCount;
  
  // Calculate specificity
  return idCount * 100 + (classCount + attrCount + pseudoClassCount) * 10 + elementCount;
}

const allRules = getAllCSSRules();
console.log(`Found ${allRules.length} total CSS rules`);

// Find rules that might affect our input panels
function findRelevantRules(element) {
  const relevantRules = [];
  
  for (const rule of allRules) {
    try {
      if (element.matches(rule.selector)) {
        relevantRules.push(rule);
      }
    } catch (e) {
      // Skip invalid selectors
    }
  }
  
  return relevantRules.sort((a, b) => {
    // Sort by specificity (highest first)
    if (b.specificity !== a.specificity) {
      return b.specificity - a.specificity;
    }
    
    // If specificity is the same, check for !important
    const aImportant = Object.values(a.important).some(Boolean);
    const bImportant = Object.values(b.important).some(Boolean);
    
    if (aImportant && !bImportant) return -1;
    if (!aImportant && bImportant) return 1;
    
    return 0;
  });
}

if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  const relevantRules = findRelevantRules(testPanel);
  
  console.log(`\nFound ${relevantRules.length} rules that affect the input panel:`);
  relevantRules.slice(0, 20).forEach((rule, index) => {
    console.log(`${index + 1}. ${rule.selector} (specificity: ${rule.specificity})`);
    console.log(`   - Box-shadow: ${rule.style.boxShadow || 'none'} ${rule.important.boxShadow ? '!important' : ''}`);
    console.log(`   - Transform: ${rule.style.transform || 'none'} ${rule.important.transform ? '!important' : ''}`);
    console.log(`   - Border-color: ${rule.style.borderColor || 'none'} ${rule.important.borderColor ? '!important' : ''}`);
    console.log(`   - Source: ${rule.source}`);
  });
  
  if (relevantRules.length > 20) {
    console.log(`... and ${relevantRules.length - 20} more rules`);
  }
  
  // Find hover rules that should affect the panel
  const hoverRules = relevantRules.filter(rule => rule.selector.includes(':hover'));
  console.log(`\nFound ${hoverRules.length} hover rules that should affect the input panel:`);
  hoverRules.forEach((rule, index) => {
    console.log(`${index + 1}. ${rule.selector} (specificity: ${rule.specificity})`);
    console.log(`   - Box-shadow: ${rule.style.boxShadow || 'none'} ${rule.important.boxShadow ? '!important' : ''}`);
    console.log(`   - Transform: ${rule.style.transform || 'none'} ${rule.important.transform ? '!important' : ''}`);
    console.log(`   - Border-color: ${rule.style.borderColor || 'none'} ${rule.important.borderColor ? '!important' : ''}`);
    console.log(`   - Source: ${rule.source}`);
  });
}

// STEP 4: Analyze CSS Cascade
console.log('\n📋 STEP 4: ANALYZING CSS CASCADE');

// Create a function to get all matching rules for a specific property
function getMatchingRulesForProperty(element, property) {
  const matchingRules = [];
  
  for (const rule of allRules) {
    try {
      if (element.matches(rule.selector) && rule.style[property]) {
        matchingRules.push({
          selector: rule.selector,
          specificity: rule.specificity,
          value: rule.style[property],
          important: rule.important[property],
          source: rule.source
        });
      }
    } catch (e) {
      // Skip invalid selectors
    }
  }
  
  return matchingRules.sort((a, b) => {
    // Sort by importance first
    if (a.important && !b.important) return -1;
    if (!a.important && b.important) return 1;
    
    // Then by specificity
    return b.specificity - a.specificity;
  });
}

if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  
  // Analyze box-shadow cascade
  const boxShadowRules = getMatchingRulesForProperty(testPanel, 'boxShadow');
  console.log('\nBox-shadow cascade:');
  boxShadowRules.slice(0, 10).forEach((rule, index) => {
    console.log(`${index + 1}. ${rule.selector} (specificity: ${rule.specificity})`);
    console.log(`   - Value: ${rule.value} ${rule.important ? '!important' : ''}`);
    console.log(`   - Source: ${rule.source}`);
  });
  
  // Analyze transform cascade
  const transformRules = getMatchingRulesForProperty(testPanel, 'transform');
  console.log('\nTransform cascade:');
  transformRules.slice(0, 10).forEach((rule, index) => {
    console.log(`${index + 1}. ${rule.selector} (specificity: ${rule.specificity})`);
    console.log(`   - Value: ${rule.value} ${rule.important ? '!important' : ''}`);
    console.log(`   - Source: ${rule.source}`);
  });
  
  // Analyze border-color cascade
  const borderColorRules = getMatchingRulesForProperty(testPanel, 'borderColor');
  console.log('\nBorder-color cascade:');
  borderColorRules.slice(0, 10).forEach((rule, index) => {
    console.log(`${index + 1}. ${rule.selector} (specificity: ${rule.specificity})`);
    console.log(`   - Value: ${rule.value} ${rule.important ? '!important' : ''}`);
    console.log(`   - Source: ${rule.source}`);
  });
}

// STEP 5: Analyze Hover Cascade
console.log('\n📋 STEP 5: ANALYZING HOVER CASCADE');

// Create a function to simulate hover and get matching rules
function simulateHoverAndGetRules(element, property) {
  // Create a clone of the element
  const clone = element.cloneNode(true);
  clone.id = 'hover-simulation-clone';
  document.body.appendChild(clone);
  
  // Create a style to simulate hover
  const hoverStyle = document.createElement('style');
  hoverStyle.textContent = `#hover-simulation-clone { ${property}: simulated-hover-value !important; }`;
  document.head.appendChild(hoverStyle);
  
  // Get all rules that would apply during hover
  const hoverRules = [];
  
  for (const rule of allRules) {
    try {
      // Replace :hover with an empty string to simulate hover
      const selectorWithoutHover = rule.selector.replace(/:hover/g, '');
      
      if (selectorWithoutHover && clone.matches(selectorWithoutHover) && rule.style[property]) {
        hoverRules.push({
          selector: rule.selector,
          specificity: rule.specificity,
          value: rule.style[property],
          important: rule.important[property],
          source: rule.source
        });
      }
    } catch (e) {
      // Skip invalid selectors
    }
  }
  
  // Clean up
  document.body.removeChild(clone);
  document.head.removeChild(hoverStyle);
  
  return hoverRules.sort((a, b) => {
    // Sort by importance first
    if (a.important && !b.important) return -1;
    if (!a.important && b.important) return 1;
    
    // Then by specificity
    return b.specificity - a.specificity;
  });
}

if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  
  // Analyze box-shadow hover cascade
  const boxShadowHoverRules = simulateHoverAndGetRules(testPanel, 'boxShadow');
  console.log('\nBox-shadow hover cascade:');
  boxShadowHoverRules.slice(0, 10).forEach((rule, index) => {
    console.log(`${index + 1}. ${rule.selector} (specificity: ${rule.specificity})`);
    console.log(`   - Value: ${rule.value} ${rule.important ? '!important' : ''}`);
    console.log(`   - Source: ${rule.source}`);
  });
  
  // Analyze transform hover cascade
  const transformHoverRules = simulateHoverAndGetRules(testPanel, 'transform');
  console.log('\nTransform hover cascade:');
  transformHoverRules.slice(0, 10).forEach((rule, index) => {
    console.log(`${index + 1}. ${rule.selector} (specificity: ${rule.specificity})`);
    console.log(`   - Value: ${rule.value} ${rule.important ? '!important' : ''}`);
    console.log(`   - Source: ${rule.source}`);
  });
  
  // Analyze border-color hover cascade
  const borderColorHoverRules = simulateHoverAndGetRules(testPanel, 'borderColor');
  console.log('\nBorder-color hover cascade:');
  borderColorHoverRules.slice(0, 10).forEach((rule, index) => {
    console.log(`${index + 1}. ${rule.selector} (specificity: ${rule.specificity})`);
    console.log(`   - Value: ${rule.value} ${rule.important ? '!important' : ''}`);
    console.log(`   - Source: ${rule.source}`);
  });
}

// STEP 6: Analyze Inline Styles
console.log('\n📋 STEP 6: ANALYZING INLINE STYLES');

if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  
  // Check for inline styles
  const inlineStyle = testPanel.getAttribute('style');
  console.log('Inline style attribute:', inlineStyle || 'none');
  
  // Check for style properties
  console.log('Inline style properties:');
  console.log('- Box-shadow:', testPanel.style.boxShadow || 'none');
  console.log('- Transform:', testPanel.style.transform || 'none');
  console.log('- Border-color:', testPanel.style.borderColor || 'none');
  
  // Check for computed styles
  const computedStyle = getComputedStyle(testPanel);
  console.log('\nComputed styles:');
  console.log('- Box-shadow:', computedStyle.boxShadow);
  console.log('- Transform:', computedStyle.transform);
  console.log('- Border-color:', computedStyle.borderColor);
}

// STEP 7: Test with !important
console.log('\n📋 STEP 7: TESTING WITH !IMPORTANT');

// Create a test style element with !important
const testStyle = document.createElement('style');
testStyle.id = 'kyoto-hover-cascade-debug-style';
testStyle.textContent = `
  /* Target specific panels with !important */
  [data-input-panel] .glass-panel.glass-content-panel {
    box-shadow: rgba(220, 8, 8, 0.7) 0px 30px 80px 0px, rgba(220, 8, 8, 0.5) 0px 12px 40px 0px !important;
    transform: translateY(-2px) !important;
    border-color: rgba(220, 8, 8, 0.6) !important;
  }
`;

document.head.appendChild(testStyle);
console.log('Added test style with !important declarations');

// Check the computed styles after adding the test style
setTimeout(() => {
  if (inputPanels.length > 0) {
    const testPanel = inputPanels[0];
    const importantStyle = getComputedStyle(testPanel);
    console.log('\nComputed styles with !important:');
    console.log('- Box-shadow:', importantStyle.boxShadow);
    console.log('- Transform:', importantStyle.transform);
    console.log('- Border-color:', importantStyle.borderColor);
    
    // Check if !important style application works
    const isStrongShadow = importantStyle.boxShadow.includes('80px') || 
                          importantStyle.boxShadow.includes('64px') ||
                          importantStyle.boxShadow.includes('0.7');
    
    const hasTransform = importantStyle.transform.includes('matrix') || 
                        importantStyle.transform.includes('translateY');
    
    if (isStrongShadow && hasTransform) {
      console.log('✅ SUCCESS! !important style application works!');
      console.log('This confirms that !important can override whatever is preventing the styles from being applied.');
    } else {
      console.log('❌ FAILURE! Even !important style application does not work.');
      console.log('This suggests there might be fundamental issues with the DOM structure or rendering.');
    }
  }
  
  // Remove the test style element
  document.head.removeChild(testStyle);
  console.log('\n🧹 Test style removed');
}, 1000);

// STEP 8: Test with Inline Style
console.log('\n📋 STEP 8: TESTING WITH INLINE STYLE');

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
    console.log('\nComputed styles with inline style:');
    console.log('- Box-shadow:', directStyle.boxShadow);
    console.log('- Transform:', directStyle.transform);
    console.log('- Border-color:', directStyle.borderColor);
    
    // Check if direct style application works
    const isStrongShadow = directStyle.boxShadow.includes('80px') || 
                          directStyle.boxShadow.includes('64px') ||
                          directStyle.boxShadow.includes('0.7');
    
    const hasTransform = directStyle.transform.includes('matrix') || 
                        directStyle.transform.includes('translateY');
    
    if (isStrongShadow && hasTransform) {
      console.log('✅ SUCCESS! Inline style application works!');
      console.log('This confirms that inline styles can override whatever is preventing the styles from being applied.');
    } else {
      console.log('❌ FAILURE! Even inline style application does not work.');
      console.log('This suggests there might be fundamental issues with the DOM structure or rendering.');
    }
    
    // Restore original styles
    testPanel.style.boxShadow = originalBoxShadow;
    testPanel.style.transform = originalTransform;
    testPanel.style.borderColor = originalBorderColor;
    console.log('\n🧹 Original styles restored');
  }, 2000);
}

// STEP 9: Test with !important Inline Style
console.log('\n📋 STEP 9: TESTING WITH !IMPORTANT INLINE STYLE');

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
    console.log('\nComputed styles with !important inline style:');
    console.log('- Box-shadow:', importantStyle.boxShadow);
    console.log('- Transform:', importantStyle.transform);
    console.log('- Border-color:', importantStyle.borderColor);
    
    // Check if !important style application works
    const isStrongShadow = importantStyle.boxShadow.includes('80px') || 
                          importantStyle.boxShadow.includes('64px') ||
                          importantStyle.boxShadow.includes('0.7');
    
    const hasTransform = importantStyle.transform.includes('matrix') || 
                        importantStyle.transform.includes('translateY');
    
    if (isStrongShadow && hasTransform) {
      console.log('✅ SUCCESS! !important inline style application works!');
      console.log('This confirms that !important inline styles can override whatever is preventing the styles from being applied.');
    } else {
      console.log('❌ FAILURE! Even !important inline style application does not work.');
      console.log('This suggests there might be fundamental issues with the DOM structure or rendering.');
    }
    
    // Restore original styles
    testPanel.style.boxShadow = originalBoxShadow;
    testPanel.style.transform = originalTransform;
    testPanel.style.borderColor = originalBorderColor;
    console.log('\n🧹 Original styles restored');
  }, 3000);
}

// STEP 10: Summary
console.log('\n📋 STEP 10: SUMMARY');

setTimeout(() => {
  console.log('Based on the cascade analysis, here are the findings:');
  console.log('1. Check which rules have the highest specificity');
  console.log('2. Check if there are any !important declarations that are winning');
  console.log('3. Check if inline styles work');
  console.log('4. Check if !important inline styles work');
  
  console.log('\nRecommendations:');
  console.log('1. If inline styles work, use higher specificity selectors');
  console.log('2. If only !important works, use !important declarations as a last resort');
  console.log('3. If nothing works, check for fundamental issues with the DOM structure or rendering');
}, 4000);

console.log('\n⏰ Debug script will run for 4 seconds');
console.log('Please wait while the tests are running...');