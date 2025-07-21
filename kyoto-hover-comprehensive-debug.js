// Kyoto Hover Comprehensive Debug
// This script performs a deep analysis of all factors affecting hover styles

console.log('🔬 KYOTO HOVER COMPREHENSIVE DEBUG');

// STEP 1: Environment Check
console.log('\n📋 STEP 1: ENVIRONMENT CHECK');
const currentTheme = document.documentElement.getAttribute('data-theme');
console.log('Current theme:', currentTheme);

if (currentTheme !== 'kyoto') {
  console.warn('⚠️ Not in Kyoto theme! This test should be run in Kyoto theme.');
}

// STEP 2: Find all relevant elements
console.log('\n📋 STEP 2: FINDING RELEVANT ELEMENTS');
const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
console.log(`Found ${inputPanels.length} input panels`);

// STEP 3: Complete CSS Rule Analysis
console.log('\n📋 STEP 3: COMPLETE CSS RULE ANALYSIS');

function getAllCSSRules() {
  const allRules = [];
  
  for (const sheet of document.styleSheets) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (const rule of rules) {
        if (rule.selectorText) {
          allRules.push({
            selector: rule.selectorText,
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
    // Sort by specificity (rough approximation)
    const aSpecificity = (a.selector.match(/:/g) || []).length * 10 + 
                        (a.selector.match(/\\./g) || []).length * 10 + 
                        (a.selector.match(/\\[/g) || []).length * 10 + 
                        (a.selector.match(/\\#/g) || []).length * 100;
    
    const bSpecificity = (b.selector.match(/:/g) || []).length * 10 + 
                        (b.selector.match(/\\./g) || []).length * 10 + 
                        (b.selector.match(/\\[/g) || []).length * 10 + 
                        (b.selector.match(/\\#/g) || []).length * 100;
    
    return bSpecificity - aSpecificity;
  });
}

if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  const relevantRules = findRelevantRules(testPanel);
  
  console.log(`\nFound ${relevantRules.length} rules that affect the input panel:`);
  relevantRules.slice(0, 10).forEach((rule, index) => {
    console.log(`${index + 1}. ${rule.selector}`);
    console.log(`   - Box-shadow: ${rule.style.boxShadow || 'none'} ${rule.important.boxShadow ? '!important' : ''}`);
    console.log(`   - Transform: ${rule.style.transform || 'none'} ${rule.important.transform ? '!important' : ''}`);
    console.log(`   - Border-color: ${rule.style.borderColor || 'none'} ${rule.important.borderColor ? '!important' : ''}`);
    console.log(`   - Background: ${rule.style.background || rule.style.backgroundColor || 'none'} ${rule.important.background || rule.important.backgroundColor ? '!important' : ''}`);
    console.log(`   - Transition: ${rule.style.transition || 'none'} ${rule.important.transition ? '!important' : ''}`);
    console.log(`   - Source: ${rule.source}`);
  });
  
  if (relevantRules.length > 10) {
    console.log(`... and ${relevantRules.length - 10} more rules`);
  }
  
  // Find hover rules that should affect the panel
  const hoverRules = relevantRules.filter(rule => rule.selector.includes(':hover'));
  console.log(`\nFound ${hoverRules.length} hover rules that should affect the input panel:`);
  hoverRules.forEach((rule, index) => {
    console.log(`${index + 1}. ${rule.selector}`);
    console.log(`   - Box-shadow: ${rule.style.boxShadow || 'none'} ${rule.important.boxShadow ? '!important' : ''}`);
    console.log(`   - Transform: ${rule.style.transform || 'none'} ${rule.important.transform ? '!important' : ''}`);
    console.log(`   - Border-color: ${rule.style.borderColor || 'none'} ${rule.important.borderColor ? '!important' : ''}`);
  });
}

// STEP 4: Check for JavaScript event handlers
console.log('\n📋 STEP 4: CHECKING FOR JAVASCRIPT EVENT HANDLERS');

function getEventListeners(element) {
  // This is a simplified version since we can't access the actual event listeners
  const events = ['mouseover', 'mouseenter', 'mouseleave', 'mouseout'];
  const result = {};
  
  for (const event of events) {
    // Check if the element has inline event handlers
    const inlineHandler = element.getAttribute(`on${event}`);
    if (inlineHandler) {
      if (!result[event]) result[event] = [];
      result[event].push({ type: 'inline', handler: inlineHandler });
    }
  }
  
  return result;
}

if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  
  // Check for event listeners on the panel and its parents
  let element = testPanel;
  let depth = 0;
  
  while (element && depth < 5) {
    const listeners = getEventListeners(element);
    const hasListeners = Object.keys(listeners).length > 0;
    
    console.log(`Element ${depth} (${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className.replace(/\s+/g, '.') : ''}):`);
    console.log(`- Has inline event handlers: ${hasListeners}`);
    
    if (hasListeners) {
      for (const [event, handlers] of Object.entries(listeners)) {
        console.log(`  - ${event}: ${handlers.length} handler(s)`);
      }
    }
    
    element = element.parentElement;
    depth++;
  }
}

// STEP 5: Check computed styles
console.log('\n📋 STEP 5: CHECKING COMPUTED STYLES');

if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  const computedStyle = getComputedStyle(testPanel);
  
  console.log('Default computed styles:');
  console.log('- Box-shadow:', computedStyle.boxShadow);
  console.log('- Transform:', computedStyle.transform);
  console.log('- Border-color:', computedStyle.borderColor);
  console.log('- Background:', computedStyle.background);
  console.log('- Transition:', computedStyle.transition);
  console.log('- Position:', computedStyle.position);
  console.log('- Z-index:', computedStyle.zIndex);
  
  // Check if element is visible
  const isVisible = testPanel.offsetParent !== null;
  const rect = testPanel.getBoundingClientRect();
  console.log('- Visibility check:');
  console.log('  - Is visible:', isVisible);
  console.log('  - Dimensions:', `${rect.width}x${rect.height}`);
  console.log('  - Position:', `(${rect.left}, ${rect.top})`);
}

// STEP 6: Test direct style application
console.log('\n📋 STEP 6: TESTING DIRECT STYLE APPLICATION');

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
    
    // Check if direct style application works
    const isStrongShadow = directStyle.boxShadow.includes('80px') || 
                          directStyle.boxShadow.includes('64px') ||
                          directStyle.boxShadow.includes('0.7');
    
    const hasTransform = directStyle.transform.includes('matrix') || 
                        directStyle.transform.includes('translateY');
    
    if (isStrongShadow && hasTransform) {
      console.log('✅ SUCCESS! Direct style application works!');
      console.log('This suggests that there are no fundamental issues preventing the styles from being applied.');
    } else {
      console.log('❌ FAILURE! Direct style application does not work.');
      console.log('This suggests there might be other styles with !important declarations or higher specificity.');
    }
    
    // Restore original styles
    testPanel.style.boxShadow = originalBoxShadow;
    testPanel.style.transform = originalTransform;
    testPanel.style.borderColor = originalBorderColor;
    console.log('\n🧹 Original styles restored');
  }, 1000);
}

// STEP 7: Test !important style application
console.log('\n📋 STEP 7: TESTING !IMPORTANT STYLE APPLICATION');

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
    
    // Check if !important style application works
    const isStrongShadow = importantStyle.boxShadow.includes('80px') || 
                          importantStyle.boxShadow.includes('64px') ||
                          importantStyle.boxShadow.includes('0.7');
    
    const hasTransform = importantStyle.transform.includes('matrix') || 
                        importantStyle.transform.includes('translateY');
    
    if (isStrongShadow && hasTransform) {
      console.log('✅ SUCCESS! !important style application works!');
      console.log('This suggests that using !important can override whatever is preventing the styles from being applied.');
    } else {
      console.log('❌ FAILURE! Even !important style application does not work.');
      console.log('This suggests there might be fundamental issues with the DOM structure or rendering.');
    }
    
    // Restore original styles
    testPanel.style.boxShadow = originalBoxShadow;
    testPanel.style.transform = originalTransform;
    testPanel.style.borderColor = originalBorderColor;
    console.log('\n🧹 Original styles restored');
  }, 2000);
}

