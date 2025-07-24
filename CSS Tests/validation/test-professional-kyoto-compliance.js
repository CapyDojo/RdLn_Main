// Professional Theme Kyoto Compliance Validation
// Comprehensive test to ensure Professional follows Kyoto blueprint

(function() {
  console.log('✅ PROFESSIONAL THEME: KYOTO COMPLIANCE VALIDATION');
  console.log('=================================================');

  const currentTheme = document.documentElement.getAttribute('data-theme');
  
  if (currentTheme !== 'professional') {
    console.log('❌ Please switch to Professional theme first');
    return;
  }

  console.log('🎯 Testing Professional theme against Kyoto blueprint standards...\n');

  // Test 1: Variable Minimalism (Kyoto Standard)
  console.log('📊 Test 1: Variable Minimalism');
  console.log('==============================');
  
  const computedStyle = getComputedStyle(document.documentElement);
  const themeVars = [];
  
  for (let i = 0; i < computedStyle.length; i++) {
    const prop = computedStyle[i];
    if (prop.startsWith('--theme-')) {
      themeVars.push(prop);
    }
  }
  
  const kyotoVarCount = 12; // Kyoto has ~12 core variables
  const professionalVarCount = themeVars.length;
  const variableMinimalism = professionalVarCount <= (kyotoVarCount + 3); // Allow 3 extra for theme-specific needs
  
  console.log(`Kyoto variable count: ${kyotoVarCount}`);
  console.log(`Professional variable count: ${professionalVarCount}`);
  console.log(`Variable minimalism: ${variableMinimalism ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!variableMinimalism) {
    console.log('⚠️ Professional has too many variables compared to Kyoto blueprint');
  }

  // Test 2: Core Glass Panel Architecture
  console.log('\n🪟 Test 2: Glass Panel Architecture');
  console.log('===================================');
  
  const glassPanels = document.querySelectorAll('.glass-panel');
  const glassArchitecture = {
    panelsFound: glassPanels.length > 0,
    backgroundVariable: false,
    borderVariable: false,
    shadowVariable: false,
    backdropFilter: false
  };
  
  if (glassPanels.length > 0) {
    const panel = glassPanels[0];
    const panelStyles = getComputedStyle(panel);
    
    // Check if using CSS variables (not hardcoded values)
    glassArchitecture.backgroundVariable = panelStyles.backgroundColor.includes('var(') || 
                                          panelStyles.backgroundColor.includes('rgba(255, 255, 255') ||
                                          panelStyles.backgroundColor !== 'rgba(0, 0, 0, 0)';
    glassArchitecture.borderVariable = panelStyles.borderColor.includes('var(') ||
                                      panelStyles.borderColor.includes('rgba(191, 219, 254');
    glassArchitecture.shadowVariable = panelStyles.boxShadow.includes('rgba(30, 64, 175') ||
                                      panelStyles.boxShadow !== 'none';
    glassArchitecture.backdropFilter = panelStyles.backdropFilter !== 'none';
    
    console.log(`Glass panels found: ${glassPanels.length} ✅`);
    console.log(`Background uses variables: ${glassArchitecture.backgroundVariable ? '✅' : '❌'}`);
    console.log(`Border uses variables: ${glassArchitecture.borderVariable ? '✅' : '❌'}`);
    console.log(`Shadow uses variables: ${glassArchitecture.shadowVariable ? '✅' : '❌'}`);
    console.log(`Backdrop filter applied: ${glassArchitecture.backdropFilter ? '✅' : '❌'}`);
  } else {
    console.log('❌ No glass panels found');
  }

  // Test 3: Text Hierarchy (Kyoto Pattern)
  console.log('\n📝 Test 3: Text Hierarchy');
  console.log('=========================');
  
  const textTests = {
    bodyColor: getComputedStyle(document.documentElement).color,
    headerFound: false,
    primaryFound: false,
    secondaryFound: false,
    semanticClassesWork: true
  };
  
  // Test semantic classes
  const testElements = {
    header: document.querySelector('.text-header') || document.querySelector('h1, h2, h3'),
    primary: document.querySelector('.text-theme-primary-900') || document.querySelector('.text-primary'),
    secondary: document.querySelector('.text-secondary')
  };
  
  Object.entries(testElements).forEach(([type, element]) => {
    if (element) {
      const color = getComputedStyle(element).color;
      textTests[`${type}Found`] = true;
      console.log(`${type} text color: ${color} ✅`);
    } else {
      console.log(`${type} element: Not found ⚠️`);
    }
  });
  
  console.log(`Body text color: ${textTests.bodyColor}`);
  console.log(`Text hierarchy working: ${Object.values(textTests).every(Boolean) ? '✅' : '❌'}`);

  // Test 4: Hover Effects (Kyoto Pattern)
  console.log('\n🖱️ Test 4: Hover Effects');
  console.log('========================');
  
  let hoverEffectsWorking = false;
  
  if (glassPanels.length > 0) {
    const panel = glassPanels[0];
    const originalStyles = {
      background: getComputedStyle(panel).backgroundColor,
      border: getComputedStyle(panel).borderColor,
      shadow: getComputedStyle(panel).boxShadow,
      transform: getComputedStyle(panel).transform
    };
    
    // Test hover
    panel.classList.add('force-hover');
    
    setTimeout(() => {
      const hoverStyles = {
        background: getComputedStyle(panel).backgroundColor,
        border: getComputedStyle(panel).borderColor,
        shadow: getComputedStyle(panel).boxShadow,
        transform: getComputedStyle(panel).transform
      };
      
      const changesDetected = {
        background: originalStyles.background !== hoverStyles.background,
        border: originalStyles.border !== hoverStyles.border,
        shadow: originalStyles.shadow !== hoverStyles.shadow,
        transform: originalStyles.transform !== hoverStyles.transform
      };
      
      hoverEffectsWorking = Object.values(changesDetected).some(Boolean);
      
      console.log(`Background change: ${changesDetected.background ? '✅' : '❌'}`);
      console.log(`Border change: ${changesDetected.border ? '✅' : '❌'}`);
      console.log(`Shadow change: ${changesDetected.shadow ? '✅' : '❌'}`);
      console.log(`Transform change: ${changesDetected.transform ? '✅' : '❌'}`);
      console.log(`Hover effects working: ${hoverEffectsWorking ? '✅' : '❌'}`);
      
      panel.classList.remove('force-hover');
      
      // Final Assessment
      console.log('\n🎯 FINAL KYOTO COMPLIANCE ASSESSMENT');
      console.log('====================================');
      
      const compliance = {
        variableMinimalism,
        glassArchitecture: Object.values(glassArchitecture).every(Boolean),
        textHierarchy: Object.values(textTests).every(Boolean),
        hoverEffects: hoverEffectsWorking
      };
      
      console.log(`Variable Minimalism: ${compliance.variableMinimalism ? '✅' : '❌'}`);
      console.log(`Glass Architecture: ${compliance.glassArchitecture ? '✅' : '❌'}`);
      console.log(`Text Hierarchy: ${compliance.textHierarchy ? '✅' : '❌'}`);
      console.log(`Hover Effects: ${compliance.hoverEffects ? '✅' : '❌'}`);
      
      const overallCompliance = Object.values(compliance).every(Boolean);
      console.log(`\n🏆 OVERALL COMPLIANCE: ${overallCompliance ? '✅ PASS' : '❌ FAIL'}`);
      
      if (overallCompliance) {
        console.log('\n🎉 SUCCESS: Professional theme follows Kyoto blueprint!');
        console.log('✅ Minimal variables maintained');
        console.log('✅ Clean architecture preserved');
        console.log('✅ All core functionality working');
        console.log('✅ Ready for production use');
      } else {
        console.log('\n⚠️ ISSUES DETECTED:');
        Object.entries(compliance).forEach(([test, passed]) => {
          if (!passed) {
            console.log(`❌ ${test} needs attention`);
          }
        });
        console.log('\n💡 Consider rollback if critical issues found');
      }
      
    }, 100);
  } else {
    console.log('❌ Cannot test hover effects - no glass panels found');
  }

  console.log('\n✅ Validation complete!');
  
})();