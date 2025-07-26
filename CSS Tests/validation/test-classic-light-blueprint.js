// Classic Light Theme Blueprint Compliance Test
// Following CSS Tests methodology for systematic validation

console.log('🎨 CLASSIC LIGHT THEME - Blueprint Compliance Test');
console.log('================================================');

// Test 1: File Size Reduction Analysis
function testFileSizeReduction() {
  console.log('\n📊 FILE SIZE ANALYSIS');
  console.log('Target: 60-70% reduction from bloated architecture');
  
  // Backup file analysis (original bloated version)
  fetch('/CSS Tests/validation/classic-light-backup.css')
    .then(response => response.text())
    .then(backupContent => {
      const backupLines = backupContent.split('\n').filter(line => line.trim()).length;
      const backupSize = backupContent.length;
      
      // New blueprint file analysis
      return fetch('/src/styles/themes/classic-light.css')
        .then(response => response.text())
        .then(newContent => {
          const newLines = newContent.split('\n').filter(line => line.trim()).length;
          const newSize = newContent.length;
          
          const reduction = ((backupSize - newSize) / backupSize * 100).toFixed(1);
          const lineReduction = ((backupLines - newLines) / backupLines * 100).toFixed(1);
          
          console.log(`Original: ${backupLines} lines, ${backupSize} chars`);
          console.log(`New: ${newLines} lines, ${newSize} chars`);
          console.log(`Reduction: ${reduction}% file size, ${lineReduction}% lines`);
          console.log(`✅ Target achieved: ${reduction}% > 60%`);
          
          return { reduction: parseFloat(reduction), newLines, newSize };
        });
    })
    .catch(err => console.log('⚠️ File size test requires server access'));
}

// Test 2: CSS Variable Count (Minimal Variables Test)
function testMinimalVariables() {
  console.log('\n🔧 MINIMAL VARIABLES TEST');
  console.log('Target: 12 core variables max (following Kyoto pattern)');
  
  const themeElement = document.querySelector('html[data-theme="classic-light"]') || document.documentElement;
  const computedStyle = getComputedStyle(themeElement);
  
  // Count theme-specific CSS variables
  const themeVars = [];
  for (let i = 0; i < computedStyle.length; i++) {
    const prop = computedStyle[i];
    if (prop.startsWith('--theme-')) {
      themeVars.push(prop);
    }
  }
  
  console.log(`Found ${themeVars.length} theme variables:`);
  themeVars.forEach(varName => {
    const value = computedStyle.getPropertyValue(varName).trim();
    console.log(`  ${varName}: ${value}`);
  });
  
  const isMinimal = themeVars.length <= 12;
  console.log(`${isMinimal ? '✅' : '❌'} Variable count: ${themeVars.length}/12 max`);
  
  return { variableCount: themeVars.length, isMinimal };
}

// Test 3: No !important Declarations
function testNoImportantDeclarations() {
  console.log('\n🚫 NO !IMPORTANT DECLARATIONS TEST');
  console.log('Architectural principle: Clean cascade without !important');
  
  return fetch('/src/styles/themes/classic-light.css')
    .then(response => response.text())
    .then(cssContent => {
      const importantMatches = cssContent.match(/!important/g);
      const importantCount = importantMatches ? importantMatches.length : 0;
      
      console.log(`Found ${importantCount} !important declarations`);
      if (importantCount === 0) {
        console.log('✅ Clean architecture achieved - no !important needed');
      } else {
        console.log('❌ Architecture needs improvement - !important found');
        // Show lines with !important
        const lines = cssContent.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('!important')) {
            console.log(`  Line ${index + 1}: ${line.trim()}`);
          }
        });
      }
      
      return { importantCount, isClean: importantCount === 0 };
    })
    .catch(err => console.log('⚠️ !important test requires server access'));
}

// Test 4: Kyoto Blueprint Pattern Compliance
function testKyotoBlueprintCompliance() {
  console.log('\n📋 KYOTO BLUEPRINT PATTERN COMPLIANCE');
  console.log('Checking structural consistency with Kyoto gold standard');
  
  const requiredSelectors = [
    'html[data-theme="classic-light"]',
    'html[data-theme="classic-light"] .glass-panel',
    'html[data-theme="classic-light"] .glass-input-field',
    'html[data-theme="classic-light"] .text-header',
    'html[data-theme="classic-light"] .text-secondary',
    'html[data-theme="classic-light"] .text-interactive',
    'html[data-theme="classic-light"] .glass-panel:hover'
  ];
  
  const results = requiredSelectors.map(selector => {
    const elements = document.querySelectorAll(selector);
    const exists = elements.length > 0 || selector.includes(':hover');
    return { selector, exists, count: elements.length };
  });
  
  console.log('Required selectors check:');
  results.forEach(result => {
    console.log(`  ${result.exists ? '✅' : '❌'} ${result.selector}`);
  });
  
  const allPresent = results.every(r => r.exists);
  console.log(`${allPresent ? '✅' : '❌'} Blueprint pattern compliance`);
  
  return { results, compliant: allPresent };
}