// STEP 8: Test inline style element
console.log('\n📋 STEP 8: TESTING INLINE STYLE ELEMENT');

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
    
    // Check if inline style element works
    const isStrongShadow = inlineStyle.boxShadow.includes('80px') || 
                          inlineStyle.boxShadow.includes('64px') ||
                          inlineStyle.boxShadow.includes('0.7');
    
    const hasTransform = inlineStyle.transform.includes('matrix') || 
                        inlineStyle.transform.includes('translateY');
    
    if (isStrongShadow && hasTransform) {
      console.log('✅ SUCCESS! Inline style element works!');
      console.log('This suggests that using an inline style element with high specificity and !important can override whatever is preventing the styles from being applied.');
    } else {
      console.log('❌ FAILURE! Even inline style element does not work.');
      console.log('This suggests there might be fundamental issues with the DOM structure or rendering.');
    }
  }
  
  // Remove the test style element
  document.head.removeChild(testStyle);
  console.log('\n🧹 Inline style element removed');
}, 3000);

// STEP 9: Test nuclear option - direct DOM manipulation
console.log('\n📋 STEP 9: TESTING NUCLEAR OPTION - DIRECT DOM MANIPULATION');

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
      
      // Check if nuclear option works
      const isStrongShadow = nuclearStyle.boxShadow.includes('80px') || 
                            nuclearStyle.boxShadow.includes('64px') ||
                            nuclearStyle.boxShadow.includes('0.7');
      
      const hasTransform = nuclearStyle.transform.includes('matrix') || 
                          nuclearStyle.transform.includes('translateY');
      
      if (isStrongShadow && hasTransform) {
        console.log('✅ SUCCESS! Nuclear option works!');
        console.log('This suggests that direct DOM manipulation with !important can override whatever is preventing the styles from being applied.');
      } else {
        console.log('❌ FAILURE! Even nuclear option does not work.');
        console.log('This suggests there might be fundamental issues with the DOM structure or rendering.');
      }
      
      // Restore original style attribute
      testPanel.setAttribute('style', originalStyle);
      console.log('\n🧹 Original style attribute restored');
    }, 1000);
  }
}, 4000);

