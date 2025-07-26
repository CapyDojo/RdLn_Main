// Classic Dark Theme Architecture Compliance Test
// Validates architectural compliance with Kyoto and Professional blueprints

console.log('🏗️ CLASSIC DARK ARCHITECTURE COMPLIANCE');
console.log('Validating architectural patterns against Kyoto and Professional blueprints');

// Test 1: File Structure Analysis
console.log('\n1️⃣ FILE STRUCTURE ANALYSIS:');

fetch('/src/styles/themes/classic-dark.css')
  .then(response => response.text())
  .then(css => {
    console.log('📄 CSS File Analysis:');
    
    const lines = css.split('\n');
    const totalLines = lines.length;
    const codeLines = lines.filter(line => line.trim() && !line.trim().startsWith('/*') && !line.trim().startsWith('*')).length;
    const commentLines = lines.filter(line => line.trim().startsWith('/*') || line.trim().startsWith('*')).length;
    const emptyLines = lines.filter(line => !line.trim()).length;
    
    console.log(`- Total lines: ${totalLines}`);
    console.log(`- Code lines: ${codeLines}`);
    console.log(`- Comment lines: ${commentLines}`);
    console.log(`- Empty lines: ${emptyLines}`);
    
    // Target: ~100 lines total (60-70% reduction from bloated architecture)
    const sizeCompliance = codeLines <= 80; // Allow some flexibility
    console.log(`\n📊 Size Target: ${sizeCompliance ? '✅' : '❌'} (${codeLines} code lines, target: ≤80)`);
    
    // Test 2: Architectural Patterns
    console.log('\n2️⃣ ARCHITECTURAL PATTERNS:');
    
    // Check for blueprint compliance patterns
    const hasThemeScoping = css.includes('html[data-theme="classic-dark"]');
    const hasMinimalVariables = (css.match(/--theme-/g) || []).length <= 15; // Max 12-15 variables
    const hasCleanSelectors = !css.includes(':not(') && !css.includes('> *');
    const noImportant = !css.includes('!important');
    const hasHoverEffects = css.includes(':hover') && css.includes('transform') && css.includes('box-shadow');
    
    console.log(`Theme Scoping: ${hasThemeScoping ? '✅' : '❌'}`);
    console.log(`Minimal Variables: ${hasMinimalVariables ? '✅' : '❌'} (${(css.match(/--theme-/g) || []).length} variables)`);
    console.log(`Clean Selectors: ${hasCleanSelectors ? '✅' : '❌'}`);
    console.log(`No !important: ${noImportant ? '✅' : '❌'}`);
    console.log(`Hover Effects: ${hasHoverEffects ? '✅' : '❌'}`);
    
    // Test 3: Blueprint Pattern Matching
    console.log('\n3️⃣ BLUEPRINT PATTERN MATCHING:');
    
    // Check for Kyoto/Professional blueprint patterns
    const patterns = {
      'CSS Variables Section': /\/\* Theme-scoped CSS Variables/,
      'Glass Panel Styling': /\.glass-panel \{/,
      'Input Field Styling': /\.glass-input-field \{/,
      'Text Hierarchy': /\/\* Clean Text Hierarchy/,
      'Hover Effects': /\/\* Clean Hover Effects/,
      'Text Selection': /::selection \{/,
      'Segmented Controls': /\.segmented-control/
    };
    
    Object.entries(patterns).forEach(([pattern, regex]) => {
      const found = regex.test(css);
      console.log(`${pattern}: ${found ? '✅' : '❌'}`);
    });
    
    // Test 4: Variable Structure Compliance
    console.log('\n4️⃣ VARIABLE STRUCTURE:');
    
    const requiredVariableGroups = {
      'Glass Colors': ['--theme-glass-bg', '--theme-glass-border', '--theme-glass-hover-border', '--theme-glass-hover-shadow'],
      'Glassmorphism Integration': ['--theme-glass-panel-hover-rgb', '--theme-glass-panel-hover-border-rgb', '--theme-glass-panel-hover-shadow-rgb'],
      'Text Hierarchy': ['--theme-text-body', '--theme-text-header', '--theme-text-secondary', '--theme-text-interactive', '--theme-text-success', '--theme-text-primary'],
      'UI Controls': ['--theme-segmented-control-bg', '--theme-segmented-control-border']
    };
    
    let totalRequired = 0;
    let foundRequired = 0;
    
    Object.entries(requiredVariableGroups).forEach(([group, variables]) => {
      console.log(`\n${group}:`);
      variables.forEach(variable => {
        totalRequired++;
        const found = css.includes(variable);
        if (found) {
          foundRequired++;
          console.log(`  ✅ ${variable}`);
        } else {
          console.log(`  ❌ ${variable}`);
        }
      });
    });
    
    const variableCompliance = (foundRequired / totalRequired * 100).toFixed(1);
    console.log(`\n📊 Variable Compliance: ${variableCompliance}% (${foundRequired}/${totalRequired})`);
    
    // Test 5: Selector Specificity Analysis
    console.log('\n5️⃣ SELECTOR SPECIFICITY:');
    
    const selectors = css.match(/[^{}]+(?=\s*\{)/g) || [];
    const specificityLevels = {
      low: 0,    // 0,0,1,0 - 0,0,2,0
      medium: 0, // 0,0,2,1 - 0,0,3,0  
      high: 0,   // 0,0,3,1+
      excessive: 0 // 0,1,0,0+
    };
    
    selectors.forEach(selector => {
      const trimmed = selector.trim();
      if (trimmed.includes('#')) {
        specificityLevels.excessive++;
      } else if (trimmed.split(' ').length > 3) {
        specificityLevels.high++;
      } else if (trimmed.includes(':hover') || trimmed.includes('::')) {
        specificityLevels.medium++;
      } else {
        specificityLevels.low++;
      }
    });
    
    console.log(`Low Specificity: ${specificityLevels.low} selectors`);
    console.log(`Medium Specificity: ${specificityLevels.medium} selectors`);
    console.log(`High Specificity: ${specificityLevels.high} selectors`);
    console.log(`Excessive Specificity: ${specificityLevels.excessive} selectors`);
    
    const goodSpecificity = specificityLevels.excessive === 0 && specificityLevels.high <= 2;
    console.log(`\nSpecificity Health: ${goodSpecificity ? '✅ Good' : '❌ Needs improvement'}`);
    
    // Test 6: Overall Compliance Score
    console.log('\n6️⃣ OVERALL COMPLIANCE SCORE:');
    
    let score = 0;
    const maxScore = 100;
    
    // Size compliance (20 points)
    if (sizeCompliance) score += 20;
    
    // Architectural patterns (50 points - 10 each)
    if (hasThemeScoping) score += 10;
    if (hasMinimalVariables) score += 10;
    if (hasCleanSelectors) score += 10;
    if (noImportant) score += 10;
    if (hasHoverEffects) score += 10;
    
    // Variable compliance (20 points)
    score += Math.round(foundRequired / totalRequired * 20);
    
    // Specificity health (10 points)
    if (goodSpecificity) score += 10;
    
    console.log(`\n🎯 COMPLIANCE SCORE: ${score}/${maxScore} (${(score/maxScore*100).toFixed(1)}%)`);
    
    if (score >= 90) {
      console.log('🏆 EXCELLENT: Fully compliant with Kyoto/Professional blueprints');
    } else if (score >= 75) {
      console.log('✅ GOOD: Mostly compliant with minor deviations');
    } else if (score >= 60) {
      console.log('⚠️ FAIR: Some compliance issues need addressing');
    } else {
      console.log('❌ POOR: Major architectural issues need fixing');
    }
    
    // Test 7: Comparison with Blueprints
    console.log('\n7️⃣ BLUEPRINT COMPARISON:');
    
    Promise.all([
      fetch('/src/styles/themes/kyoto.css').then(r => r.text()),
      fetch('/src/styles/themes/professional.css').then(r => r.text())
    ]).then(([kyotoCSS, professionalCSS]) => {
      const kyotoLines = kyotoCSS.split('\n').filter(line => line.trim() && !line.trim().startsWith('/*')).length;
      const professionalLines = professionalCSS.split('\n').filter(line => line.trim() && !line.trim().startsWith('/*')).length;
      
      console.log(`Kyoto Blueprint: ${kyotoLines} code lines`);
      console.log(`Professional Blueprint: ${professionalLines} code lines`);
      console.log(`Classic Dark: ${codeLines} code lines`);
      
      const avgBlueprintSize = (kyotoLines + professionalLines) / 2;
      const sizeVariance = Math.abs(codeLines - avgBlueprintSize) / avgBlueprintSize * 100;
      
      console.log(`\nSize Variance from Blueprints: ${sizeVariance.toFixed(1)}%`);
      
      if (sizeVariance <= 20) {
        console.log('✅ Size consistent with blueprints');
      } else if (sizeVariance <= 40) {
        console.log('⚠️ Size moderately different from blueprints');
      } else {
        console.log('❌ Size significantly different from blueprints');
      }
    }).catch(e => {
      console.log('⚠️ Could not compare with blueprint files');
    });
    
  })
  .catch(error => {
    console.log('❌ Could not analyze CSS file:', error);
  });

console.log('\n🏁 ARCHITECTURE COMPLIANCE TEST COMPLETE');
console.log('Review results above for detailed architectural analysis');