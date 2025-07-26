// CSS Protocol Debug: Kyoto Theme Green Text Colors in FontSizeSelector
// Following Rule #3: Systematic CSS Debugging to Avoid Deadends

console.log('🔍 CSS DEBUG: Kyoto Theme Green Text Colors in FontSizeSelector');
console.log('==============================================================');

// 3.1. INSPECT FIRST, CODE SECOND
console.log('\n📋 STEP 1: SET KYOTO THEME AND INSPECT');

// Set theme to kyoto for testing
document.documentElement.setAttribute('data-theme', 'kyoto');

// Wait for styles to apply
setTimeout(() => {
  console.log('Theme set to: kyoto');
  
  // 3.2. IDENTIFY THE REAL PROBLEM
  console.log('\n🎯 STEP 2: LOCATE FONTSIZESELECTOR ELEMENTS');
  
  // Find FontSizeSelector
  const fontSizeSelector = document.querySelector('.font-size-control') || 
                           Array.from(document.querySelectorAll('.segmented-control'))
                                .find(el => el.textContent.includes('Aa'));
  
  if (!fontSizeSelector) {
    console.log('❌ FontSizeSelector not found');
    return;
  }
  
  console.log('✅ FontSizeSelector found:', fontSizeSelector);
  
  // 3.3. VERIFY SELECTOR TARGETING
  console.log('\n🔍 STEP 3: ANALYZE AA BUTTON COLORS');
  
  const aaButtons = Array.from(fontSizeSelector.querySelectorAll('button'))
                         .filter(btn => btn.textContent.includes('Aa'));
  
  console.log(`Found ${aaButtons.length} Aa buttons`);
  
  aaButtons.forEach((button, i) => {
    const buttonStyle = getComputedStyle(button);
    const span = button.querySelector('span');
    const spanStyle = span ? getComputedStyle(span) : null;
    
    console.log(`\nAa Button ${i + 1}:`);
    console.log(`  Button color: ${buttonStyle.color}`);
    console.log(`  Button classes: ${button.className}`);
    console.log(`  Is active: ${button.classList.contains('active')}`);
    
    if (spanStyle) {
      console.log(`  Span color: ${spanStyle.color}`);
      console.log(`  Span classes: ${span.className}`);
    }
    
    // Check if color is green-ish
    const isGreenish = buttonStyle.color.includes('134, 239, 172') || // #86efac
                       buttonStyle.color.includes('187, 247, 208') || // #bbf7d0
                       buttonStyle.color.includes('248, 180, 180') || // #f8b4b4 (pinkish)
                       buttonStyle.color.includes('238, 143, 28');    // #ee8f1c (orange)
    
    console.log(`  Color appears green/themed: ${isGreenish}`);
  });
  
  // 3.4. CHECK CSS VARIABLES
  console.log('\n🔧 STEP 4: KYOTO THEME CSS VARIABLES');
  
  const htmlStyle = getComputedStyle(document.documentElement);
  const kyotoVars = {
    'theme-text-body': htmlStyle.getPropertyValue('--theme-text-body').trim(),
    'theme-text-header': htmlStyle.getPropertyValue('--theme-text-header').trim(),
    'theme-text-secondary': htmlStyle.getPropertyValue('--theme-text-secondary').trim(),
    'theme-text-interactive': htmlStyle.getPropertyValue('--theme-text-interactive').trim(),
    'theme-text-success': htmlStyle.getPropertyValue('--theme-text-success').trim(),
    'theme-text-primary': htmlStyle.getPropertyValue('--theme-text-primary').trim()
  };
  
  console.log('Kyoto CSS Variables:');
  Object.entries(kyotoVars).forEach(([key, value]) => {
    const isGreen = value.includes('#86efac') || value.includes('#bbf7d0');
    console.log(`  --${key}: ${value} ${isGreen ? '🟢 (GREEN!)' : ''}`);
  });
  
  // 3.5. TEST HOVER EFFECTS
  console.log('\n🎯 STEP 5: TEST HOVER EFFECTS');
  
  if (aaButtons.length > 0) {
    const testButton = aaButtons[0];
    const initialColor = getComputedStyle(testButton).color;
    
    console.log(`Initial color: ${initialColor}`);
    
    // Simulate hover
    testButton.dispatchEvent(new MouseEvent('mouseenter'));
    
    setTimeout(() => {
      const hoverColor = getComputedStyle(testButton).color;
      console.log(`Hover color: ${hoverColor}`);
      console.log(`Color changed on hover: ${hoverColor !== initialColor}`);
      
      // Remove hover
      testButton.dispatchEvent(new MouseEvent('mouseleave'));
    }, 100);
  }
  
  // 3.6. CHECK FOR INHERITANCE CHAIN
  console.log('\n🔗 STEP 6: INHERITANCE CHAIN ANALYSIS');
  
  if (aaButtons.length > 0) {
    const testButton = aaButtons[0];
    let currentElement = testButton;
    let level = 0;
    
    console.log('Inheritance chain:');
    while (currentElement && level < 10) {
      const style = getComputedStyle(currentElement);
      const color = style.color;
      const tagName = currentElement.tagName;
      const classes = currentElement.className;
      
      console.log(`  Level ${level}: ${tagName}.${classes} - color: ${color}`);
      
      currentElement = currentElement.parentElement;
      level++;
    }
  }
  
  // 3.7. CHECK FOR ACTIVE STATE STYLING
  console.log('\n⭐ STEP 7: ACTIVE STATE ANALYSIS');
  
  aaButtons.forEach((button, i) => {
    const isActive = button.classList.contains('active');
    const buttonStyle = getComputedStyle(button);
    
    console.log(`Button ${i + 1} (${isActive ? 'ACTIVE' : 'inactive'}):`);
    console.log(`  Color: ${buttonStyle.color}`);
    console.log(`  Background: ${buttonStyle.background}`);
    
    if (isActive) {
      console.log(`  🎯 This is the ACTIVE button - likely source of green color`);
    }
  });
  
  // 3.8. SOLUTION ANALYSIS
  console.log('\n💡 STEP 8: GREEN COLOR SOURCE ANALYSIS');
  
  const greenColors = [
    { name: 'theme-text-header', value: '#86efac', description: 'Light green - headers' },
    { name: 'theme-text-success', value: '#bbf7d0', description: 'Lighter green - success/active' },
    { name: 'theme-text-body', value: '#f8b4b4', description: 'Pink - body text' },
    { name: 'theme-text-interactive', value: '#f8b4b4', description: 'Pink - interactive' },
    { name: 'theme-text-primary', value: '#ee8f1c', description: 'Orange - primary' }
  ];
  
  console.log('Potential green color sources in Kyoto theme:');
  greenColors.forEach(color => {
    console.log(`  ${color.name}: ${color.value} - ${color.description}`);
  });
  
  // Check which one matches the actual button colors
  const actualButtonColor = aaButtons.length > 0 ? getComputedStyle(aaButtons[0]).color : 'none';
  console.log(`\nActual button color: ${actualButtonColor}`);
  
  // Convert hex to rgb for comparison
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : null;
  };
  
  greenColors.forEach(color => {
    const rgbValue = hexToRgb(color.value);
    const matches = actualButtonColor.includes(rgbValue?.replace('rgb(', '').replace(')', ''));
    if (matches || actualButtonColor === rgbValue) {
      console.log(`🎯 MATCH FOUND: ${color.name} (${color.value}) matches actual color!`);
    }
  });
  
  console.log('\n🏁 DEBUG COMPLETE');
  console.log('The green colors are likely coming from Kyoto theme CSS variables');
  console.log('Check if buttons are inheriting from --theme-text-header (#86efac) or --theme-text-success (#bbf7d0)');
  
}, 100);

console.log('Debug script loaded. Results will appear in 100ms...');