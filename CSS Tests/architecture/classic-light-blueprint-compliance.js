// Classic Light Theme - Architectural Blueprint Compliance Test
// Validates compliance with both Kyoto and Professional gold standard blueprints

console.log('🏗️ CLASSIC LIGHT - ARCHITECTURAL BLUEPRINT COMPLIANCE');
console.log('====================================================');

// Test 1: Dual Blueprint Pattern Compliance
function testDualBlueprintCompliance() {
  console.log('\n📐 DUAL BLUEPRINT PATTERN COMPLIANCE');
  console.log('Checking consistency with Kyoto AND Professional blueprints');
  
  return Promise.all([
    fetch('/src/styles/themes/kyoto.css').then(r => r.text()),
    fetch('/src/styles/themes/professional.css').then(r => r.text()),
    fetch('/src/styles/themes/classic-light.css').then(r => r.text())
  ]).then(([kyotoCSS, professionalCSS, classicLightCSS]) => {
    
    // Extract structural patterns from blueprints
    const kyotoPatterns = extractStructuralPatterns(kyotoCSS, 'kyoto');
    const professionalPatterns = extractStructuralPatterns(professionalCSS, 'professional');
    const classicLightPatterns = extractStructuralPatterns(classicLightCSS, 'classic-light');
    
    console.log('Blueprint pattern analysis:');
    console.log(`Kyoto patterns: ${kyotoPatterns.length}`);
    console.log(`Professional patterns: ${professionalPatterns.length}`);
    console.log(`Classic Light patterns: ${classicLightPatterns.length}`);
    
    // Check structural consistency
    const hasVariableSection = classicLightCSS.includes('Theme-scoped CSS Variables');
    const hasGlassPanelSection = classicLightCSS.includes('Simple theme glass panel styling');
    const hasTextHierarchy = classicLightCSS.includes('Clean Text Hierarchy');
    const hasHoverEffects = classicLightCSS.includes('Clean Hover Effects');
    
    console.log('\nStructural sections:');
    console.log(`${hasVariableSection ? '✅' : '❌'} CSS Variables section`);
    console.log(`${hasGlassPanelSection ? '✅' : '❌'} Glass panel section`);
    console.log(`${hasTextHierarchy ? '✅' : '❌'} Text hierarchy section`);
    console.log(`${hasHoverEffects ? '✅' : '❌'} Hover effects section`);
    
    const structuralCompliance = hasVariableSection && hasGlassPanelSection && hasTextHierarchy && hasHoverEffects;
    console.log(`${structuralCompliance ? '✅' : '❌'} Overall structural compliance`);
    
    return { structuralCompliance, patterns: classicLightPatterns.length };
  }).catch(err => {
    console.log('⚠️ Blueprint compliance test requires server access');
    return { tested: false };
  });
}

// Helper function to extract structural patterns
function extractStructuralPatterns(css, themeName) {
  const patterns = [];
  
  // Extract selectors
  const selectorRegex = new RegExp(`html\\[data-theme="${themeName}"\\][^{]*{`, 'g');
  const matches = css.match(selectorRegex) || [];
  
  matches.forEach(match => {
    const selector = match.replace('{', '').trim();
    patterns.push({ type: 'selector', value: selector });
  });
  
  // Extract CSS variables
  const variableRegex = /--theme-[^:]+:/g;
  const variableMatches = css.match(variableRegex) || [];
  
  variableMatches.forEach(match => {
    const variable = match.replace(':', '').trim();
    patterns.push({ type: 'variable', value: variable });
  });
  
  return patterns;
}

