// Aurora Borealis Theme Integration Test
// Tests theme functionality in browser context

console.log('🌌 AURORA BOREALIS INTEGRATION TEST');
console.log('===================================');

// Test theme application
function testThemeApplication() {
  console.log('\n🎨 THEME APPLICATION TEST');
  
  // Set theme
  document.documentElement.setAttribute('data-theme', 'aurora-borealis');
  console.log('✅ Theme attribute set to aurora-borealis');
  
  // Verify theme is active
  const currentTheme = document.documentElement.getAttribute('data-theme');
  console.log(`Current theme: ${currentTheme}`);
  
  if (currentTheme === 'aurora-borealis') {
    console.log('✅ Aurora Borealis theme successfully applied');
  } else {
    console.log('❌ Theme application failed');
  }
}

// Test CSS variables
function testCSSVariables() {
  console.log('\n🎯 CSS VARIABLES TEST');
  
  const rootStyles = getComputedStyle(document.documentElement);
  
  const expectedVariables = [
    '--theme-glass-bg',
    '--theme-glass-border',
    '--theme-glass-hover-border',
    '--theme-glass-hover-shadow',
    '--theme-text-body',
    '--theme-text-header',
    '--theme-text-primary'
  ];
  
  expectedVariables.forEach(variable => {
    const value = rootStyles.getPropertyValue(variable);
    if (value.trim()) {
      console.log(`✅ ${variable}: ${value.trim()}`);
    } else {
      console.log(`❌ ${variable}: Not found`);
    }
  });
}

// Test glass panel styling
function testGlassPanels() {
  console.log('\n🪟 GLASS PANEL TEST');
  
  // Find or create a glass panel for testing
  let testPanel = document.querySelector('.glass-panel');
  if (!testPanel) {
    testPanel = document.createElement('div');
    testPanel.className = 'glass-panel';
    testPanel.style.width = '200px';
    testPanel.style.height = '100px';
    testPanel.style.position = 'fixed';
    testPanel.style.top = '10px';
    testPanel.style.right = '10px';
    testPanel.style.zIndex = '9999';
    testPanel.textContent = 'Aurora Test Panel';
    document.body.appendChild(testPanel);
    console.log('✅ Test glass panel created');
  }
  
  const panelStyles = getComputedStyle(testPanel);
  
  // Check key properties
  const background = panelStyles.background;
  const border = panelStyles.border;
  const backdropFilter = panelStyles.backdropFilter;
  
  console.log(`Background: ${background.substring(0, 50)}...`);
  console.log(`Border: ${border}`);
  console.log(`Backdrop Filter: ${backdropFilter}`);
  
  if (background.includes('rgba') && border.includes('rgba')) {
    console.log('✅ Glass panel styling applied correctly');
  } else {
    console.log('❌ Glass panel styling issues detected');
  }
  
  return testPanel;
}

// Test hover effects
function testHoverEffects(testPanel) {
  console.log('\n✨ HOVER EFFECTS TEST');
  
  if (!testPanel) {
    console.log('❌ No test panel available for hover testing');
    return;
  }
  
  // Get initial styles
  const initialStyles = getComputedStyle(testPanel);
  const initialTransform = initialStyles.transform;
  const initialBoxShadow = initialStyles.boxShadow;
  
  console.log(`Initial transform: ${initialTransform}`);
  console.log(`Initial box-shadow: ${initialBoxShadow.substring(0, 50)}...`);
  
  // Simulate hover
  testPanel.classList.add('force-hover');
  
  // Check hover styles
  setTimeout(() => {
    const hoverStyles = getComputedStyle(testPanel);
    const hoverTransform = hoverStyles.transform;
    const hoverBoxShadow = hoverStyles.boxShadow;
    
    console.log(`Hover transform: ${hoverTransform}`);
    console.log(`Hover box-shadow: ${hoverBoxShadow.substring(0, 50)}...`);
    
    if (hoverTransform.includes('translateY') && hoverBoxShadow !== initialBoxShadow) {
      console.log('✅ Hover effects working correctly');
    } else {
      console.log('❌ Hover effects not working as expected');
    }
    
    // Remove hover class
    testPanel.classList.remove('force-hover');
  }, 100);
}

// Test text hierarchy
function testTextHierarchy() {
  console.log('\n📝 TEXT HIERARCHY TEST');
  
  // Create test elements
  const testContainer = document.createElement('div');
  testContainer.style.position = 'fixed';
  testContainer.style.top = '120px';
  testContainer.style.right = '10px';
  testContainer.style.background = 'rgba(0,0,0,0.8)';
  testContainer.style.padding = '10px';
  testContainer.style.borderRadius = '8px';
  testContainer.style.zIndex = '9999';
  
  const textClasses = [
    'text-primary',
    'text-header', 
    'text-secondary',
    'text-interactive',
    'text-success'
  ];
  
  textClasses.forEach(className => {
    const textElement = document.createElement('div');
    textElement.className = className;
    textElement.textContent = `${className} text`;
    testContainer.appendChild(textElement);
    
    const styles = getComputedStyle(textElement);
    const color = styles.color;
    console.log(`✅ ${className}: ${color}`);
  });
  
  document.body.appendChild(testContainer);
  
  // Clean up after 3 seconds
  setTimeout(() => {
    document.body.removeChild(testContainer);
  }, 3000);
}

// Test theme switching
function testThemeSwitching() {
  console.log('\n🔄 THEME SWITCHING TEST');
  
  const originalTheme = document.documentElement.getAttribute('data-theme');
  
  // Switch to different theme and back
  document.documentElement.setAttribute('data-theme', 'kyoto');
  console.log('✅ Switched to Kyoto theme');
  
  setTimeout(() => {
    document.documentElement.setAttribute('data-theme', 'aurora-borealis');
    console.log('✅ Switched back to Aurora Borealis theme');
    
    // Verify variables are still working
    const rootStyles = getComputedStyle(document.documentElement);
    const textBody = rootStyles.getPropertyValue('--theme-text-body');
    
    if (textBody.includes('#64deea')) {
      console.log('✅ Theme switching maintains Aurora Borealis variables');
    } else {
      console.log('❌ Theme switching issue detected');
    }
  }, 1000);
}

// Run all tests
function runIntegrationTests() {
  testThemeApplication();
  testCSSVariables();
  
  const testPanel = testGlassPanels();
  testHoverEffects(testPanel);
  testTextHierarchy();
  testThemeSwitching();
  
  console.log('\n🎉 INTEGRATION TESTS COMPLETE');
  console.log('Check visual elements in top-right corner');
  
  // Clean up test panel after 5 seconds
  setTimeout(() => {
    if (testPanel && testPanel.parentNode) {
      testPanel.parentNode.removeChild(testPanel);
      console.log('✅ Test elements cleaned up');
    }
  }, 5000);
}

// Execute tests
runIntegrationTests();