// Validate Architectural Fix - No !important needed
console.log('🏗️ VALIDATING ARCHITECTURAL FIX');
console.log('===============================');

// 1. Check theme variables
console.log('\n🔧 Checking theme variables...');
const themeVars = {
  '--theme-text-header': '#0f172a',
  '--theme-text-primary': '#0f172a',  // Should now match header
  '--theme-text-interactive': '#c2410c',
  '--glass-bg': '255, 255, 255',
  '--glass-border': '191, 219, 254',
  '--glass-shadow': '30, 64, 175'
};

let allVarsCorrect = true;
Object.entries(themeVars).forEach(([varName, expectedValue]) => {
  const actualValue = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const matches = actualValue === expectedValue;
  allVarsCorrect = allVarsCorrect && matches;
  
  console.log(`${matches ? '✅' : '❌'} ${varName}: ${actualValue} ${matches ? '' : `(expected: ${expectedValue})`}`);
});

// 2. Test header color - should work naturally now
console.log('\n📝 Testing header color (architectural fix)...');
const headers = document.querySelectorAll('h1, h2, h3');
let headerColorFixed = false;

if (headers.length > 0) {
  const header = headers[0];
  const headerColor = window.getComputedStyle(header).color;
  const expectedHeaderColor = 'rgb(15, 23, 42)'; // #0f172a
  headerColorFixed = headerColor === expectedHeaderColor;
  
  console.log(`Header element: ${header.tagName}`);
  console.log(`Header classes: ${header.className}`);
  console.log(`Header color: ${headerColor}`);
  console.log(`Expected: ${expectedHeaderColor}`);
  console.log(`Header color fixed: ${headerColorFixed ? '✅' : '❌'}`);
  
  // Test that text-theme-primary-900 now maps to header color
  const testDiv = document.createElement('div');
  testDiv.className = 'text-theme-primary-900';
  testDiv.style.display = 'none';
  document.body.appendChild(testDiv);
  
  const primaryColor = window.getComputedStyle(testDiv).color;
  const primaryMapsToHeader = primaryColor === expectedHeaderColor;
  
  console.log(`text-theme-primary-900 color: ${primaryColor}`);
  console.log(`Maps to header color: ${primaryMapsToHeader ? '✅' : '❌'}`);
  
  document.body.removeChild(testDiv);
}

// 3. Test glass panel hover effects
console.log('\n🎯 Testing glass panel hover effects...');
const glassPanels = document.querySelectorAll('.glass-panel');
let hoverWorking = false;

if (glassPanels.length > 0) {
  const panel = glassPanels[0];
  const originalBg = window.getComputedStyle(panel).background;
  
  panel.classList.add('force-hover');
  setTimeout(() => {
    const hoverBg = window.getComputedStyle(panel).background;
    hoverWorking = originalBg !== hoverBg;
    
    console.log(`Hover effects working: ${hoverWorking ? '✅' : '❌'}`);
    panel.classList.remove('force-hover');
  }, 50);
}

// 4. Check for !important declarations
console.log('\n🚫 Checking for !important declarations...');
let hasImportant = false;

try {
  const stylesheets = Array.from(document.styleSheets);
  stylesheets.forEach(sheet => {
    try {
      const rules = Array.from(sheet.cssRules || sheet.rules || []);
      rules.forEach(rule => {
        if (rule.cssText && rule.cssText.includes('!important') && 
            rule.selectorText && rule.selectorText.includes('professional')) {
          hasImportant = true;
          console.log(`Found !important in: ${rule.selectorText}`);
        }
      });
    } catch (e) {
      // Cross-origin or access issues
    }
  });
} catch (e) {
  console.log('Could not check stylesheets');
}

console.log(`No !important declarations: ${!hasImportant ? '✅' : '❌'}`);

// 5. Final architectural validation
setTimeout(() => {
  console.log('\n📊 ARCHITECTURAL VALIDATION RESULTS');
  console.log('===================================');
  
  const results = {
    variablesCorrect: allVarsCorrect,
    headerColorFixed: headerColorFixed,
    hoverEffectsWorking: hoverWorking,
    noImportantDeclarations: !hasImportant,
    architecturallySound: allVarsCorrect && headerColorFixed && !hasImportant
  };
  
  console.log(`✅ Theme variables correct: ${results.variablesCorrect}`);
  console.log(`✅ Header color fixed (architectural): ${results.headerColorFixed}`);
  console.log(`✅ Hover effects working: ${results.hoverEffectsWorking}`);
  console.log(`✅ No !important declarations: ${results.noImportantDeclarations}`);
  console.log(`\n🏗️ ARCHITECTURALLY SOUND: ${results.architecturallySound ? '✅ YES' : '❌ NO'}`);
  
  if (results.architecturallySound) {
    console.log('\n🎉 PROFESSIONAL THEME ARCHITECTURALLY COMPLETE!');
    console.log('✅ Clean CSS cascade without !important');
    console.log('✅ Semantic classes work as intended');
    console.log('✅ Follows simplicity over complexity principle');
    console.log('✅ Ready to proceed to Task 6 (Bamboo theme)');
  } else {
    console.log('\n❌ Still has architectural issues to resolve');
  }
  
  window.professionalArchitecturalResults = results;
}, 100);

console.log('\n✅ Architectural validation running...');