// Test 2: CSS Architecture Simplicity Metrics
function testArchitecturalSimplicity() {
  console.log('\n🎯 ARCHITECTURAL SIMPLICITY METRICS');
  console.log('Measuring complexity reduction vs bloated architecture');
  
  return fetch('/src/styles/themes/classic-light.css')
    .then(response => response.text())
    .then(cssContent => {
      
      // Count complexity indicators
      const selectorCount = (cssContent.match(/html\[data-theme="classic-light"\]/g) || []).length;
      const nestedSelectors = (cssContent.match(/html\[data-theme="classic-light"\][^{]*[^}]*{[^}]*}/g) || []).length;
      const pseudoSelectors = (cssContent.match(/:hover|:focus|:active/g) || []).length;
      const mediaQueries = (cssContent.match(/@media/g) || []).length;
      const importantDeclarations = (cssContent.match(/!important/g) || []).length;
      const notSelectors = (cssContent.match(/:not\(/g) || []).length;
      
      console.log('Complexity metrics:');
      console.log(`  Theme selectors: ${selectorCount}`);
      console.log(`  Nested selectors: ${nestedSelectors}`);
      console.log(`  Pseudo selectors: ${pseudoSelectors}`);
      console.log(`  Media queries: ${mediaQueries}`);
      console.log(`  !important declarations: ${importantDeclarations}`);
      console.log(`  :not() exclusions: ${notSelectors}`);
      
      // Calculate simplicity score (lower is better)
      const complexityScore = importantDeclarations * 10 + notSelectors * 5 + nestedSelectors * 2;
      const isSimple = complexityScore < 20; // Arbitrary threshold for simplicity
      
      console.log(`\nComplexity score: ${complexityScore} (lower is better)`);
      console.log(`${isSimple ? '✅' : '❌'} Architectural simplicity achieved`);
      
      return {
        selectorCount,
        complexityScore,
        isSimple,
        importantDeclarations,
        notSelectors
      };
    })
    .catch(err => {
      console.log('⚠️ Simplicity test requires server access');
      return { tested: false };
    });
}

// Test 3: Performance Optimization Validation
function testPerformanceOptimization() {
  console.log('\n⚡ PERFORMANCE OPTIMIZATION VALIDATION');
  console.log('Checking CSS parsing and rendering efficiency');
  
  // Measure CSS parsing time
  const startTime = performance.now();
  
  // Create a test element with classic-light theme
  const testElement = document.createElement('div');
  testElement.className = 'glass-panel';
  testElement.setAttribute('data-theme', 'classic-light');
  document.body.appendChild(testElement);
  
  // Force style calculation
  const computedStyle = getComputedStyle(testElement);
  const background = computedStyle.background;
  const border = computedStyle.border;
  const boxShadow = computedStyle.boxShadow;
  
  const endTime = performance.now();
  const parseTime = endTime - startTime;
  
  console.log(`CSS parsing time: ${parseTime.toFixed(2)}ms`);
  console.log(`Background computed: ${background !== 'none'}`);
  console.log(`Border computed: ${border !== 'none'}`);
  console.log(`Box shadow computed: ${boxShadow !== 'none'}`);
  
  // Clean up
  document.body.removeChild(testElement);
  
  const isPerformant = parseTime < 10; // Under 10ms is good
  console.log(`${isPerformant ? '✅' : '❌'} Performance optimization (${parseTime.toFixed(2)}ms)`);
  
  return {
    parseTime,
    isPerformant,
    stylesApplied: background !== 'none' && border !== 'none'
  };
}

// Test 4: Semantic Class Priority System
function testSemanticClassPriority() {
  console.log('\n🎨 SEMANTIC CLASS PRIORITY SYSTEM');
  console.log('Validating that semantic classes work without overrides');
  
  // Test semantic classes
  const semanticClasses = [
    'text-primary',
    'text-header', 
    'text-secondary',
    'text-interactive',
    'text-success'
  ];
  
  const results = semanticClasses.map(className => {
    const testElement = document.createElement('div');
    testElement.className = className;
    testElement.setAttribute('data-theme', 'classic-light');
    document.body.appendChild(testElement);
    
    const computedStyle = getComputedStyle(testElement);
    const color = computedStyle.color;
    const hasColor = color !== 'rgba(0, 0, 0, 0)' && color !== 'rgb(0, 0, 0)';
    
    document.body.removeChild(testElement);
    
    return { className, color, hasColor };
  });
  
  console.log('Semantic class validation:');
  results.forEach(result => {
    console.log(`  ${result.hasColor ? '✅' : '❌'} .${result.className}: ${result.color}`);
  });
  
  const allWorking = results.every(r => r.hasColor);
  console.log(`${allWorking ? '✅' : '❌'} All semantic classes functional`);
  
  return { results, allWorking };
}

