// Debug: Why Hardcoded Classes Break Classic-Dark but Not Kyoto
console.log('🔍 THEME HARDCODED CLASS COMPARISON');
console.log('=====================================');

// Function to analyze theme styling
function analyzeThemeStyles(themeName) {
  console.log(`\n🎨 ANALYZING ${themeName.toUpperCase()} THEME:`);
  
  // Switch to the theme
  document.documentElement.setAttribute('data-theme', themeName);
  
  // Wait for theme to apply
  setTimeout(() => {
    const headerNav = document.querySelector('header.floating-header nav.glass-panel');
    
    if (!headerNav) {
      console.log('❌ Header not found');
      return;
    }
    
    const computedStyle = window.getComputedStyle(headerNav);
    
    console.log(`📊 ${themeName} - WITH hardcoded classes:`);
    console.log(`  Background: ${computedStyle.background}`);
    console.log(`  Border: ${computedStyle.border}`);
    console.log(`  Box-shadow: ${computedStyle.boxShadow}`);
    console.log(`  Backdrop-filter: ${computedStyle.backdropFilter}`);
    
    // Check theme variables
    const rootStyle = getComputedStyle(document.documentElement);
    const themeGlassBg = rootStyle.getPropertyValue('--theme-glass-bg').trim();
    const themeGlassBorder = rootStyle.getPropertyValue('--theme-glass-border').trim();
    
    console.log(`  Theme variables:`);
    console.log(`    --theme-glass-bg: ${themeGlassBg}`);
    console.log(`    --theme-glass-border: ${themeGlassBorder}`);
    
    // Now test WITHOUT hardcoded classes
    const originalClasses = headerNav.className;
    const cleanClasses = originalClasses
      .replace(/border-white\/20/g, '')
      .replace(/backdrop-blur-xl/g, '')
      .replace(/shadow-lg/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    headerNav.className = cleanClasses;
    
    setTimeout(() => {
      const cleanStyle = window.getComputedStyle(headerNav);
      
      console.log(`📊 ${themeName} - WITHOUT hardcoded classes:`);
      console.log(`  Background: ${cleanStyle.background}`);
      console.log(`  Border: ${cleanStyle.border}`);
      console.log(`  Box-shadow: ${cleanStyle.boxShadow}`);
      console.log(`  Backdrop-filter: ${cleanStyle.backdropFilter}`);
      
      // Analyze the differences
      console.log(`🔍 ${themeName} - IMPACT ANALYSIS:`);
      
      const backgroundChanged = computedStyle.background !== cleanStyle.background;
      const borderChanged = computedStyle.border !== cleanStyle.border;
      const shadowChanged = computedStyle.boxShadow !== cleanStyle.boxShadow;
      const backdropChanged = computedStyle.backdropFilter !== cleanStyle.backdropFilter;
      
      console.log(`  Background changed: ${backgroundChanged ? '✅ YES' : '❌ NO'}`);
      console.log(`  Border changed: ${borderChanged ? '✅ YES' : '❌ NO'}`);
      console.log(`  Shadow changed: ${shadowChanged ? '✅ YES' : '❌ NO'}`);
      console.log(`  Backdrop changed: ${backdropChanged ? '✅ YES' : '❌ NO'}`);
      
      // Check CSS specificity conflicts
      console.log(`🎯 ${themeName} - SPECIFICITY CONFLICTS:`);
      
      // Test border specificity
      const themeBorderRule = `html[data-theme="${themeName}"] .glass-panel`;
      const tailwindBorderRule = `.border-white\\/20`;
      
      console.log(`  Theme rule: ${themeBorderRule} (specificity: 0,0,2,1)`);
      console.log(`  Tailwind rule: ${tailwindBorderRule} (specificity: 0,0,1,0)`);
      console.log(`  Winner: ${themeBorderRule} should win, but Tailwind utility classes have !important-like behavior`);
      
      // Restore original classes
      headerNav.className = originalClasses;
      
      // Check if theme has proper glass panel styling
      const hasThemeGlassPanelRule = document.querySelector(`style[data-theme="${themeName}"]`) || 
                                    Array.from(document.styleSheets).some(sheet => {
                                      try {
                                        return Array.from(sheet.cssRules).some(rule => 
                                          rule.selectorText && rule.selectorText.includes(`[data-theme="${themeName}"] .glass-panel`)
                                        );
                                      } catch (e) {
                                        return false;
                                      }
                                    });
      
      console.log(`  Has theme-specific .glass-panel rule: ${hasThemeGlassPanelRule ? '✅ YES' : '❌ NO'}`);
      
    }, 50);
  }, 50);
}

// Test both themes
console.log('🧪 TESTING THEME BEHAVIOR WITH/WITHOUT HARDCODED CLASSES');

// Store original theme
const originalTheme = document.documentElement.getAttribute('data-theme');

// Test Classic Dark
analyzeThemeStyles('classic-dark');

// Test Kyoto after a delay
setTimeout(() => {
  analyzeThemeStyles('kyoto');
  
  // Restore original theme after testing
  setTimeout(() => {
    document.documentElement.setAttribute('data-theme', originalTheme);
    
    console.log('\n🎯 EXPLANATION OF WHY HARDCODED CLASSES AFFECT THEMES DIFFERENTLY:');
    console.log('================================================================');
    console.log('');
    console.log('1. CSS SPECIFICITY BATTLE:');
    console.log('   - Theme CSS: html[data-theme="X"] .glass-panel (specificity: 0,0,2,1)');
    console.log('   - Tailwind: .border-white\\/20 (specificity: 0,0,1,0)');
    console.log('   - BUT: Tailwind utilities often have higher effective specificity');
    console.log('');
    console.log('2. THEME IMPLEMENTATION DIFFERENCES:');
    console.log('   - Some themes might have stronger CSS rules that override Tailwind');
    console.log('   - Others might have weaker rules that get overridden');
    console.log('');
    console.log('3. CSS CASCADE ORDER:');
    console.log('   - Theme CSS files are imported in different orders');
    console.log('   - Later imports can override earlier ones');
    console.log('');
    console.log('4. VARIABLE CONFLICTS:');
    console.log('   - Hardcoded classes ignore CSS custom properties');
    console.log('   - They force specific values regardless of theme variables');
    console.log('');
    console.log('💡 SOLUTION: Remove hardcoded classes and let theme CSS handle everything');
    
  }, 2000);
}, 1000);

console.log('\n⏳ Running theme comparison tests...');