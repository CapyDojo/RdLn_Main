// CSS HIERARCHY CLEANUP INVESTIGATION
// Goal: Find the path to a clean CSS hierarchy without !important overrides
console.log('🧹 CSS HIERARCHY CLEANUP INVESTIGATION');
console.log('Goal: Identify conflicting rules and establish clean CSS architecture');

// STEP 1: Audit all existing CSS rules affecting glass panels
console.log('\n📋 STEP 1: COMPLETE CSS RULE AUDIT');

function getAllGlassPanelRules() {
  const allRules = [];
  
  for (const sheet of document.styleSheets) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (const rule of rules) {
        if (rule.selectorText && rule.style) {
          const selector = rule.selectorText.toLowerCase();
          
          // Find rules that affect glass panels
          if (selector.includes('glass-panel') || 
              selector.includes('.glass') ||
              (selector.includes('shadow') && (selector.includes('lg') || selector.includes('md') || selector.includes('sm')))) {
            
            allRules.push({
              selector: rule.selectorText,
              specificity: calculateSpecificity(rule.selectorText),
              boxShadow: rule.style.boxShadow,
              transform: rule.style.transform,
              borderColor: rule.style.borderColor,
              background: rule.style.background,
              important: {
                boxShadow: rule.style.getPropertyPriority('box-shadow') === 'important',
                transform: rule.style.getPropertyPriority('transform') === 'important',
                borderColor: rule.style.getPropertyPriority('border-color') === 'important',
                background: rule.style.getPropertyPriority('background') === 'important'
              },
              sheet: sheet.href || 'inline',
              cssText: rule.cssText
            });
          }
        }
      }
    } catch (e) {
      console.log(`Skipped stylesheet: ${sheet.href || 'cross-origin'}`);
    }
  }
  
  return allRules.sort((a, b) => b.specificity - a.specificity);
}

function calculateSpecificity(selector) {
  let specificity = 0;
  
  // Count IDs (most specific)
  specificity += (selector.match(/#[a-zA-Z]/g) || []).length * 100;
  
  // Count classes, attributes, and pseudo-classes
  specificity += (selector.match(/\.[a-zA-Z]|\[[^\]]*\]|:[a-zA-Z]/g) || []).length * 10;
  
  // Count element names (least specific)
  specificity += (selector.match(/^[a-zA-Z]|\s[a-zA-Z]/g) || []).length * 1;
  
  return specificity;
}

const allGlassRules = getAllGlassPanelRules();
console.log(`Found ${allGlassRules.length} CSS rules affecting glass panels:`);

// Group rules by type for analysis
const rulesByType = {
  base: [],
  theme: [],
  hover: [],
  tailwind: [],
  important: []
};

allGlassRules.forEach(rule => {
  const selector = rule.selector.toLowerCase();
  
  if (selector.includes(':hover')) {
    rulesByType.hover.push(rule);
  } else if (selector.includes('data-theme')) {
    rulesByType.theme.push(rule);
  } else if (selector.includes('shadow-')) {
    rulesByType.tailwind.push(rule);
  } else {
    rulesByType.base.push(rule);
  }
  
  if (rule.important.boxShadow || rule.important.transform || rule.important.borderColor || rule.important.background) {
    rulesByType.important.push(rule);
  }
});

console.log('\n📊 RULE CATEGORIZATION:');
console.log(`Base rules: ${rulesByType.base.length}`);
console.log(`Theme rules: ${rulesByType.theme.length}`);
console.log(`Hover rules: ${rulesByType.hover.length}`);
console.log(`Tailwind rules: ${rulesByType.tailwind.length}`);
console.log(`Rules with !important: ${rulesByType.important.length}`);

// STEP 2: Identify conflicting rules
console.log('\n🔍 STEP 2: CONFLICT IDENTIFICATION');

// Find rules that set the same properties
const conflicts = [];
const propertyMap = {};

allGlassRules.forEach(rule => {
  ['boxShadow', 'transform', 'borderColor', 'background'].forEach(prop => {
    if (rule[prop]) {
      if (!propertyMap[prop]) propertyMap[prop] = [];
      propertyMap[prop].push(rule);
    }
  });
});

Object.keys(propertyMap).forEach(prop => {
  if (propertyMap[prop].length > 1) {
    console.log(`\n⚠️ CONFLICT: ${propertyMap[prop].length} rules set ${prop}:`);
    propertyMap[prop].forEach((rule, index) => {
      console.log(`${index + 1}. ${rule.selector} (specificity: ${rule.specificity})`);
      console.log(`   Value: ${rule[prop]} ${rule.important[prop] ? '!important' : ''}`);
    });
    
    conflicts.push({
      property: prop,
      rules: propertyMap[prop]
    });
  }
});

// STEP 3: Analyze current element targeting
console.log('\n🎯 STEP 3: ELEMENT TARGETING ANALYSIS');

const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
console.log(`Found ${inputPanels.length} target elements`);

if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  
  // Test which rules actually apply to our elements
  const applicableRules = allGlassRules.filter(rule => {
    try {
      const baseSelector = rule.selector.replace(':hover', '');
      return testPanel.matches(baseSelector);
    } catch (e) {
      return false;
    }
  });
  
  console.log(`${applicableRules.length} rules apply to our target elements:`);
  applicableRules.forEach((rule, index) => {
    console.log(`${index + 1}. ${rule.selector} (specificity: ${rule.specificity})`);
  });
  
  // Find the winning rule for each property
  console.log('\n🏆 WINNING RULES (highest specificity):');
  ['boxShadow', 'transform', 'borderColor', 'background'].forEach(prop => {
    const rulesWithProp = applicableRules.filter(rule => rule[prop]);
    if (rulesWithProp.length > 0) {
      const winner = rulesWithProp[0]; // Already sorted by specificity
      console.log(`${prop}: ${winner.selector} (${winner.specificity})`);
      console.log(`  Value: ${winner[prop]} ${winner.important[prop] ? '!important' : ''}`);
    }
  });
}