// STEP 10: Check for any CSS animations or transitions
console.log('\n📋 STEP 10: CHECKING FOR CSS ANIMATIONS OR TRANSITIONS');

const animationRules = allRules.filter(rule => 
  rule.style.animation || 
  rule.style.transition || 
  rule.cssText.includes('@keyframes') || 
  rule.cssText.includes('animation') || 
  rule.cssText.includes('transition')
);

console.log(`Found ${animationRules.length} rules with animations or transitions`);
animationRules.slice(0, 5).forEach((rule, index) => {
  console.log(`${index + 1}. ${rule.selector}`);
  console.log(`   - CSS Text: ${rule.cssText.substring(0, 100)}...`);
});

if (animationRules.length > 5) {
  console.log(`... and ${animationRules.length - 5} more rules`);
}

// STEP 11: Summary and recommendations
console.log('\n📋 STEP 11: SUMMARY AND RECOMMENDATIONS');

setTimeout(() => {
  console.log('Based on the comprehensive debug analysis, here are the findings:');
  
  // We'll fill this in after we see the results of the tests
  console.log('1. Check if direct style application worked');
  console.log('2. Check if !important style application worked');
  console.log('3. Check if inline style element worked');
  console.log('4. Check if nuclear option worked');
  
  console.log('\nRecommendations:');
  console.log('1. If direct style application worked, use higher specificity selectors');
  console.log('2. If only !important worked, use !important declarations as a last resort');
  console.log('3. If inline style element worked, consider using a more specific approach');
  console.log('4. If only nuclear option worked, consider using direct DOM manipulation');
  console.log('5. If nothing worked, check for fundamental issues with the DOM structure or rendering');
}, 6000);

console.log('\n⏰ Debug script will run for 6 seconds');
console.log('Please wait while the tests are running...');