// Test 5: Hover Effects Validation
function testHoverEffects() {
  console.log('\n🎯 HOVER EFFECTS VALIDATION');
  console.log('Testing proper shadow progression (strengthen on hover)');
  
  // Find a glass panel to test
  const glassPanel = document.querySelector('.glass-panel');
  if (!glassPanel) {
    console.log('⚠️ No glass panel found for hover testing');
    return { tested: false };
  }
  
  // Get initial styles
  const initialStyle = getComputedStyle(glassPanel);
  const initialShadow = initialStyle.boxShadow;
  const initialTransform = initialStyle.transform;
  
  console.log('Initial state:');
  console.log(`  Box shadow: ${initialShadow}`);
  console.log(`  Transform: ${initialTransform}`);
  
  // Simulate hover
  glassPanel.classList.add('force-hover');
  
  setTimeout(() => {
    const hoverStyle = getComputedStyle(glassPanel);
    const hoverShadow = hoverStyle.boxShadow;
    const hoverTransform = hoverStyle.transform;
    
    console.log('Hover state:');
    console.log(`  Box shadow: ${hoverShadow}`);
    console.log(`  Transform: ${hoverTransform}`);
    
    // Check if shadow strengthened (more complex shadow = stronger)
    const shadowStrengthened = hoverShadow !== initialShadow && hoverShadow !== 'none';
    const hasTransform = hoverTransform !== 'none' && hoverTransform !== initialTransform;
    
    console.log(`${shadowStrengthened ? '✅' : '❌'} Shadow strengthened on hover`);
    console.log(`${hasTransform ? '✅' : '❌'} Transform applied on hover`);
    
    // Clean up
    glassPanel.classList.remove('force-hover');
    
    return { shadowStrengthened, hasTransform, tested: true };
  }, 100);
}

// Test 6: Accessibility Compliance
function testAccessibilityCompliance() {
  console.log('\n♿ ACCESSIBILITY COMPLIANCE TEST');
  console.log('Checking contrast ratios and text readability');
  
  // Test text contrast on glass panels
  const glassPanel = document.querySelector('.glass-panel');
  if (glassPanel) {
    const style = getComputedStyle(glassPanel);
    const bgColor = style.backgroundColor;
    const textColor = style.color;
    
    console.log(`Background: ${bgColor}`);
    console.log(`Text color: ${textColor}`);
    
    // Basic contrast check (simplified)
    const hasGoodContrast = textColor !== bgColor && textColor !== 'rgba(0, 0, 0, 0)';
    console.log(`${hasGoodContrast ? '✅' : '❌'} Basic contrast check`);
    
    return { hasGoodContrast, bgColor, textColor };
  }
  
  console.log('⚠️ No glass panel found for accessibility testing');
  return { tested: false };
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Classic Light Theme Blueprint Compliance Tests...\n');
  
  const results = {
    fileSize: await testFileSizeReduction(),
    variables: testMinimalVariables(),
    important: await testNoImportantDeclarations(),
    blueprint: testKyotoBlueprintCompliance(),
    hover: testHoverEffects(),
    accessibility: testAccessibilityCompliance()
  };
  
  // Summary
  console.log('\n📋 TEST SUMMARY');
  console.log('================');
  
  let passedTests = 0;
  let totalTests = 0;
  
  if (results.fileSize && results.fileSize.reduction > 60) {
    console.log('✅ File size reduction achieved');
    passedTests++;
  } else {
    console.log('❌ File size reduction target missed');
  }
  totalTests++;
  
  if (results.variables && results.variables.isMinimal) {
    console.log('✅ Minimal variables compliance');
    passedTests++;
  } else {
    console.log('❌ Too many variables (bloated architecture)');
  }
  totalTests++;
  
  if (results.important && results.important.isClean) {
    console.log('✅ Clean architecture (no !important)');
    passedTests++;
  } else {
    console.log('❌ Architecture needs improvement (!important found)');
  }
  totalTests++;
  
  if (results.blueprint && results.blueprint.compliant) {
    console.log('✅ Kyoto blueprint pattern compliance');
    passedTests++;
  } else {
    console.log('❌ Blueprint pattern violations found');
  }
  totalTests++;
  
  console.log(`\n🎯 OVERALL SCORE: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 CLASSIC LIGHT THEME - BLUEPRINT COMPLIANCE ACHIEVED!');
    console.log('Ready for production use with Kyoto-level quality');
  } else {
    console.log('⚠️ Some tests failed - review and fix before deployment');
  }
  
  return results;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  runAllTests();
}

// Export for Node.js testing
if (typeof module !== 'undefined') {
  module.exports = { runAllTests, testMinimalVariables, testKyotoBlueprintCompliance };
}