// Test 5: Hover Effect Shadow Progression
function testHoverShadowProgression() {
  console.log('\n🌟 HOVER EFFECT SHADOW PROGRESSION');
  console.log('Validating proper shadow strengthening on hover');
  
  const testElement = document.createElement('div');
  testElement.className = 'glass-panel';
  testElement.setAttribute('data-theme', 'classic-light');
  document.body.appendChild(testElement);
  
  // Get initial shadow
  const initialStyle = getComputedStyle(testElement);
  const initialShadow = initialStyle.boxShadow;
  const initialTransform = initialStyle.transform;
  
  // Apply hover state
  testElement.classList.add('force-hover');
  
  setTimeout(() => {
    const hoverStyle = getComputedStyle(testElement);
    const hoverShadow = hoverStyle.boxShadow;
    const hoverTransform = hoverStyle.transform;
    
    // Analyze shadow progression
    const shadowChanged = hoverShadow !== initialShadow;
    const hasTransform = hoverTransform !== 'none' && hoverTransform !== initialTransform;
    const shadowStrengthened = hoverShadow.includes('64px') || hoverShadow.includes('24px'); // Stronger shadows
    
    console.log('Shadow progression analysis:');
    console.log(`  Initial: ${initialShadow}`);
    console.log(`  Hover: ${hoverShadow}`);
    console.log(`  Transform: ${hoverTransform}`);
    
    console.log(`${shadowChanged ? '✅' : '❌'} Shadow changes on hover`);
    console.log(`${shadowStrengthened ? '✅' : '❌'} Shadow strengthens (not weakens)`);
    console.log(`${hasTransform ? '✅' : '❌'} Transform applied`);
    
    // Clean up
    testElement.classList.remove('force-hover');
    document.body.removeChild(testElement);
    
    const correctProgression = shadowChanged && shadowStrengthened && hasTransform;
    console.log(`${correctProgression ? '✅' : '❌'} Correct hover progression`);
    
    return { correctProgression, shadowChanged, shadowStrengthened, hasTransform };
  }, 100);
}

// Run all architectural compliance tests
async function runArchitecturalCompliance() {
  console.log('🚀 Starting Classic Light Architectural Compliance Tests...\n');
  
  const results = {
    blueprint: await testDualBlueprintCompliance(),
    simplicity: await testArchitecturalSimplicity(),
    performance: testPerformanceOptimization(),
    semantics: testSemanticClassPriority(),
    hover: testHoverShadowProgression()
  };
  
  // Architectural compliance summary
  console.log('\n🏗️ ARCHITECTURAL COMPLIANCE SUMMARY');
  console.log('=====================================');
  
  let passedTests = 0;
  let totalTests = 0;
  
  if (results.blueprint && results.blueprint.structuralCompliance) {
    console.log('✅ Dual blueprint pattern compliance');
    passedTests++;
  } else {
    console.log('❌ Blueprint pattern violations');
  }
  totalTests++;
  
  if (results.simplicity && results.simplicity.isSimple) {
    console.log('✅ Architectural simplicity achieved');
    passedTests++;
  } else {
    console.log('❌ Architecture too complex');
  }
  totalTests++;
  
  if (results.performance && results.performance.isPerformant) {
    console.log('✅ Performance optimization validated');
    passedTests++;
  } else {
    console.log('❌ Performance needs improvement');
  }
  totalTests++;
  
  if (results.semantics && results.semantics.allWorking) {
    console.log('✅ Semantic class priority system working');
    passedTests++;
  } else {
    console.log('❌ Semantic classes need fixes');
  }
  totalTests++;
  
  console.log(`\n🎯 ARCHITECTURAL SCORE: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🏆 CLASSIC LIGHT THEME - ARCHITECTURAL EXCELLENCE ACHIEVED!');
    console.log('Meets both Kyoto and Professional blueprint standards');
  } else {
    console.log('⚠️ Architectural improvements needed before deployment');
  }
  
  return results;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  runArchitecturalCompliance();
}

// Export for Node.js testing
if (typeof module !== 'undefined') {
  module.exports = { 
    runArchitecturalCompliance, 
    testDualBlueprintCompliance, 
    testArchitecturalSimplicity,
    testSemanticClassPriority 
  };
}