// STEP 4: Propose clean hierarchy structure
console.log('\n🏗️ STEP 4: PROPOSED CLEAN HIERARCHY');

console.log('Recommended CSS structure (no !important needed):');
console.log(`
/* 1. Base glass panel styles (specificity: ~20) */
.glass-panel {
  /* Base glassmorphism properties */
}

/* 2. Content panel variant (specificity: ~30) */
.glass-panel.glass-content-panel {
  /* Content-specific adjustments */
}

/* 3. Theme-specific styles (specificity: ~40) */
[data-theme="kyoto"] .glass-panel.glass-content-panel {
  /* Kyoto theme base styles */
}

/* 4. Context-specific styles (specificity: ~50) */
[data-theme="kyoto"] [data-input-panel] .glass-panel.glass-content-panel {
  /* Input panel specific styles */
}

/* 5. State styles - highest specificity (specificity: ~60) */
[data-theme="kyoto"] [data-input-panel] .glass-panel.glass-content-panel:hover {
  /* Hover effects - should win naturally */
}
`);

// STEP 5: Identify rules to remove
console.log('\n🗑️ STEP 5: RULES TO REMOVE/CONSOLIDATE');

console.log('Rules that should be removed or consolidated:');

// Find duplicate theme rules
const kyotoRules = allGlassRules.filter(rule => 
  rule.selector.toLowerCase().includes('kyoto') && 
  rule.selector.toLowerCase().includes('glass-panel')
);

if (kyotoRules.length > 1) {
  console.log(`\n📝 ${kyotoRules.length} Kyoto glass panel rules found (should consolidate):`);
  kyotoRules.forEach((rule, index) => {
    console.log(`${index + 1}. ${rule.selector}`);
    console.log(`   Box-shadow: ${rule.boxShadow || 'none'}`);
  });
}

// Find rules with !important that could be removed
if (rulesByType.important.length > 0) {
  console.log(`\n⚠️ ${rulesByType.important.length} rules with !important (should be removed after hierarchy cleanup):`);
  rulesByType.important.forEach((rule, index) => {
    console.log(`${index + 1}. ${rule.selector}`);
    Object.keys(rule.important).forEach(prop => {
      if (rule.important[prop]) {
        console.log(`   ${prop}: ${rule[prop]} !important`);
      }
    });
  });
}

// STEP 6: Test clean selector pattern
console.log('\n🧪 STEP 6: TESTING CLEAN SELECTOR PATTERN');

const cleanSelector = '[data-theme="kyoto"] [data-input-panel] .glass-panel.glass-content-panel';
const cleanHoverSelector = cleanSelector + ':hover';

console.log('Testing clean selector pattern:');
console.log(`Base selector: ${cleanSelector}`);
console.log(`Hover selector: ${cleanHoverSelector}`);

if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  const matches = testPanel.matches(cleanSelector);
  console.log(`Target element matches clean selector: ${matches}`);
  
  const cleanSpecificity = calculateSpecificity(cleanHoverSelector);
  console.log(`Clean selector specificity: ${cleanSpecificity}`);
  
  // Check if this specificity would win over existing rules
  const conflictingRules = applicableRules.filter(rule => 
    rule.selector.includes(':hover') && 
    rule.specificity >= cleanSpecificity &&
    (rule.boxShadow || rule.transform)
  );
  
  if (conflictingRules.length > 0) {
    console.log(`⚠️ ${conflictingRules.length} existing rules have equal/higher specificity:`);
    conflictingRules.forEach(rule => {
      console.log(`- ${rule.selector} (${rule.specificity})`);
    });
  } else {
    console.log('✅ Clean selector would win over existing rules');
  }
}

// STEP 7: Tailwind integration analysis
console.log('\n🎨 STEP 7: TAILWIND INTEGRATION ANALYSIS');

// Check what Tailwind shadow classes are doing
const tailwindShadows = ['shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl'];
console.log('Tailwind shadow class analysis:');

tailwindShadows.forEach(shadowClass => {
  const testEl = document.createElement('div');
  testEl.className = shadowClass;
  document.body.appendChild(testEl);
  
  const computedShadow = getComputedStyle(testEl).boxShadow;
  console.log(`${shadowClass}: ${computedShadow}`);
  
  document.body.removeChild(testEl);
});

// Check if removing shadow-lg from components would help
console.log('\nRecommendation for Tailwind integration:');
console.log('- Remove shadow-lg class from TextInputPanel component');
console.log('- Handle all shadows through theme system');
console.log('- This eliminates Tailwind specificity conflicts');

// STEP 8: Generate cleanup action plan
console.log('\n📋 STEP 8: CLEANUP ACTION PLAN');

console.log('Recommended cleanup steps:');
console.log('1. Remove duplicate Kyoto glass panel rules');
console.log('2. Consolidate all theme hover effects into single rule per theme');
console.log('3. Remove !important declarations');
console.log('4. Remove shadow-lg class from React components');
console.log('5. Use consistent selector pattern: [data-theme] [data-context] .glass-panel:hover');
console.log('6. Test that natural CSS cascade works without forcing');

console.log('\n✅ INVESTIGATION COMPLETE');
console.log('This analysis provides the roadmap for clean CSS hierarchy without !important overrides');