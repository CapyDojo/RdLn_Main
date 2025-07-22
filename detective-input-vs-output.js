// Detective script to find why input panels work but output panel doesn't
console.log('🕵️ DETECTIVE: INPUT VS OUTPUT PANEL COMPARISON');

// Find elements
const inputPanel = document.querySelector('[data-input-panel] .glass-panel.glass-content-panel');
const outputPanel = document.querySelector('[data-output-panel] .glass-panel.glass-content-panel');

console.log('Input panel found:', !!inputPanel);
console.log('Output panel found:', !!outputPanel);

if (inputPanel && outputPanel) {
  
  console.log('\n📋 PART 1: HTML STRUCTURE COMPARISON');
  
  // Compare basic properties
  console.log('\n🏗️ ELEMENT BASICS:');
  console.log('Input panel tag:', inputPanel.tagName);
  console.log('Output panel tag:', outputPanel.tagName);
  console.log('Tags match:', inputPanel.tagName === outputPanel.tagName);
  
  // Compare classes
  console.log('\n🎨 CSS CLASSES:');
  const inputClasses = Array.from(inputPanel.classList).sort();
  const outputClasses = Array.from(outputPanel.classList).sort();
  
  console.log('Input classes:', inputClasses.join(', '));
  console.log('Output classes:', outputClasses.join(', '));
  
  const classDiff = {
    inputOnly: inputClasses.filter(c => !outputClasses.includes(c)),
    outputOnly: outputClasses.filter(c => !inputClasses.includes(c)),
    common: inputClasses.filter(c => outputClasses.includes(c))
  };
  
  console.log('Classes ONLY on input:', classDiff.inputOnly);
  console.log('Classes ONLY on output:', classDiff.outputOnly);
  console.log('Common classes:', classDiff.common);
  
  // Compare parent structure
  console.log('\n👨‍👩‍👧‍👦 PARENT STRUCTURE:');
  console.log('Input parent classes:', inputPanel.parentElement?.className || 'none');
  console.log('Output parent classes:', outputPanel.parentElement?.className || 'none');
  console.log('Input grandparent classes:', inputPanel.parentElement?.parentElement?.className || 'none');
  console.log('Output grandparent classes:', outputPanel.parentElement?.parentElement?.className || 'none');
  
  console.log('\n📋 PART 2: CSS RULES ANALYSIS');
  
  // Function to get all matching CSS rules
  function getMatchingRules(element, pseudo = '') {
    const rules = [];
    const sheets = Array.from(document.styleSheets);
    
    sheets.forEach(sheet => {
      try {
        const cssRules = Array.from(sheet.cssRules || []);
        cssRules.forEach(rule => {
          if (rule.type === CSSRule.STYLE_RULE) {
            try {
              if (element.matches(rule.selectorText.replace(pseudo, ''))) {
                rules.push({
                  selector: rule.selectorText,
                  specificity: rule.selectorText.split(' ').length, // rough specificity
                  sheet: sheet.href || 'inline'
                });
              }
            } catch (e) {
              // Ignore invalid selectors
            }
          }
        });
      } catch (e) {
        // Ignore CORS issues
      }
    });
    
    return rules.sort((a, b) => b.specificity - a.specificity);
  }
  
  // Check base state rules
  console.log('\n🎯 BASE STATE CSS RULES:');
  const inputBaseRules = getMatchingRules(inputPanel);
  const outputBaseRules = getMatchingRules(outputPanel);
  
  console.log(`Input panel matches ${inputBaseRules.length} CSS rules`);
  console.log(`Output panel matches ${outputBaseRules.length} CSS rules`);
  
  // Find rules that apply to one but not the other
  const inputSelectors = inputBaseRules.map(r => r.selector);
  const outputSelectors = outputBaseRules.map(r => r.selector);
  
  const inputOnlyRules = inputBaseRules.filter(r => !outputSelectors.includes(r.selector));
  const outputOnlyRules = outputBaseRules.filter(r => !inputSelectors.includes(r.selector));
  
  if (inputOnlyRules.length > 0) {
    console.log('\n🔴 CSS RULES ONLY APPLYING TO INPUT:');
    inputOnlyRules.slice(0, 5).forEach(rule => {
      console.log(`  - ${rule.selector}`);
    });
  }
  
  if (outputOnlyRules.length > 0) {
    console.log('\n🔵 CSS RULES ONLY APPLYING TO OUTPUT:');
    outputOnlyRules.slice(0, 5).forEach(rule => {
      console.log(`  - ${rule.selector}`);
    });
  }
  
  console.log('\n📋 PART 3: HOVER STATE INVESTIGATION');
  
  // Test hover selector matching
  const hoverSelectors = [
    'html[data-theme="kyoto"] .glass-panel:hover',
    'html[data-theme="kyoto"] .glass-panel.glass-content-panel:hover',
    '[data-theme="kyoto"] .glass-panel:hover',
    '[data-theme="kyoto"] .glass-panel.glass-content-panel:hover',
    '.glass-panel:hover',
    '.glass-panel.glass-content-panel:hover'
  ];
  
  console.log('\n🎯 HOVER SELECTOR MATCHING TEST:');
  hoverSelectors.forEach(selector => {
    try {
      const inputMatches = inputPanel.matches(selector.replace(':hover', ''));
      const outputMatches = outputPanel.matches(selector.replace(':hover', ''));
      console.log(`${selector}:`);
      console.log(`  Input matches: ${inputMatches}`);
      console.log(`  Output matches: ${outputMatches}`);
      console.log(`  Both match: ${inputMatches && outputMatches}`);
    } catch (e) {
      console.log(`${selector}: ERROR - ${e.message}`);
    }
  });
  
  console.log('\n📋 PART 4: COMPUTED STYLE COMPARISON');
  
  // Compare key CSS properties
  const keyProperties = [
    'pointer-events', 'position', 'z-index', 'display', 
    'background', 'box-shadow', 'transform', 'transition',
    'border', 'opacity'
  ];
  
  console.log('\n🎨 KEY COMPUTED STYLES:');
  keyProperties.forEach(prop => {
    const inputValue = getComputedStyle(inputPanel)[prop];
    const outputValue = getComputedStyle(outputPanel)[prop];
    const match = inputValue === outputValue;
    
    console.log(`${prop}:`);
    console.log(`  Input: ${inputValue}`);
    console.log(`  Output: ${outputValue}`);
    console.log(`  Match: ${match}`);
    
    if (!match) {
      console.log(`  ⚠️ DIFFERENCE DETECTED!`);
    }
  });
  
  console.log('\n📋 PART 5: HOVER EVENT TESTING');
  
  // Test if hover events are being blocked
  let inputHoverDetected = false;
  let outputHoverDetected = false;
  
  const inputHoverHandler = () => {
    inputHoverDetected = true;
    console.log('✅ Input panel hover event detected!');
  };
  
  const outputHoverHandler = () => {
    outputHoverDetected = true;
    console.log('✅ Output panel hover event detected!');
  };
  
  inputPanel.addEventListener('mouseenter', inputHoverHandler);
  outputPanel.addEventListener('mouseenter', outputHoverHandler);
  
  console.log('\n🖱️ HOVER EVENT TEST:');
  console.log('Hover over both panels now to test event detection...');
  
  // Clean up after 10 seconds
  setTimeout(() => {
    inputPanel.removeEventListener('mouseenter', inputHoverHandler);
    outputPanel.removeEventListener('mouseenter', outputHoverHandler);
    
    console.log('\n🎯 FINAL DIAGNOSIS:');
    console.log(`Input hover events: ${inputHoverDetected ? '✅ Working' : '❌ Not detected'}`);
    console.log(`Output hover events: ${outputHoverDetected ? '✅ Working' : '❌ Not detected'}`);
    
    console.log('\n🔍 SUMMARY OF DIFFERENCES FOUND:');
    if (classDiff.inputOnly.length > 0 || classDiff.outputOnly.length > 0) {
      console.log('📌 Class differences detected - this could be the cause!');
    }
    if (inputOnlyRules.length > 0 || outputOnlyRules.length > 0) {
      console.log('📌 CSS rule differences detected - this could be the cause!');
    }
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Check any class differences above');
    console.log('2. Check any CSS rule differences above');
    console.log('3. Check any computed style differences above');
    console.log('4. Focus on properties that might block hover (pointer-events, z-index, position)');
    
  }, 10000);
  
} else {
  console.log('❌ Could not find both input and output panels');
}